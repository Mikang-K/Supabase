import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// 모델 설정 (사용자 요청에 따라 gemini-2.0-flash 혹은 1.5-flash 사용 가능)
const LLM_MODEL = "gemini-2.5-flash"; 
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${LLM_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// Gemini 호출 헬퍼 함수
async function callGemini(systemRole: string, userPrompt: string, isJson: boolean = true) {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemRole }] },
      generationConfig: {
        responseMimeType: isJson ? "application/json" : "text/plain",
      }
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  
  const content = data.candidates[0].content.parts[0].text;
  return isJson ? JSON.parse(content) : content;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json();
    const { 
      user_id, story_id, next_direction, genre_desc, 
      user_title = "", manual_characters = [] 
    } = body;

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. 유저 잔액 확인
    const { data: wallet } = await supabaseClient.from('wallets').select('balance').eq('user_id', user_id).single();
    if (!wallet || wallet.balance < 5) throw new Error("최소 5토큰이 필요합니다.");

    let token_cost = 1; 
    let contextSnippets: string[] = [];
    let lastEpisode = null;
    const isNewStory = !story_id;

    // --- [RLM 로직: 이어쓰기 시] ---
    if (!isNewStory) {
      const { data: history } = await supabaseClient
        .from('story_contents')
        .select('order_index, content')
        .eq('story_id', story_id)
        .order('order_index');

      if (history && history.length > 0) {
        lastEpisode = history[history.length - 1];

        // [Step 1: Decomposition - Gemini로 계획 수립]
        const planSystem = "소설 데이터베이스 분석가입니다. 지침을 분석하여 복선 확인이 필요한 과거 에피소드 번호를 최대 3개 선택하세요.";
        const planUser = `지침: "${next_direction}"\n과거 에피소드 목록: ${history.map(h => h.order_index).join(', ')}\n반드시 JSON 형식으로 응답하세요: {"plan": [{"idx": 번호, "reason": "이유"}]}`;
        
        const { plan } = await callGemini(planSystem, planUser, true);

        // [Step 2: Examination - 동적 실시간 요약]
        if (plan && plan.length > 0) {
          for (const task of plan) {
            const target = history.find(h => h.order_index === task.idx);
            if (!target) continue;

            const examSystem = "소설 요약 전문가입니다. 원문에서 질문에 해당하는 핵심 정보만 한 문장으로 추출하세요.";
            const examUser = `원문: ${target.content}\n질문: ${task.reason}`;
            
            const summary = await callGemini(examSystem, examUser, false); // 텍스트로 받음
            contextSnippets.push(`[${task.idx}화 기록]: ${summary}`);
            token_cost += 2; 
          }
        }
      }
    }

    // --- [Step 3: Synthesis - 최종 집필] ---
    let systemMsg = "";
    let userMsg = "";

    if (isNewStory) {
      systemMsg = `당신은 새로운 소설을 시작하는 거장 작가입니다. 첫 화이므로 세계관과 인물을 매력적으로 도입하세요. 문학적이고 서정적인 산문체. 인물의 내면 심리를 현미경처럼 들여다보는 집요한 묘사의 문체 사용.`;
      userMsg = `제목: ${user_title}\n장르: ${genre_desc}\n등장인물: ${manual_characters.join(', ')}\n위 정보를 바탕으로 소설의 1화를 집필하고 JSON으로 응답하세요.`;
    } else {
      systemMsg = `당신은 연재 소설의 다음 화를 쓰는 작가입니다. 제공된 과거 기록과 일관성을 유지하세요. 문학적이고 서정적인 산문체. 인물의 내면 심리를 현미경처럼 들여다보는 집요한 묘사 사용.`;
      userMsg = `[추출된 과거 복선]\n${contextSnippets.join('\n')}\n\n[이전 줄거리]\n${lastEpisode?.content.substring(0, 500)}\n\n[다음 지침]\n${next_direction}\n\n위 내용을 이어 제 ${lastEpisode!.order_index + 1}화를 집필하고 JSON으로 응답하세요.`;
    }

    const finalJson = await callGemini(
      systemMsg, 
      userMsg + '\n형식: {"title": "제목", "content": "본문", "summary": "요약", "next_options": ["옵션1", "옵션2", "옵션3"]}', 
      true
    );

    // 4. DB 저장 및 결과 반환
    let finalId = story_id;
    if (isNewStory) {
      const { data: story } = await supabaseClient.from('stories').insert({
        user_id, title: user_title || finalJson.title, summary: finalJson.summary, genre_desc, next_options: finalJson.next_options
      }).select().single();
      finalId = story.id;
      await supabaseClient.from('story_contents').insert({ story_id: finalId, content: finalJson.content, order_index: 1 });
    } else {
      await supabaseClient.from('story_contents').insert({ story_id, content: finalJson.content, order_index: lastEpisode.order_index + 1 });
      await supabaseClient.from('stories').update({ summary: finalJson.summary, next_options: finalJson.next_options }).eq('id', story_id);
    }

    await supabaseClient.from('wallets').update({ balance: wallet.balance - token_cost }).eq('user_id', user_id);

    return new Response(JSON.stringify({ ...finalJson, story_id: finalId, used_tokens: token_cost }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
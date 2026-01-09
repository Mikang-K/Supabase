// supabase/functions/generate-novel/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function cleanJSON(text: string) {
  try {
    let cleaned = text.trim();
    // Markdown 코드 블록 제거
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```/, "").replace(/```$/, "");
    }
    return cleaned.trim();
  } catch (e) {
    return text;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const { 
      character_ids, 
      manual_characters = [], // 직접 작성한 인물 리스트
      user_id, 
      story_id, 
      mode = 'generate', 
      user_title = "",
      relationship_desc = "",
      genre_desc = "판타지",
      total_episodes = 20,
      next_direction = ""
    } = body
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let storyInfo = null;

    // 1. 데이터 준비
    const { data: wallet } = await supabaseClient.from('wallets').select('balance').eq("user_id", user_id).single();
    if (!wallet || wallet.balance < 1) throw new Error("토큰이 부족합니다.");

    let presetCharacters = [];
    if (character_ids?.length > 0) {
      const { data } = await supabaseClient.from('characters').select('*').in("id", character_ids);
      presetCharacters = data || [];
    }

    // 2. 현재 화수 계산
    let currentEpisode = 1;
    if (story_id) {
      const { data: existingStory, error: storyError } = await supabaseClient
        .from('stories')
        .select('*')
        .eq('id', story_id)
        .single();
      
      if (existingStory) {
        storyInfo = existingStory; // 변수에 데이터 할당
        // 현재 몇 화인지 계산
        const { count } = await supabaseClient
          .from('story_contents')
          .select('*', { count: 'exact', head: true })
          .eq('story_id', story_id);
        currentEpisode = (count || 0) + 1;
      }
    }
    const displayTitle = user_title || storyInfo?.title || "새로운 이야기";
    const displayGenre = storyInfo?.genre_desc || genre_desc;

    let presetNames = "";

    if (character_ids?.length > 0) {
      const { data: chars } = await supabaseClient.from('characters').select('name').in("id", character_ids);
      presetNames = chars?.map(c => c.name).join(', ') || "";
    }
    const manualCharContext = manual_characters.length > 0 ? `, ${manual_characters.join(', ')}` : "";

    const isFinalEpisode = currentEpisode >= total_episodes;

    // 3. AI 프롬프트 구성
    const charContext = [
      ...presetCharacters.map(c => `${c.name}(프리셋)`),
      ...manual_characters.map((c: string) => `${c}(사용자 정의)`)
    ].join(', ');

    // 3. AI 요청 프롬프트
    const systemInstruction = `
[페르소나: 전문 고스트라이터]
- 아이덴티티: 의뢰인(사용자)의 요구를 완벽하게 문장으로 구현하는 익명의 고스트라이터.
- 태도: 정중하고 냉철하며, 오로지 의뢰인의 예술적 비전을 훼손하지 않고 극대화하는 데 집중함.

[작품 정보]
- 제목: ${displayTitle || "자동 생성"}
- 장르 및 분위기: ${displayGenre}
- 등장인물: ${presetCharacters?.map(c => c.name).join(', ')}${manualCharContext}
- 인물 관계: ${relationship_desc}
- 현재 화수: ${currentEpisode}화 / 총 ${total_episodes}화

[집필 규칙]
- 문체: 문학적이고 서정적인 산문체. 인물의 내면 심리를 현미경처럼 들여다보는 집요한 묘사.
- 금기: 이미 사용한 소재는 반복하지 않으며, 이전 설정을 유지하며 매번 새로운 에피소드를 구성합니다. 직접적인 성격 묘사(MBTI, 형용사 등) 금지. 인물의 습관, 시선의 높이, 주변 사물의 상태, 은유를 통해서만 인물의 상태를 암시할 것.
- 이번 화 지시: ${next_direction || "이야기를 시작하세요."}
- ${isFinalEpisode ? "완결 회차입니다. 서사를 마무리하세요." : "다음 화가 기대되도록 끝맺음하세요."}

[출력 규칙]
반드시 아래 JSON 형식으로만 응답하며, JSON형식 이외의 추가 문구를 절대로 작성하지 않도록 합니다.
-출력 예시:
{
  "title": "소제목",
  "content": "2000자 내외의 본문 내용",
  "summary": "전체 줄거리 요약",
  "next_options": ["다음 전개 제안 1", "다음 전개 제안 2", "다음 전개 제안 3"],
  "is_finished": ${isFinalEpisode}
}`;

    // 4. Gemini API 호출 및 상세 에러 핸들링
    const LLM_MODEL = "gemini-2.5-flash"
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${LLM_MODEL}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: systemInstruction }] }] })
    });

    if (!geminiRes.ok) {
      const errorData = await geminiRes.text();
      throw new Error(`Gemini API 오류: ${geminiRes.status} - ${errorData}`);
    }

    const result = await geminiRes.json();
    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log("AI Raw Result:", JSON.stringify(result, null, 2)); // 디버그용 전체 응답 로그

    let parsed;
    try {
      const cleaned = cleanJSON(rawText);
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("JSON Parse Failed. Cleaned Text:", cleanJSON(rawText));
      throw new Error("AI 응답 형식이 올바르지 않습니다. 다시 시도해 주세요.");
    }
    
    const finalTitle = user_title || storyInfo?.title || parsed.title || "무제";
    console.log("Parsed JSON Object:", parsed); // 디버그용 파싱된 JSON 데이터 로그

    // 4. DB 저장 로직 (next_options 포함)
    
    let finalStoryId = story_id;
    if (mode === 'continue' && story_id) {
      await supabaseClient.from('story_contents').insert({ 
        story_id, content: parsed.content, order_index: currentEpisode 
      });
      // 최신 추천 전개를 stories 테이블에 업데이트
      await supabaseClient.from('stories').update({ 
        summary: parsed.summary, 
        next_options: parsed.next_options 
      }).eq('id', story_id);
    } else {
      const { data: newStory } = await supabaseClient.from('stories').insert({ 
        user_id, 
        title: user_title || parsed.title, 
        summary: parsed.summary,
        total_episodes,
        next_options: parsed.next_options, // 초기 추천 저장
        genre_desc // 상세 페이지에서 이어쓰기 시 참조 위해 저장
      }).select().single();
      
      if (!newStory) throw new Error("스토리 생성 후 데이터를 불러올 수 없습니다.");
      
      finalStoryId = newStory.id;
      await supabaseClient
      .from('story_contents')
      .insert({ story_id: finalStoryId,
        content: parsed.content, 
        order_index: 1 });
      }
      
      return new Response(JSON.stringify({ ...parsed, story_id: finalStoryId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
      
    }
    catch (error: any) {
      console.error("Database Transaction Error:", error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    await supabaseClient.from('wallets').update({ balance: wallet.balance - 1 }).eq('user_id', user_id);
    console.log("Token Changed: ", wallets.balance); // 디버그용 파싱된 JSON 데이터 로그
});
// supabase/functions/generate-novel/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const { 
      character_ids, scenario_id, user_id, story_id, 
      mode = 'generate', plot_notes = "", genre = "판타지",
      custom_characters = "", custom_scenario = "" // 직접 입력 필드 추가
    } = body
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const walletReq = supabaseClient.from('wallets').select('balance').eq("user_id", user_id).maybeSingle();
    const charReq = (character_ids && character_ids.length > 0)
    ? supabaseClient.from('characters').select('*').in("id", character_ids)
    : Promise.resolve({ data: [] });
    const scenReq = scenario_id
    ? supabaseClient.from("scenarios").select('*').eq('id', scenario_id).maybeSingle()
    : Promise.resolve({ data: null });
    const [walletRes, charRes, scenRes] = await Promise.all([walletReq, charReq, scenReq]);

    const wallet = walletRes.data;
    const presetCharacters = charRes.data;
    const presetScenario = scenRes.data;

    if (!wallet || wallet.balance < 1) throw new Error("토큰이 부족합니다.")

    const finalCharacters = custom_characters 
      ? custom_characters 
      : (presetCharacters?.map(c => `- ${c.name}: ${c.personality_tags?.join(', ')}, 말투: ${c.dialogue_style}`).join('\n') || "");
    
    const finalScenario = custom_scenario 
      ? custom_scenario 
      : (presetScenario?.setting_text || "");

    if (!finalCharacters) throw new Error("등장인물 설정이 없습니다.");
    if (!finalScenario) throw new Error("배경 시나리오 설정이 없습니다.");

    let currentSummary = ""
    if (story_id) {
      const { data: story } = await supabaseClient.from('stories').select('summary').eq('id', story_id).maybeSingle()
      currentSummary = story?.summary || ""
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    const prompt = `전문 웹소설 작가로서 다음 설정으로 장면을 웹소설 형식으로 작성합니다. 본문 내용은 최소 3000자 이상으로 작성하도록 합니다. 응답은 반드시 JSON 코드 블록 하나만 출력하고, 그 외에 어떠한 설명이나 분석도 덧붙이지 마세요.
장르: ${genre}

[등장인물 설정]
${finalCharacters}

[배경 및 상황 설정]
${finalScenario}

[고정 설정 및 복선]
${plot_notes}

[현재까지 줄거리 요약]
${currentSummary || "이야기의 시작점입니다."}

반드시 JSON으로만 응답:
{ "title": "${mode === 'generate' ? '매력적인 제목' : 'N/A'}", "content": "풍부한 묘사와 대사가 포함된 본문", "summary": "지금까지의 내용을 포함한 전체 줄거리 요약" }`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    })

    const result = await response.json()
    if (result.error) {
      console.error("Google API Error:", result.error);
      throw new Error(`AI API 오류: ${result.error.message}`);
    }
    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text
    if (!rawText) throw new Error("AI 응답 생성 실패")

    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("유효한 JSON 응답을 찾을 수 없습니다.")
    console.log("Raw AI Response:", rawText);
    const parsed = JSON.parse(jsonMatch[0])

    await supabaseClient.from('wallets').update({ balance: wallet.balance - 1 }).eq('user_id', user_id)

    let finalStoryId = story_id
    if (mode === 'regenerate' && story_id) {
      const { data: last } = await supabaseClient.from('story_contents').select('id').eq('story_id', story_id).order('order_index', { ascending: false }).limit(1).single()
      if (last) await supabaseClient.from('story_contents').update({ content: parsed.content }).eq('id', last.id)
      await supabaseClient.from('stories').update({ summary: parsed.summary, plot_notes }).eq('id', story_id)
    } else if (mode === 'continue' && story_id) {
      await supabaseClient.from('stories').update({ summary: parsed.summary, plot_notes }).eq('id', story_id)
      const { data: last } = await supabaseClient.from('story_contents').select('order_index').eq('story_id', story_id).order('order_index', { ascending: false }).limit(1).single()
      await supabaseClient.from('story_contents').insert({ story_id, content: parsed.content, order_index: (last?.order_index || 0) + 1 })
    } else {
      const { data: newStory, error: insertError } = await supabaseClient.from('stories').insert({ 
        user_id, title: parsed.title, summary: parsed.summary, plot_notes 
      }).select().maybeSingle()
      if (insertError) throw new Error(`저장 실패: ${insertError.message}`)
      finalStoryId = newStory.id
      await supabaseClient.from('story_contents').insert({ story_id: finalStoryId, content: parsed.content, order_index: 1 })
    }

    return new Response(JSON.stringify({ ...parsed, story_id: finalStoryId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
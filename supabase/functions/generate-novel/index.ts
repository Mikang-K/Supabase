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
      summary = "", 
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
    let summaryPrev = "";

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
        currentEpisode = mode === 'rewrite' ? (count || 1) : (count || 0) + 1;
        summaryPrev = storyInfo.summary || "";
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
    
    //AI 프롬프트 구성
    const formattedPresets = presetCharacters.map(c => {
    const tags = c.personality_tags ? `\n  - Personality: ${c.personality_tags.join(', ')}` : '';
    const style = c.dialogue_style ? `\n  - Speech Style: ${c.dialogue_style}` : '';
    
    return `■ ${c.name} (${c.age_group}/${c.gender})
    - Description: ${c.description}${tags}${style}`;
    });

    // 사용자 정의 인물 포맷팅 ([(이름): 설명] 형식 대응)
    const formattedManuals = manual_characters.map((c: string) => {
    // 유저가 입력한 형식을 그대로 쓰되, '사용자 정의'임을 명시
    return `■ ${c} (User-defined character)`;
    });

    // 전체 캐릭터 컨텍스트 병합
    const charContext = [...formattedPresets, ...formattedManuals].join('\n\n');
    
    // AI 요청 프롬프트
    const systemInstruction = `
    [Persona: Professional Ghostwriter]
    - Your goal is to realize the user's artistic vision with perfect prose.
    - Prioritize logical consistency and deep psychological tracking of characters.

    [Absolute Rules]
    1. Character Integrity: Maintain gender, age, and personality defined in profiles 100%.
    2. Show, Don't Tell: Avoid direct adjectives. Use metaphors, sensory details, and actions.
    3. Language: Write the novel "content" in natural, high-quality Korean.
    4. Format: Respond strictly in JSON.
    5. [Character Handling]
    - Preset characters have 'Personality Tags' and 'Speech Style'. You MUST reflect these traits in their internal monologues and dialogues.
    - For user-defined characters, strictly follow the provided description.
    - Ensure consistent linguistic patterns for each character based on their 'Speech Style'.

    [JSON Schema]
    {
    "title": "Episode Subtitle",
    "content": "Full story text (approx 2000 characters)",
    "summary": "Plot summary",
    "next_options": ["Option 1", "Option 2", "Option 3"],
    "is_finished": boolean
    }
    `;

    const FEW_SHOT_EXAMPLES = [
      {
        role: "user",
        parts: [{ 
          text: `[Current Episode Info]
          - Genre: 어반 판타지
          - Direction: 주인공들이 등장하는 도입부

          [Characters]
          There are multiple characters involved. Track each character's location and current status carefully to avoid logical contradictions.
          ■ 백호우 (청년/남성)
            - Description: 냉철하고 빈틈없는 젊은 검사. '백호'라는 별명을 가짐.
            - Personality: 정중함, 엄격함, 예리함
            - Speech Style: 신중하고 권위 있는 말투
          ■ 박상준 (중년/남성)
            - Description: '주기 선생'이라 불리는 주술사. 겉모습은 속물적임.
            - Personality: 건들거림, 능청스러움
            - Speech Style: 반말과 비속어가 섞인 거친 말투`
        }]
      },
      {
        role: "model",
        parts: [{text: JSON.stringify({
          "title": "생령 살인",
          "content":`"어서 오십시오."\n 책상에 앉아 있는 백호가 정중하면서 엄하게 말했다. 막 문을 열고 주변을 두리번거리며 들어선 남자는 건들거리며 물었다.\n"당신이 백호요?"\n"그렇습니다."\n"이 방, 번호가 100호실이던데......"\n"그렇습니다."\n"그래서 백호라 불리는 거요? 아니면......"\n그러자 백호는 웃으며 입에 물고 있는 빈 담배를 옆으로 능숙하게 돌리며 말했다.\n"제 이름이 궁금하신가 보군요. 이름은 호우라고 합니다."\n백호가 자신이 책상 위에 놓인 명패를 살짝 건드려 보았다.'검사 백호우'라는 글자를 본 남자는 피식 웃었다.\n"본명과 별명에 직책이 한 덩어리시네? 재미있군. 이렇게 젊은 나이에 높은 검사시고."\n남자가 말하자 백호는 대답하지 않고 살짝 웃었다. 그리고 미소를 거두며 손짓으로 맞은편에 있는 의자를 가리켜 보았다. 남자는 역시 건들거리는 걸음으로 태연히 다가가 털썩 주저앉았다.\n"그런데 그런 분이 나 같은 사람은 왜 찾은 겁니까?"\n백호는 조용하지만 빈틈없는 시선으로 남자를 바라보며 말했다.\n"박상준 씨 맞으시죠?"\n"그렇소."\n"보통 주기 선생이라고 불리신다고 들었습니다만."\n"거 누구한테 들었소?"\n상준이 눈썹을 씰룩거렸다. 지금은 평범한 옷차림이다. 아니 어떻게 보면 보통 사람보다 조금 튀는 옷차림을 하고 있는 셈이다. 한눈에도 값비싸 보이는 황색 가죽점퍼를 입고, 신고 있는 구두나 하의 역시 돈깨나 들었을 것같이 보인다. 그러나 전반적으로는 조화가 잘되지 않고, 간판처럼 명품을 두른 것 같아 미묘하게 속물스럽게 느껴진다. 보통 사람과 다른 면이 있다면 코 밑은 깨끗하게 정리하고 턱 밑에만 기른 특이한 수염뿐, 그 외에는 조금도 특이한 기색이 느껴지지 않는 평범한 얼굴이다. 백호는 그런 감상을 드러내지 않고 조용히 말했다.\n"탁 터놓고 이야기해 봅시다. 저는 잘 모릅니다만 십이지번이던가요? 그런 주술을 사용하실 줄 안다고 들었습니다만..."`,
          "summary":"젊은 검사 백호우가 '주기 선생'이라 불리는 박상준을 자신의 집무실(100호실)로 불러, 그가 가진 '십이지번'이라는 주술 능력에 대해 언급하며 본격적인 대화를 시작",
          "next_options":["[어반 판타지/수사물]: 백호우 검사가 과학적으로 풀리지 않는 미제 사건의 증거 사진을 내밀며, 박상준에게 주술을 이용한 비밀 수사 협조를 제안합니다.", "[스릴러/액션]: 사실 박상준을 시험하려 했던 백호우가 갑자기 자객의 습격을 받게 되고, 박상준이 그 자리에서 십이지번 주술을 선보이며 위기를 모면합니다.", "[미스터리/드라마]: 박상준이 자신의 능력을 부인하며 발뺌하자, 백호우가 그의 과거 행적이 담긴 극비 문서를 꺼내 놓으며 주술의 배후에 있는 거대 조직에 대해 압박하기 시작합니다."],
          "is_finished": false
        }) }]
      },
      {
        role: "user",
        parts: [{ 
          text: `[Current Episode Info]
          - Genre: 판타지/어드벤처
          - Direction: 평화로운 아침, 남동생이 까마귀들에게 납치당하는 도입부

          [Characters]
          There are multiple characters involved. Track each character's location and current status carefully to avoid logical contradictions.
          ■ 프루 (청년/여성)
            - Description: 관찰력이 뛰어나고 책임감이 강한 소녀.
            - Personality: 신중함, 분석적임
          ■ 엄마 (중년/여성)
            - Description: 뜨개질을 좋아하는 다정한 어머니.
            - Speech Style: 부드럽고 일상적인 말투`
        }]
      },
      {
        role: "model",
        parts: [{text: JSON.stringify({
          "title": "까마귀 떼",
          "content":`어떻게 까마귀 다섯 마리가 9킬로그램짜리 아기를 공중으로 들어올렸는지 프루의 머리로는 도무지 이해가 가지 않았지만, 틀림없이 그 점은 걱정거리 축에도 끼지 못했다. 사실 그때 거기 놀이터 벤치에 앉아 남동생 맥이 까마귀 다섯 마리에게 납치당해 하늘로 날아가는 모습을 뭔가에 홀린 것처럼 보고 있을 때, 프루에게 머릿속으로 무슨 걱정을 하는지 나열해보라고 했다면 어떻게 그런 묘기가 가능한지 알아내는 일은 가장 뒷전으로 밀렸을 것이다. 가장 큰 걱정거리는 자신이 책임지고 돌보던 어린 남동생이 새들한테 납치당했다는 사실이었다. 그 다음으로는 새들이 왜 그런 짓을 했을까 하는 점이다.\n 그날은 정말로 멋진 날이었다.\n 그날 아침에 눈을 떴을 때는 날씨가 약간 흐렸지만 포틀랜드의 9월 날씨야 원래 그렇지 않던가? 프루는 침실 블라인드를 올리고 잠깐 멈춰서서 뿌옇고 어슴푸레한 하늘을 액자처럼 담은 유리창 밖으로 나뭇가지를 내다보았다. 그날은 토요일이었다. 아래층에서 커피와 아침식사 냄새가 솔솔 올라왔다. 아래층 풍경은 여느 토요일과 같으리라. 아빠는 신문에 코를 박은 채 가끔 뜨뜻한 머그잔의 커피를 홀짝거리고, 엄마는 다초점 뿔테 안경을 쓰고 아직 모양이 정해지지 않은 뜨개질감을 바라볼 것이다. 한 살짜리 남동생은 키 높은 아기용 의자에 앉아 알아들을 수 없는 옹알이로 머나먼 경계를 탐험하고 있겠지. 두스! 두스! 아니나 다를까. 따뜻한 침대를 박차고 아래층 부엌으로 내려왔을 때 프루의 상상은 정확히 맞아떨어졌다. 아빠는 아침인사를 건넸고, 엄마의 눈은 안경 너머로 미소를 보내고, 동생은 "푸우!"라고 소리쳤다. 프루는 손수 시리얼을 그릇에 담았다.\n"베이컨도 있어" 엄마는 이렇게 말한 뒤 아메바처럼 생긴 뜨개질감에 다시 주의를 기울였다 (스웨터일까? 찻주전다 덮개일까? 아니면 올가미?)`,
          "summary":"평화로운 토요일 아침, 프루가 돌보던 남동생 맥이 까마귀 떼에 납치당하는 비현실적인 사건이 발생함.",
          "next_options":["프루가 자전거를 타고 까마귀 떼를 추격하기 시작한다","부모님에게 이 사실을 알리려 하지만 아무도 믿지 않는다.","맥이 떨어뜨린 기묘한 물건을 발견하고 사건의 단서를 찾는다."],
          "is_finished": false
        }) }]
      }
    ];

    // 4. Gemini API 호출 및 상세 에러 핸들링
    const LLM_MODEL = "gemini-2.5-pro"
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${LLM_MODEL}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {parts: [{text: systemInstruction}]},
        contents: [
          ...FEW_SHOT_EXAMPLES,
          {
            role: "user",
            parts: [{text:`
              [Current Episode Info]
              - Title: ${displayTitle}
              - Genre: ${displayGenre}
              - Progress: ${currentEpisode} / ${total_episodes}
              - Summary: ${summaryPrev}
              - is_finished: ${isFinalEpisode}

              [Characters]
              There are multiple characters involved. Track each character's location and current status carefully to avoid logical contradictions.
              ${charContext}

              [Current Context]
              - Relationship/Situation: ${relationship_desc}
              - Direction: ${next_direction || "이야기를 시작하거나 자연스럽게 이어가세요."}
              `}]
          }

        ],
        generationConfig:{
          responseMimeType: "application/json",
          temperature: 0.8
        },
        safetySettings: [
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
          })
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
    }else if (mode === 'rewrite' && story_id) {
      // 현재 화(currentEpisode)의 내용을 업데이트
      const { error: updateError } = await supabaseClient
        .from('story_contents')
        .update({ content: parsed.content })
        .eq('story_id', story_id)
        .eq('order_index', currentEpisode);

      if (updateError) throw updateError;

      // 요약 및 추천 옵션도 최신화
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

      await supabaseClient.from('wallets').update({ balance: wallet.balance - 1 }).eq('user_id', user_id);
      console.log("Token Changed: ", wallet.balance); // 디버그용 파싱된 JSON 데이터 로그
      
      return new Response(JSON.stringify({ ...parsed, story_id: finalStoryId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
      
    }
    catch (error: any) {
      console.error("Error:", error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

});
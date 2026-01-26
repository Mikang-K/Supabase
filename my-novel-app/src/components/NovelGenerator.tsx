// src/components/NovelGenerator.tsx
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Sparkles, Users, Tag, Type, Clock, UserPlus, X, Filter } from 'lucide-react';

export default function NovelGenerator({ characters, userId }: any) {
  const router = useRouter();
  const [selectedChars, setSelectedChars] = useState<any[]>([]);
  const [manualChars, setManualChars] = useState<string[]>([]);
  const [charInput, setCharInput] = useState('');
  
  // 탭 관련 상태 (CUSTOM, MANUAL)
  const [activeTab, setActiveTab] = useState<'CUSTOM' | 'MANUAL'>('CUSTOM');

  const [userTitle, setUserTitle] = useState('');
  const [relationshipDesc, setRelationshipDesc] = useState('');
  const [genreDesc, setGenreDesc] = useState('');
  const [totalEpisodes, setTotalEpisodes] = useState(20);
  const [loading, setLoading] = useState(false);

  // 대분류 필터링 로직
  const filteredCharacters = useMemo(() => {
    return characters;
  }, [characters, activeTab]);

  const addManualCharacter = () => {
    if (charInput.trim() && !manualChars.includes(charInput.trim())) {
      setManualChars([...manualChars, charInput.trim()]);
      setCharInput('');
    }
  };

  const handleGenerate = async () => {
    if (selectedChars.length === 0 && manualChars.length === 0) return alert('등장인물을 최소 한 명은 설정해 주세요.');
    if (!genreDesc.trim()) return alert('집필 지침을 작성해 주세요.');
    
    setLoading(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase.functions.invoke('generate-novel', {
        body: { 
          user_id: userId,
          character_ids: selectedChars.map(c => c.id),
          manual_characters: manualChars,
          user_title: userTitle,
          relationship_desc: relationshipDesc,
          genre_desc: genreDesc,
          total_episodes: totalEpisodes,
          mode: 'generate',
        },
      });

      console.log("=== Edge Function Full Response ===");
      console.log("Data:", data);
      console.log("Error:", error);

      if (error) throw error;
      router.push(`/stories/${data.story_id}`);
    } catch (err: any) {
      alert(`집필 오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-20">
      {/* 상단 제목 및 설정 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 space-y-2">
          <label className="flex items-center gap-2 font-bold text-slate-700 text-sm ml-1 dark:text-slate-100">
            <Type size={16} className="text-blue-500"/> 작품 제목
          </label>
          <input 
            type="text"
            className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold"
            placeholder="미입력 시 AI가 제목을 생성합니다."
            value={userTitle}
            onChange={(e) => setUserTitle(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 font-bold text-slate-700 text-sm ml-1 dark:text-slate-100">
            <Clock size={16} className="text-blue-500"/> 연재 목표
          </label>
          <select 
            className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold outline-none cursor-pointer"
            value={totalEpisodes}
            onChange={(e) => setTotalEpisodes(Number(e.target.value))}
          >
            {[10, 20, 30, 50].map(v => <option key={v} value={v}>{v}화 완결</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* 통합 인물 설정 섹션 */}
        <div className="lg:col-span-5 space-y-6 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="space-y-4">
            <label className="flex items-center gap-2 font-bold text-slate-700 text-sm ml-1">
              <Users size={16} className="text-blue-500"/> 인물 설정
            </label>

            {/* 탭 네비게이션 */}
            <div className="flex bg-slate-100 p-1 rounded-2xl">
              {([ 'CUSTOM', 'MANUAL'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-[11px] font-black rounded-xl transition-all ${
                    activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab === 'MANUAL' ? '직접 작성' : tab}
                </button>
              ))}
            </div>

            {/* 탭 콘텐츠 영역 */}
            <div className="min-h-[300px]">
              {activeTab === 'MANUAL' ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="relative">
                    <textarea 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-blue-500 h-40 resize-none leading-relaxed" 
                      placeholder="인물의 이름, 나이, 성격, 특징을 상세히 적어주세요.&#13;&#10;예: 한소희(23) - 차갑고 도도한 외모와 달리 길고양이에게 밥을 주는 따뜻한 심성의 소유자." 
                      value={charInput}
                      onChange={(e) => setCharInput(e.target.value)}
                    />
                    <button 
                      onClick={addManualCharacter}
                      className="absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                    >
                      <UserPlus size={16}/>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {manualChars.map((name, i) => (
                      <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-[11px] font-black">
                        {name.split('(')[0]} 
                        <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => setManualChars(manualChars.filter((_, idx) => idx !== i))}/>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1 animate-in fade-in duration-300">
                  {filteredCharacters.length > 0 ? (
                    filteredCharacters.map((c: any) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedChars(prev => prev.find(item => item.id === c.id) ? prev.filter(item => item.id !== c.id) : [...prev, c])}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          selectedChars.find(item => item.id === c.id) ? 'border-blue-600 bg-blue-50' : 'border-slate-50 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold text-slate-800 text-xs truncate">{c.name}</div>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-2 py-20 text-center text-slate-300 text-xs font-bold">해당 카테고리에 캐릭터가 없습니다.</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">인물 관계 및 초기 설정</label>
            <textarea 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-24 outline-none focus:border-blue-500 text-xs"
              placeholder="인물 간의 관계나 소설의 시작 상황을 입력하세요."
              value={relationshipDesc}
              onChange={(e) => setRelationshipDesc(e.target.value)}
            />
          </div>
        </div>

        {/* 집필 지침 섹션 */}
        <div className="lg:col-span-7 space-y-6 bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col min-h-[600px]">
          <label className="text-sm font-black text-blue-400 flex items-center gap-2 uppercase tracking-wider">
            <Tag size={18}/> 세계관 및 집필 지침
          </label>
          <textarea 
            className="flex-1 w-full p-6 bg-slate-800 border-2 border-slate-700 rounded-[1.5rem] outline-none focus:border-blue-500 text-base leading-relaxed resize-none"
            placeholder="장르, 문체, 분위기 등을 상세히 적어주세요. 많이 적을수록 고스트라이터가 당신의 의도를 정확히 파악합니다."
            value={genreDesc}
            onChange={(e) => setGenreDesc(e.target.value)}
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !genreDesc.trim()}
            className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-3xl transition shadow-xl flex items-center justify-center gap-3"
          >
            {loading ? "고스트라이터가 집필 중..." : <><Sparkles size={20}/> 집필 시작하기</>}
          </button>
        </div>
      </div>
    </div>
  );
}
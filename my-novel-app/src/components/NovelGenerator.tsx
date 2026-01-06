// src/components/NovelGenerator.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Sparkles, UserPlus, Settings2 } from 'lucide-react';

export default function NovelGenerator({ characters, scenarios, userId }: any) {
  const [useCustomMode, setUseCustomMode] = useState(false); // 직접 입력 모드 여부
  const [selectedChars, setSelectedChars] = useState<string[]>([]);
  const [selectedScen, setSelectedScen] = useState('');
  
  // 직접 입력 상태
  const [customChars, setCustomChars] = useState('');
  const [customScen, setCustomScen] = useState('');
  
  const [genre, setGenre] = useState('로맨스 판타지');
  const [plotNotes, setPlotNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [storyData, setStoryData] = useState({ id: null, title: '', summary: '' });
  const [contents, setContents] = useState<string[]>([]);

  const supabase = createClient();

  const handleGenerate = async (mode: 'generate' | 'continue' | 'regenerate' = 'generate') => {
    if (!useCustomMode && (selectedChars.length === 0 || !selectedScen)) return alert('캐릭터와 시나리오를 선택하세요!');
    if (useCustomMode && (!customChars || !customScen)) return alert('설정 내용을 상세히 입력해주세요!');
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-novel', {
        body: { 
          character_ids: useCustomMode ? [] : selectedChars, 
          scenario_id: useCustomMode ? null : selectedScen,
          custom_characters: useCustomMode ? customChars : "",
          custom_scenario: useCustomMode ? customScen : "",
          user_id: userId,
          story_id: (mode === 'continue' || mode === 'regenerate') ? storyData.id : null,
          mode,
          plot_notes: plotNotes,
          genre: genre
        },
      });

      if (error) throw error;
      setStoryData({ id: data.story_id, title: data.title || storyData.title, summary: data.summary });
      
      if (mode === 'continue') setContents(prev => [...prev, data.content]);
      else if (mode === 'regenerate') setContents(prev => [...prev.slice(0, -1), data.content]);
      else setContents([data.content]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* 입력 방식 전환 */}
      <div className="flex bg-slate-200 p-1 rounded-2xl w-fit">
        <button 
          onClick={() => setUseCustomMode(false)}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition ${!useCustomMode ? 'bg-white shadow-sm' : 'text-slate-500'}`}
        >
          기존 설정 선택
        </button>
        <button 
          onClick={() => setUseCustomMode(true)}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition ${useCustomMode ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
        >
          직접 상세 설정
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          {useCustomMode ? (
            /* 직접 상세 입력 모드 */
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="space-y-2">
                <label className="flex items-center gap-2 font-bold text-slate-700">
                  <UserPlus size={18} className="text-blue-500"/> 등장인물 상세 정의
                </label>
                <textarea 
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl h-40 outline-none focus:border-blue-400 transition-all"
                  placeholder="예: 김철수(25세). 냉소적인 성격이지만 동생에게는 따뜻함. 거친 말투를 쓰지만 속은 여림. 검은 후드티를 즐겨 입음."
                  value={customChars}
                  onChange={(e) => setCustomChars(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 font-bold text-slate-700">
                  <Settings2 size={18} className="text-blue-500"/> 배경 및 상황 상세 설정
                </label>
                <textarea 
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl h-40 outline-none focus:border-blue-400 transition-all"
                  placeholder="예: 마법이 공존하는 현대 서울. 주인공은 퇴근길에 몬스터를 만나 각성하게 된다. 비가 쏟아지는 강남역 한복판이 배경."
                  value={customScen}
                  onChange={(e) => setCustomScen(e.target.value)}
                />
              </div>
            </div>
          ) : (
            /* 기존 선택 모드 */
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="space-y-3">
                <label className="font-bold text-slate-700">등장 인물 선택</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {characters.map((c: any) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedChars(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])}
                      className={`p-4 rounded-2xl border-2 font-bold transition-all text-sm ${selectedChars.includes(c.id) ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="font-bold text-slate-700">배경 시나리오</label>
                <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none" onChange={(e) => setSelectedScen(e.target.value)}>
                  <option value="">시나리오를 선택하세요</option>
                  {scenarios.map((s: any) => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* 우측 공통 설정 패널 */}
        <div className="space-y-6 bg-slate-900 p-8 rounded-3xl text-white shadow-xl h-fit">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">장르</label>
            <select 
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl outline-none focus:ring-2 ring-blue-500"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            >
              {['판타지', '로맨스 판타지', '현대 판타지', '무협', '스릴러', 'SF', '사이버펑크'].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Plot Notes</label>
            <textarea 
              className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl h-24 resize-none outline-none focus:ring-2 ring-blue-500 text-sm"
              placeholder="꼭 지켜야 할 비밀이나 복선을 적어주세요."
              value={plotNotes}
              onChange={(e) => setPlotNotes(e.target.value)}
            />
          </div>
          <button
            onClick={() => handleGenerate('generate')}
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-black rounded-2xl transition shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? '시나리오 작성 중...' : <><Sparkles size={20}/> 첫 장면 생성</>}
          </button>
        </div>
      </div>

      {/* 결과 섹션 (기존 코드와 동일하되 스타일링 살짝 개선) */}
      {contents.length > 0 && (
        <div className="animate-in zoom-in-95 duration-500 max-w-4xl mx-auto">
          <div className="p-10 bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl space-y-8">
            <h2 className="text-3xl font-black text-center text-slate-800">{storyData.title}</h2>
            <div className="space-y-8 pt-6 border-t border-slate-100">
              {contents.map((text, i) => (
                <p key={i} className="text-xl text-slate-700 leading-[2] whitespace-pre-wrap">{text}</p>
              ))}
            </div>
            <div className="flex gap-4 pt-10 border-t border-slate-100">
              <button onClick={() => handleGenerate('continue')} className="flex-[3] py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:scale-[1.02] transition active:scale-95 shadow-lg">다음 내용 계속 쓰기</button>
              <button onClick={() => handleGenerate('regenerate')} className="flex-1 py-5 border-2 border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition">다시 쓰기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
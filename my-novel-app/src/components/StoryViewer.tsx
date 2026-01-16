// src/components/StoryViewer.tsx
'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { Lightbulb, ChevronLeft, ChevronRight, Sparkles, MessageSquare, RotateCcw} from 'lucide-react';

export default function StoryViewer({ initialStory, initialContents, userId }: any) {
  const [currentPage, setCurrentPage] = useState(initialContents.length - 1);
  const [contents, setContents] = useState(initialContents);
  const [loading, setLoading] = useState(false);
  const [nextDirection, setNextDirection] = useState('');
  const [currentOptions, setCurrentOptions] = useState<string[]>(initialStory.next_options || []);
  const [showOptions, setShowOptions] = useState(false);
  const supabase = createClient();

  const topRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleContinue = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-novel', {
        body: { 
          user_id: userId,
          story_id: initialStory.id,
          mode: 'continue',
          next_direction: nextDirection,
          genre_desc: initialStory.genre_desc,
        },
      });

      if (error) throw error;
      
      setContents([...contents, data]);
      setCurrentOptions(data.next_options || []);
      setCurrentPage(contents.length);
      setNextDirection('');
      setShowOptions(false);
      scrollToTop();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRewrite = async () => {
    if (loading || !confirm('현재 화의 내용을 버리고 다시 작성하시겠습니까?')) return;
    setLoading(true);

    try {
      // 재작성은 마지막 페이지에서만 가능하도록 처리 (데이터 정합성 위해)
      if (currentPage !== contents.length - 1) {
        throw new Error("가장 최신 화만 재작성할 수 있습니다.");
      }

      const { data, error } = await supabase.functions.invoke('generate-novel', {
        body: { 
          user_id: userId,
          story_id: initialStory.id,
          mode: 'rewrite', // 재작성 모드 전달
          // 재작성 시에도 지침이 있다면 반영, 없다면 이전 지침 활용 (Edge Function에서 처리)
          next_direction: nextDirection, 
          genre_desc: initialStory.genre_desc,
        },
      });

      if (error) throw error;
      
      // 현재 페이지의 내용만 교체
      const updatedContents = [...contents];
      updatedContents[currentPage] = data;
      setContents(updatedContents);
      setContents([...contents, data]);
      setCurrentPage(contents.length);
      setNextDirection('');
      setShowOptions(false);
      setCurrentOptions(data.next_options || []);
      
      scrollToTop();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-11 md:pt-5 max-w-4xl mx-auto px-2 md:px-0">
      <div className="dark:bg-slate-900 relative bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl border border-slate-100 min-h-[500px] md:min-h-[700px] flex flex-col overflow-hidden">
        <header className="dark:bg-slate-900 p-4 md:p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <h1 className="dark:text-white text-lg md:text-2xl font-black text-slate-800 truncate pr-4">{initialStory.title}</h1>
          <span className="text-[10px] md:text-sm font-bold text-slate-400 whitespace-nowrap uppercase">PAGE {currentPage + 1} / {contents.length}</span>
        </header>

        <main className="dark:bg-slate-900 flex-1 relative p-6 md:p-16 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="dark:text-white text-base md:text-lg text-slate-700 leading-[1.6] md:leading-[1.8] font-serif whitespace-pre-wrap"
            >
              {contents[currentPage]?.content}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="dark:bg-slate-900 p-4 md:p-8 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
          <div className="flex gap-2 md:gap-4">
            <button onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))} disabled={currentPage === 0} className="p-3 md:p-4 bg-white rounded-xl border shadow-sm disabled:opacity-20 transition hover:bg-slate-100"><ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-slate-600 dark:text-slate-300"/></button>
            <button onClick={() => setCurrentPage(prev => Math.min(contents.length - 1, prev + 1))} disabled={currentPage === contents.length - 1} className="p-3 md:p-4 bg-white rounded-xl border shadow-sm disabled:opacity-20 transition hover:bg-slate-100"><ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-slate-600 dark:text-slate-300"/></button>
          </div>
          <div className="text-slate-300 font-black text-[10px] uppercase tracking-widest hidden sm:block">Ghostwriter Service</div>
        </footer>
      </div>

      {/* 재작성 버튼 (최신 화를 보고 있을 때만 표시) */}
             {userId === initialStory?.user_id && currentPage === contents.length - 1 && (
              <button 
                onClick={handleRewrite}
                disabled={loading}
                className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-blue-500 transition-colors"
                title="현재 화 재작성"
              >
                <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">재작성</span>
              </button>
            )}

      {userId === initialStory?.user_id && !initialStory.is_finished && currentPage === contents.length - 1 && (
        <div className="mt-8 md:mt-12 space-y-6 pb-10">
          <div className="bg-slate-900 p-8 rounded-[2rem] shadow-xl text-white">
            <label className="flex items-center gap-2 text-blue-400 font-bold text-sm mb-4 uppercase tracking-wider"><MessageSquare size={16}/> 다음 화 연재 지침</label>
            
            {currentOptions.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 text-amber-400 mb-3">
                  <Lightbulb className="w-4 h-4" />
                  <span className="text-xs md:text-sm font-bold uppercase tracking-tight">AI 추천 전개</span>
                </div>
                
                {/* 추천 옵션 리스트: 스크롤 영역 확보 및 간격 조절 */}
                <div className="grid gap-2">
                  {currentOptions.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setNextDirection(opt)}
                      className={`text-left p-4 rounded-xl border transition-all text-sm md:text-base leading-relaxed
                        ${nextDirection === opt 
                          ? 'bg-blue-600/20 border-blue-500 text-blue-200' 
                          : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <textarea 
              className="w-full p-5 bg-slate-800 border border-slate-700 rounded-2xl h-32 outline-none focus:ring-2 ring-blue-500 text-sm mb-4 resize-none"
              placeholder="추천 전개를 선택하거나 직접 다음 내용을 지시하세요."
              value={nextDirection}
              onChange={(e) => setNextDirection(e.target.value)}
            />
            <button 
              onClick={handleContinue} 
              disabled={loading}
              className="w-full my-3 py-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-3xl transition shadow-xl flex items-center justify-center gap-3"
            >
              {loading ? "집필 중..." : <><Sparkles size={20}/> 다음 화 연재하기</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
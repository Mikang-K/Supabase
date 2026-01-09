// src/components/StoryViewer.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { Lightbulb, ChevronLeft, ChevronRight, Sparkles, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';

export default function StoryViewer({ initialStory, initialContents, userId }: any) {
  const [currentPage, setCurrentPage] = useState(initialContents.length - 1);
  const [contents, setContents] = useState(initialContents);
  const [loading, setLoading] = useState(false);
  const [nextDirection, setNextDirection] = useState('');
  const [currentOptions, setCurrentOptions] = useState<string[]>(initialStory.next_options || []);
  const [showOptions, setShowOptions] = useState(false);
  const supabase = createClient();

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
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="dark:bg-slate-900 relative bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 min-h-[700px] flex flex-col overflow-hidden">
        <header className="dark:bg-slate-900 p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <h1 className="dark:text-white text-2xl font-black text-slate-800 truncate pr-4">{initialStory.title}</h1>
          <span className="text-sm font-bold text-slate-400 whitespace-nowrap">PAGE {currentPage + 1} / {contents.length}</span>
        </header>

        <main className="dark:bg-slate-900 flex-1 relative p-10 md:p-16 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="dark:text-white text-m text-slate-700 leading-[1.8] font-serif whitespace-pre-wrap"
            >
              {contents[currentPage]?.content}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="dark:bg-slate-900 p-8 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
          <div className="flex gap-4">
            <button onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))} disabled={currentPage === 0} className="p-4 bg-white rounded-2xl border shadow-sm disabled:opacity-20 transition hover:bg-slate-100"><ChevronLeft/></button>
            <button onClick={() => setCurrentPage(prev => Math.min(contents.length - 1, prev + 1))} disabled={currentPage === contents.length - 1} className="p-4 bg-white rounded-2xl border shadow-sm disabled:opacity-20 transition hover:bg-slate-100"><ChevronRight/></button>
          </div>
          <div className="text-slate-300 font-black text-xs uppercase tracking-widest hidden sm:block">Ghostwriter Service</div>
        </footer>
      </div>

      {!initialStory.is_finished && currentPage === contents.length - 1 && (
        <div className="mt-8 md:mt-12 space-y-6 pb-10">
          <div className="bg-slate-900 p-8 rounded-[2rem] shadow-xl text-white">
            <label className="flex items-center gap-2 text-blue-400 font-bold text-sm mb-4 uppercase tracking-wider"><MessageSquare size={16}/> 다음 화 연재 지침</label>
            
            {currentOptions.length > 0 && (
              <div className="mb-6">
                <button 
                  onClick={() => setShowOptions(!showOptions)}
                  className="flex items-center gap-2 text-slate-400 font-bold text-[11px] uppercase tracking-tighter hover:text-blue-400 transition-colors mb-3"
                >
                  <Lightbulb size={14} className={showOptions ? "text-yellow-400" : "text-slate-500"}/> 
                  AI 추천 전개 확인하기 
                  {showOptions ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                </button>

                <AnimatePresence>
                  {showOptions && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-wrap gap-2 pt-1 pb-4">
                        {currentOptions.map((opt, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setNextDirection(opt);
                              setShowOptions(false); // 선택 후 닫기 (선택 사항)
                            }}
                            className="text-base sm:text-lg md:text-xl text-slate-700 leading-relaxed sm:leading-[2.2] md:leading-[2.4] font-serif whitespace-pre-wrap"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
              className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-3xl transition shadow-xl flex items-center justify-center gap-3"
            >
              {loading ? "집필 중..." : <><Sparkles size={20}/> 다음 페이지 연재하기</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
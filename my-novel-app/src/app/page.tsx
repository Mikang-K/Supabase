// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { ChevronLeft, ChevronRight, Sparkles, Clock, BookOpen, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- 더미 데이터 영역 ---
const DUMMY_EVENTS = [
  { id: 1, title: "신규 작가 응원 이벤트", desc: "첫 소설 연재 시 100 토큰 증정!", color: "bg-blue-600", expires: "2024-12-31" },
  { id: 2, title: "주간 베스트 공지", desc: "이번 주 가장 사랑받은 작품을 확인하세요.", color: "bg-purple-600", expires: "2024-12-25" },
  { id: 3, title: "시스템 업데이트", desc: "AI 모델 업그레이드로 더 자연스러운 문장 생성 가능", color: "bg-slate-800", expires: "2025-01-10" }
];

export default function Home() {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [publicStories, setPublicStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // 1. 배너 자동 슬라이드 로직 (5초 간격)
  useEffect(() => {
    const fetchPublicStories = async () => {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(6); // 최신 6개만 표시

      if (data) setPublicStories(data);
      setLoading(false);
    };

    fetchPublicStories();
  }, []);

  return (
    <main className="pt-20 pb-20 min-h-screen bg-white dark:bg-slate-950 transition-colors">
      
      {/* --- 섹션 1: 상단 이벤트/공지 배너 (Carousel) --- */}
      <section className="px-4 md:px-10 mb-12">
        <div className="relative h-48 md:h-64 w-full max-w-7xl mx-auto overflow-hidden rounded-[2rem] shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentBanner}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`absolute inset-0 flex flex-col justify-center p-8 md:p-16 text-white ${DUMMY_EVENTS[currentBanner].color}`}
            >
              <span className="text-xs md:text-sm font-bold bg-white/20 w-fit px-3 py-1 rounded-full mb-4 backdrop-blur-md">
                NOTICE & EVENT
              </span>
              <h2 className="text-2xl md:text-4xl font-black mb-2">{DUMMY_EVENTS[currentBanner].title}</h2>
              <p className="text-sm md:text-lg opacity-90">{DUMMY_EVENTS[currentBanner].desc}</p>
            </motion.div>
          </AnimatePresence>

          {/* 배너 수동 컨트롤 버튼 */}
          <div className="absolute bottom-6 right-8 flex gap-2">
            <button 
              onClick={() => setCurrentBanner((prev) => (prev - 1 + DUMMY_EVENTS.length) % DUMMY_EVENTS.length)}
              className="p-2 bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-md transition"
            >
              <ChevronLeft size={20} className="text-white"/>
            </button>
            <button 
              onClick={() => setCurrentBanner((prev) => (prev + 1) % DUMMY_EVENTS.length)}
              className="p-2 bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-md transition"
            >
              <ChevronRight size={20} className="text-white"/>
            </button>
          </div>
        </div>
      </section>

      {/* --- 섹션 2: 최근 게시된 소설 --- */}
      {/* ... 배너 영역 ... */}

      <section className="max-w-7xl mx-auto px-8 py-20">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h3 className="text-3xl font-black text-slate-900 mb-2">지금 연재 중인 소설 ✨</h3>
            <p className="text-slate-500">다른 작가님들의 상상력을 엿보세요.</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-100 rounded-3xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {publicStories.map((story) => (
              <Link href={`/stories/${story.id}`} key={story.id}>
                <StoryCard story={story} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

// StoryCard에서 더미 데이터 필드(author 등)를 실제 DB 필드로 교체
function StoryCard({ story }: { story: any }) {
  return (
    <div className="p-5 group cursor-pointer border border-slate-100 ...">
      <div className="aspect-[3/4] ... relative">
        <span className="absolute top-3 left-3 px-3 py-1  ...">
          {story.genre_desc || '장르 미정'}
        </span>
      </div>
      <h4 className="font-black text-xl text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
        {story.title}
      </h4>
      <p className="text-slate-500 text-sm mt-2 line-clamp-2 leading-relaxed">
        {story.summary}
      </p>
    </div>
  );
}
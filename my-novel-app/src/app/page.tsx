// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Sparkles, Clock, BookOpen, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- 더미 데이터 영역 ---
const DUMMY_EVENTS = [
  { id: 1, title: "신규 작가 응원 이벤트", desc: "첫 소설 연재 시 100 토큰 증정!", color: "bg-blue-600", expires: "2024-12-31" },
  { id: 2, title: "주간 베스트 공지", desc: "이번 주 가장 사랑받은 작품을 확인하세요.", color: "bg-purple-600", expires: "2024-12-25" },
  { id: 3, title: "시스템 업데이트", desc: "AI 모델 업그레이드로 더 자연스러운 문장 생성 가능", color: "bg-slate-800", expires: "2025-01-10" }
];

const DUMMY_STORIES = [
  { id: '1', title: "새벽의 고스트라이터", author: "작가A", genre: "판타지", views: 1240, is_public: true },
  { id: '2', title: "테크노피아의 종말", author: "작가B", genre: "SF", views: 850, is_public: true },
  { id: '3', title: "달빛 아래 연가", author: "작가C", genre: "로맨스", views: 2100, is_public: true },
  { id: '4', title: "잊혀진 왕국의 비밀", author: "작가D", genre: "어드벤처", views: 430, is_public: true },
];

export default function Home() {
  const [currentBanner, setCurrentBanner] = useState(0);

  // 1. 배너 자동 슬라이드 로직 (5초 간격)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % DUMMY_EVENTS.length);
    }, 5000);
    return () => clearInterval(timer);
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
      <section className="px-4 md:px-10 max-w-7xl mx-auto mb-16">
        <div className="flex items-center justify-between mb-8">
          <h3 className="flex items-center gap-2 text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100">
            <Clock className="text-blue-500" /> 최근 올라온 이야기
          </h3>
          <Link href="/library" className="text-sm font-bold text-slate-400 hover:text-blue-500 transition">모두 보기</Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {DUMMY_STORIES.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      </section>

      {/* --- 섹션 3: 유저 추천 (is_public 기반) --- */}
      <section className="px-4 md:px-10 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h3 className="flex items-center gap-2 text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100">
            <Sparkles className="text-amber-500" /> 당신을 위한 추천 작품
          </h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 추천 로직은 현재 더미로 역순 배치 */}
          {[...DUMMY_STORIES].reverse().map((story) => (
            <StoryCard key={`rec-${story.id}`} story={story} />
          ))}
        </div>
      </section>

      {/* 하단 시작하기 CTA */}
      <div className="mt-20 flex justify-center px-4">
        <Link 
          href="/write" 
          className="group flex items-center gap-3 px-10 py-5 bg-blue-600 text-white rounded-full font-black text-xl hover:bg-blue-500 transition shadow-2xl shadow-blue-500/20"
        >
          나만의 소설 집필하기 <ArrowRight className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </main>
  );
}

// --- 소설 카드 컴포넌트 ---
function StoryCard({ story }: { story: any }) {
  return (
    <div className="group cursor-pointer bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 transition-all hover:-translate-y-2 hover:shadow-xl">
      <div className="aspect-[3/4] bg-slate-200 dark:bg-slate-800 rounded-2xl mb-4 overflow-hidden relative">
        <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:scale-110 transition-transform">
          <BookOpen size={64} />
        </div>
        <span className="absolute top-3 left-3 px-3 py-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-full text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
          {story.genre}
        </span>
      </div>
      <h4 className="font-black text-lg text-slate-800 dark:text-slate-100 mb-1 truncate">{story.title}</h4>
      <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-tighter">
        <span>By {story.author}</span>
        <span className="flex items-center gap-1"><BookOpen size={12}/> {story.views.toLocaleString()}</span>
      </div>
    </div>
  );
}
// src/app/page.tsx
import Link from 'next/link';
import { PenLine, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-white to-blue-50">
      <div className="max-w-3xl text-center space-y-8">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-bold animate-bounce">
          AI와 함께 작가의 꿈을 이루세요 ✨
        </div>
        <h1 className="text-6xl font-black text-slate-900 leading-tight">
          상상하는 모든 이야기를<br/> 
          <span className="text-blue-600">AI 소설 작가</span>와 함께
        </h1>
        <p className="text-xl text-slate-600">
          복잡한 설정도, 막막한 첫 문장도 걱정 마세요.<br/>
          당신의 아이디어를 입력하면 AI가 생생한 소설로 그려냅니다.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link 
            href="/write" 
            className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-black transition shadow-xl"
          >
            지금 시작하기 <ArrowRight size={20} />
          </Link>
          <Link 
            href="/library" 
            className="px-8 py-4 bg-white text-slate-700 border-2 border-slate-200 rounded-2xl font-black text-lg hover:border-slate-400 transition"
          >
            내 서재 보기
          </Link>
        </div>
      </div>
    </main>
  );
}
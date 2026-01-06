// src/app/stories/[id]/page.tsx
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';

// params를 Promise 타입으로 정의합니다.
export default async function StoryDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // 1. params를 await로 기다려(unwrap) id를 추출합니다. (Next.js 15 필수 사항)
  const { id } = await params;

  const supabase = await createClient();

  // 2. 스토리 정보와 본문을 동시에 가져옵니다.
  const [storyRes, contentRes] = await Promise.all([
    supabase.from('stories').select('*').eq('id', id).single(),
    supabase.from('story_contents')
      .select('*')
      .eq('story_id', id)
      .order('order_index', { ascending: true })
  ]);

  if (!storyRes.data) {
    notFound();
  }

  const story = storyRes.data;
  const contents = contentRes.data || [];

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link 
            href="/" 
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
          >
            ← 목록으로 돌아가기
          </Link>
        </div>

        <article className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <header className="p-8 border-b border-slate-100 bg-slate-50/50">
            <h1 className="text-3xl font-black text-slate-900 mb-4 leading-tight">
              {story.title}
            </h1>
            <div className="flex items-center text-sm text-slate-500 gap-4">
              <span>작성일: {new Date(story.created_at).toLocaleDateString()}</span>
              {story.summary && (
                <span className="px-2 py-1 bg-slate-200 rounded text-xs text-slate-600">
                  {story.summary}
                </span>
              )}
            </div>
          </header>

          <div className="p-8 md:p-12">
            {contents.length > 0 ? (
              <div className="space-y-6">
                {contents.map((item) => (
                  <p 
                    key={item.id} 
                    className="text-lg text-slate-700 leading-relaxed whitespace-pre-wrap"
                  >
                    {item.content}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-20">
                작성된 본문 내용이 없습니다.
              </p>
            )}
          </div>
        </article>

        <footer className="mt-12 text-center text-slate-400 text-sm">
          &copy; My Novel AI - {story.title}
        </footer>
      </div>
    </main>
  );
}
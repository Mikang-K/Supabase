// src/app/library/page.tsx
import { createClient } from '@/utils/supabase/server';
import StoryList from '@/components/StoryList';
import { redirect } from 'next/navigation';

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/');

  return (
    <main className="p-5 md:p-18 max-w-6xl mx-auto mt-16 md:mt-0">
      <div className="mb-6 md:mb-10">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100">내 서재</h2>
        <p className="text-sm md:text-base text-slate-500 mt-2">지금까지 집필한 소설들을 모아볼 수 있습니다.</p>
      </div>
      <StoryList userId={user.id} />
    </main>
  );
}
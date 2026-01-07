// src/app/write/page.tsx
import { createClient } from '@/utils/supabase/server';
import NovelGenerator from '@/components/NovelGenerator';
import { redirect } from 'next/navigation';

export default async function WritePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/');

  const [charRes, scenRes] = await Promise.all([
    supabase.from('characters').select('*'),
    supabase.from('scenarios').select('*')
  ]);

  return (
    <main className="p-6 md:p-12 max-w-5xl mx-auto">
      <div className="mb-10">
        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100">새 소설 집필실</h2>
        <p className="text-slate-500 mt-2">등장인물과 배경을 설정하고 AI와 함께 이야기를 만들어보세요.</p>
      </div>
      <NovelGenerator 
        characters={charRes.data || []} 
        scenarios={scenRes.data || []}
        userId={user.id} 
      />
    </main>
  );
}
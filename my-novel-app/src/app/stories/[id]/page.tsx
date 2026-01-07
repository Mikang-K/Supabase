// src/app/stories/[id]/page.tsx
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import StoryViewer from '@/components/StoryViewer'; // 위에서 만든 컴포넌트

export default async function StoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [storyRes, contentRes, userRes] = await Promise.all([
    supabase.from('stories').select('*').eq('id', id).single(),
    supabase.from('story_contents').select('*').eq('story_id', id).order('order_index', { ascending: true }),
    supabase.auth.getUser()
  ]);

  if (!storyRes.data) notFound();

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12">
      <StoryViewer 
        initialStory={storyRes.data} 
        initialContents={contentRes.data || []} 
        userId={userRes.data.user?.id}
      />
    </main>
  );
}
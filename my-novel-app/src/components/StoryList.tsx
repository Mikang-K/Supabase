// src/components/StoryList.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Lock, Globe } from 'lucide-react';
import Link from 'next/link';

export default function StoryList({ userId }: { userId: string }) {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchStories = async () => {
    const { data } = await supabase
      .from('stories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setStories(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchStories();
  }, [userId]);

  const togglePublic = async (e: React.MouseEvent, storyId: string, currentStatus: boolean) => {
    e.preventDefault();
    e.stopPropagation();

    const { error } = await supabase
      .from('stories')
      .update({ is_public: !currentStatus })
      .eq('id', storyId);

    if (error) {
      alert('상태 변경 실패: ' + error.message);
    } else {
      setStories(prev => prev.map(s => 
        s.id === storyId ? { ...s, is_public: !currentStatus } : s
      ));
    }
  };

  const handleDelete = async (e: React.MouseEvent, storyId: string) => {
    e.preventDefault(); 
    e.stopPropagation();
    
    if (!confirm('이 소설을 삭제하시겠습니까? 본문 내용도 모두 삭제됩니다.')) return;

    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', storyId)
      .eq('user_id', userId);

    if (error) {
      alert('삭제 실패: ' + error.message);
    } else {
      setStories(prev => prev.filter(s => s.id !== storyId));
    }
  };

  if (loading) return <div className="text-center py-10 text-slate-400">목록 로딩 중...</div>;

  return (
    <div className="grid grid-cols-1 gap-4">
      {stories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
          아직 생성된 소설이 없습니다.
        </div>
      ) : (
        stories.map((story) => (
          <div key={story.id} className="relative group">
            <Link 
              href={`/stories/${story.id}`}
              className="p-5 bg-white rounded-xl border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all block pr-16"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-800 group-hover:text-blue-600 transition-colors">
                    {story.title}
                  </h3>
                  <p className="text-slate-500 text-sm mt-1 line-clamp-1">
                    줄거리: {story.summary}
                  </p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap ml-4">
                  {new Date(story.created_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
            {/* 삭제 버튼: Link 위에 띄움 */}
            <button 
              onClick={(e) => handleDelete(e, story.id)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-200 hover:text-red-500 transition-colors z-10"
              title="삭제하기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button 
                onClick={(e) => togglePublic(e, story.id, story.is_public)}
                className={`p-2 rounded-full transition-colors ${
                  story.is_public ? 'text-blue-500 hover:bg-blue-50' : 'text-slate-300 hover:bg-slate-100'
                }`}
                title={story.is_public ? "공개 중" : "비공개 상태"}
              >
                {story.is_public ? <Globe size={20} /> : <Lock size={20} />}
              </button>
          </div>
        ))
      )}
    </div>
  );
}
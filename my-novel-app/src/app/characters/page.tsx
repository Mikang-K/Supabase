// src/app/characters/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { UserPlus, Trash2, MessageSquare, Tag, User as UserIcon } from 'lucide-react';

export default function CharacterManagement() {
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [style, setStyle] = useState('');
  const supabase = createClient();

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 본인이 만든 캐릭터만 가져오기
    const { data } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setCharacters(data);
    setLoading(false);
  };

  const handleAddCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('로그인이 필요합니다.');

    const tagArray = tags.split(',').map(t => t.trim()).filter(t => t !== '');

    const { error } = await supabase.from('characters').insert({
      name,
      description,
      personality_tags: tagArray,
      dialogue_style: style,
      user_id: user.id
    });

    if (error) alert(error.message);
    else {
      setName(''); setDescription(''); setTags(''); setStyle('');
      fetchCharacters();
    }
  };

  const deleteCharacter = async (id: string) => {
    if (!confirm('정말 이 캐릭터를 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('characters').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchCharacters();
  };

  return (
    <main className="p-5 md:p-18 max-w-6xl mx-auto mt-16">
      <div className="mb-6 md:mb-10">
        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100">캐릭터 도감</h2>
        <p className="text-slate-500 mt-2 text-lg">소설에 등장할 나만의 캐릭터들을 관리하세요.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* 등록 폼 */}
        <form onSubmit={handleAddCharacter} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-fit space-y-5">
          <h3 className="text-xl font-bold flex items-center gap-2"><UserPlus className="text-blue-600"/> 새 캐릭터 등록</h3>
          <div className="space-y-4">
            <input 
              className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-blue-500 border-none"
              placeholder="이름 (예: 제로)" value={name} onChange={e => setName(e.target.value)} required
            />
            <textarea 
              className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-blue-500 border-none h-24"
              placeholder="캐릭터 설명 (나이, 외모, 배경 등)" value={description} onChange={e => setDescription(e.target.value)} required
            />
            <input 
              className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-blue-500 border-none"
              placeholder="성격 태그 (쉼표로 구분: 냉정한, 천재)" value={tags} onChange={e => setTags(e.target.value)}
            />
            <input 
              className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-blue-500 border-none"
              placeholder="말투 (예: 짧고 간결한 반말)" value={style} onChange={e => setStyle(e.target.value)}
            />
          </div>
          <button className="w-full py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition">
            캐릭터 저장하기
          </button>
        </form>

        {/* 목록 */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? <p>로딩 중...</p> : characters.map(char => (
            <div key={char.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition relative group">
              <button 
                onClick={() => deleteCharacter(char.id)}
                className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={18}/>
              </button>
              <h4 className="text-xl font-black text-slate-800 mb-3">{char.name}</h4>
              <p className="text-sm text-slate-500 line-clamp-3 mb-4">{char.description}</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {char.personality_tags?.map((t: string) => (
                  <span key={t} className="text-[10px] px-2 py-1 bg-blue-50 text-blue-600 rounded-md font-bold">#{t}</span>
                ))}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <MessageSquare size={12}/> {char.dialogue_style}
              </div>
            </div>
          ))}
          {!loading && characters.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400">
              아직 등록된 캐릭터가 없습니다.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
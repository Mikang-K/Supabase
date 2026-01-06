'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // 회원가입 함수
  const handleSignUp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
    });
    if (error) alert(error.message);
    else alert('회원가입 성공! 이제 로그인해 주세요.');
    setLoading(false);
  };

  // 로그인 함수
  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl border border-slate-100">
      <h2 className="text-2xl font-bold mb-6 text-center">반가워요!</h2>
      <div className="space-y-4">
        <input
          type="email"
          placeholder="이메일 주소"
          className="w-full p-3 border rounded-lg"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="비밀번호"
          className="w-full p-3 border rounded-lg"
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-slate-300"
          >
            로그인
          </button>
          <button
            onClick={handleSignUp}
            disabled={loading}
            className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200"
          >
            회원가입
          </button>
        </div>
      </div>
    </div>
  );
}
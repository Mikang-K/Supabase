'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // 1. 소셜 로그인 핸들러 (구글, 카카오)
  const handleSocialLogin = async (provider: 'google' | 'kakao') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  // 2. 이메일 회원가입/로그인 핸들러
  const handleEmailAuth = async (type: 'LOGIN' | 'SIGNUP') => {
    setLoading(true);
    const { error } = type === 'LOGIN' 
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) alert(error.message);
    else if (type === 'SIGNUP') alert('인증 메일이 발송되었습니다!');
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">GostWriter 시작하기</h2>
      
      {/* 이메일 입력 섹션 */}
      <div className="space-y-4 mb-6">
        <input
          type="email"
          placeholder="이메일 주소"
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="비밀번호"
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex gap-2">
          <button 
            onClick={() => handleEmailAuth('LOGIN')}
            disabled={loading}
            className="flex-1 bg-indigo-600 text-white p-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            로그인
          </button>
          <button 
            onClick={() => handleEmailAuth('SIGNUP')}
            disabled={loading}
            className="flex-1 border border-indigo-600 text-indigo-600 p-3 rounded-lg font-semibold hover:bg-indigo-50 transition"
          >
            회원가입
          </button>
        </div>
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t"></span></div>
        <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">또는 소셜 계정으로 시작</span></div>
      </div>

      {/* 소셜 로그인 버튼 세트 */}
      <div className="space-y-3">
        {/* 구글 버튼 */}
        <button 
          onClick={() => handleSocialLogin('google')}
          className="w-full flex items-center justify-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition shadow-sm"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" alt="Google" />
          <span className="text-gray-700 font-medium">Google로 계속하기</span>
        </button>

        {/* 카카오 버튼 */}
        <button 
            onClick={() => handleSocialLogin('kakao')}
            /* 버튼 자체의 배경색과 패딩을 제거하고, 크기만 설정합니다. */
            className="w-full relative h-[45px] md:h-[55px] transition-transform active:scale-[0.98] hover:opacity-95"
          >
            <Image 
              src="/images/kakao_login_medium_narrow.png.png" // 실제 이미지 경로로 수정하세요
              alt="카카오로 계속하기"
              fill // 부모 버튼의 크기에 꽉 채웁니다.
              priority // 로그인 화면이므로 빠르게 로딩되도록 설정
              className="object-contain" // 이미지 비율을 유지하면서 버튼 안에 배치
            />
          </button>
      </div>
    </div>
  );
}
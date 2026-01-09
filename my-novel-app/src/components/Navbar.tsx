// src/components/Navbar.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sun,
  Moon, 
  PenLine, 
  BookText, 
  Home, 
  LogOut, 
  LogIn, 
  Coins, 
  User as UserIcon,
  X
} from 'lucide-react';
import AuthForm from './AuthForm';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { theme, setTheme } = useTheme();
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  // 지갑 잔액 조회 함수
  const fetchBalance = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (data) setBalance(data.balance);
  }, [supabase]);

  // 실시간 구독 설정 함수
  const setupRealtimeSubscription = useCallback((userId: string) => {
    return supabase
      .channel(`wallet_changes_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("토큰 변경 실시간 감지:", payload.new.balance);
          setBalance(payload.new.balance);
        }
      )
      .subscribe();
  }, [supabase]);

  useEffect(() => {
    setMounted(true);
    let channel: any;

    // 1. 초기 인증 상태 및 지갑 로드
    const initialize = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
        fetchBalance(currentUser.id);
        channel = setupRealtimeSubscription(currentUser.id);
      }
    };

    initialize();

    // 2. 인증 상태 변화 감지 (로그인/로그아웃)
    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (event === 'SIGNED_IN' && currentUser) {
        fetchBalance(currentUser.id);
        if (channel) supabase.removeChannel(channel);
        channel = setupRealtimeSubscription(currentUser.id);
        setShowAuthModal(false);
      } else if (event === 'SIGNED_OUT') {
        setBalance(null);
        if (channel) supabase.removeChannel(channel);
        router.push('/');
      }
    });

    // cleanup: 구독 해제
    return () => {
      authListener.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase, router, fetchBalance, setupRealtimeSubscription]);

  const menuItems = [
    { name: '홈', href: '/', icon: Home },
    { name: '소설 쓰기', href: '/write', icon: PenLine, authRequired: true },
    { name: '내 서재', href: '/library', icon: BookText, authRequired: true },
    { name: '캐릭터 도감', href: '/characters', icon: UserIcon, authRequired: true },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-3 md:px-2 z-50 transition-colors">
        {/* 로고 섹션 */}
        <div 
          className="flex items-center gap-3 cursor-pointer" 
          onClick={() => router.push('/')}
        >
        {/* 기존 h1을 Image 컴포넌트로 대체 */}
          <Image 
            src="/images/IMG_9974.png" // public/images/logo.png에 파일이 있는 경우
            alt="GhostWriter"
            width={180}  // 로고의 너비 (비율에 맞춰 조정)
            height={40}  // 로고의 높이 (비율에 맞춰 조정)
            priority     // 상단 네비바에 있으므로 우선 로딩 설정
            className="object-contain" // 이미지 비율 유지
          />
        </div>
        
        {/* 메뉴 링크 섹션 */}
        <div className="hidden md:flex items-center gap-1 ml-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            if (item.authRequired && !user) return null;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
                  isActive 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <item.icon 
                  size={24} 
                  className={isActive ? 'text-blue-600 dark:text-blue-400' : 'group-hover:text-slate-700 dark:group-hover:text-slate-200'} 
                />
                <span className="font-bold hidden md:block">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* 하단 제어 섹션 (테마, 지갑, 로그아웃) */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* 다크모드 토글 */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-4 px-3 py-3 w-80 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
              <span className="text-[16px] font-bold hidden md:block">
                {theme === 'dark' ? '라이트 모드' : '다크 모드'}
              </span>
            </button>
          )}

          {user ? (
            <>
              {/* 토큰 표시 */}
              <div className="flex items-center gap-2 md:gap-4">
                <div className="flex items-center gap-2 mb-1">
                  <Coins size={14} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-[10px] font-black text-blue-400 uppercase">Tokens</span>
                </div>
                <div className="text-xl font-black text-blue-600 dark:text-blue-400">
                  {balance !== null ? balance.toLocaleString() : '...'}
                </div>
              </div>

              {/* 로그아웃 버튼 */}
              <button 
                onClick={() => supabase.auth.signOut()}
                className="flex items-center gap-4 px-4 py-3 w-full text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 rounded-xl transition-colors group"
              >
                <LogOut size={24} />
                <span className="font-bold hidden md:block">로그아웃</span>
              </button>
            </>
          ) : (
            /* 로그인 버튼 (비로그인 시) */
            <button 
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-4 px-4 py-3 w-full text-blue-600 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-colors"
            >
              <LogIn size={24} />
              <span className="font-bold hidden md:block">로그인</span>
            </button>
          )}
        </div>
      </nav>

      {/* 인증 모달 */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6">
            <button 
              onClick={() => setShowAuthModal(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={24} />
            </button>
            <AuthForm />
          </div>
        </div>
      )}
    </>
  );
}
// src/utils/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies() // Next.js 15에서는 await가 필요합니다.

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            // 서버 컴포넌트에서는 쿠키 설정을 시도만 하고, 에러가 나면 무시합니다.
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Server Action이나 Route Handler가 아닌 곳에서 호출될 경우 발생하는 에러 방지
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // 에러 방지
          }
        },
      },
    }
  )
}
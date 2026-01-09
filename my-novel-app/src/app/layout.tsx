// src/app/layout.tsx
import './globals.css';
import Navbar from '@/components/Navbar';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      {/* 다크모드 시 배경색이 자연스럽게 바뀌도록 transition 추가 */}
      <body className="bg-white dark:bg-slate-950 transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Navbar />
          <div className="min-h-screen bg-slate-150">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
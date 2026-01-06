// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  // 핵심: 'class' 전략을 사용해야 사용자가 선택한 테마가 유지됩니다.
  darkMode: 'class', 
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // 나중에 커스텀 색상이나 폰트를 추가할 때 이곳을 수정합니다.
    },
  },
  plugins: [],
};

export default config;
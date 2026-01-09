# ✍️ Gostwriter: 지능형 웹 소설 공동 집필 플랫폼

> **Gemini AI와 Supabase를 결합하여 사용자의 상상력을 실시간 소설로 구현하는 인터랙티브 플랫폼입니다.**

[🚀 배포 사이트 바로가기](https://supabase1-orcin.vercel.app/)

---

## 🛠 Tech Stack
- **Frontend**: Next.js 14/15 (App Router), Tailwind CSS, Framer Motion, Lucide React
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **AI**: Google Gemini 1.5 Flash (via Edge Functions)
- **Deployment**: Vercel

## ✨ Key Features
- **맞춤형 초안 생성**: 제목, 등장인물(3D/2D/직접 입력), 장르, 관계도를 기반으로 AI가 첫 에피소드를 작성합니다.
- **인터랙티브 이어쓰기**: AI가 추천하는 3가지 전개 옵션 중 하나를 선택하거나, 사용자가 직접 지침을 내려 이야기를 이어갑니다.
- **실시간 데이터 관리**: Supabase를 통해 소설 내용과 진행 상황을 실시간으로 저장하고 불러옵니다.
- **토큰 시스템**: 유저별 지갑 기능을 통해 무분별한 API 호출을 방지하고 서비스 지속성을 확보했습니다.

## 🏗 System Architecture
1. **Frontend (Vercel)**: 사용자의 입력값을 받아 Supabase Edge Function을 호출합니다.
2. **Edge Function (Supabase)**: 보안이 강화된 환경에서 Gemini API를 호출하고, 응답받은 JSON 데이터를 파싱하여 DB 처리와 클라이언트 응답을 동시에 수행합니다.
3. **Database (PostgreSQL)**: 유저 정보, 지갑 잔액, 소설 본문 및 설정을 구조화하여 관리합니다.

## 🚀 How to Run (Local)
1. Repository 클론
2. `npm install`
3. `.env.local` 파일 생성 및 Supabase Key 설정
4. `npm run dev`

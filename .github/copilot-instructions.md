# AI Coding Assistant Instructions for Gostwriter Novel Platform

## Project Overview
This is a Next.js-based interactive novel writing platform that combines AI (Gemini) with Supabase for collaborative storytelling. Users create characters, generate story drafts, and continue narratives through AI-assisted writing.

## Architecture
- **Frontend**: Next.js 14/15 App Router with TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL DB, Auth, Edge Functions)
- **AI**: Google Gemini 1.5 Flash for content generation
- **Key Components**: NovelGenerator (story creation), StoryViewer (reading/continuation), AuthForm

## Core Data Flow
1. User selects characters (preset 3D/2D/CUSTOM or manual input)
2. Frontend calls Supabase Edge Function `generate-novel` or `rlm-novel-writer`
3. Edge Function calls Gemini API with structured prompts
4. AI returns JSON with title/content/summary/next_options
5. Function parses JSON, saves to DB (stories/story_contents), deducts wallet tokens
6. Frontend updates UI with new content

## Key Patterns & Conventions

### Supabase Integration
- Use `createClient()` from `@/utils/supabase/client` for browser operations
- Use `createClient()` from `@/utils/supabase/server` for server components with cookie handling
- Edge Functions use service role key for DB operations
- Always check wallet balance before AI calls

### AI Prompt Engineering
- Strict JSON output format with `title`, `content`, `summary`, `next_options`, `is_finished`
- Clean JSON parsing: remove markdown code blocks, trim whitespace
- Korean prompts with specific persona ("전문 고스트라이터")
- Literary style: 서정적 산문체, avoid direct character descriptions

### Component Patterns
- Client components use `'use client'` directive
- State management with React hooks (useState, useMemo)
- Framer Motion for page transitions in StoryViewer
- Responsive design with Tailwind (mobile-first)

### Database Schema
- `stories`: user_id, title, summary, total_episodes, next_options, genre_desc
- `story_contents`: story_id, content, order_index
- `characters`: name, category (3D/2D/CUSTOM/MANUAL), description
- `wallets`: user_id, balance (token system)

## Development Workflows

### Local Development
```bash
# Terminal 1: Start Supabase (DB + Functions)
supabase start

# Terminal 2: Start Next.js dev server
cd my-novel-app
npm run dev
```

### Environment Setup
- `.env.local`: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- Supabase env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY

### Building & Deployment
- `npm run build` in my-novel-app/
- Deploy to Vercel (frontend) + Supabase (backend/functions)

## Common Tasks

### Adding New Characters
- Insert into `characters` table with category and description
- Update NovelGenerator tabs if new category needed

### Modifying AI Prompts
- Edit systemInstruction in edge functions
- Maintain JSON output format
- Test parsing logic with cleanJSON function

### Token Management
- Check wallet balance before AI calls
- Deduct 1 token per generation
- Handle insufficient balance errors

### Story Continuation
- Use `mode: 'continue'` with story_id
- Update story_contents with new episode
- Refresh next_options for UI

## Error Handling
- Parse Gemini API errors (status codes, response text)
- JSON parsing failures with detailed logging
- Database transaction errors with rollback
- User-facing alerts for validation failures

## Security Considerations
- Service role key only in edge functions
- CORS headers in all function responses
- User authentication required for all operations
- Token system prevents API abuse

## File Structure Highlights
- `src/app/`: Next.js app router pages
- `src/components/`: Reusable UI components
- `src/utils/supabase/`: Client/server setup
- `supabase/functions/`: Edge functions for AI generation
- `supabase/config.toml`: Local development config</content>
<parameter name="filePath">d:\Supabase\.github\copilot-instructions.md
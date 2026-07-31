# CLAUDE.md - Silent Stakeholder Project

## Project Overview
A multi-agent AI system that discovers hidden unmet user needs by comparing Google Play reviews against GitHub roadmap issues for **WordPress for Android**. Uses Gemini API for LLM reasoning across a 6-step pipeline.

## Architecture
```
Preprocessor (local) → Review Analyst (Gemini) + Roadmap Analyst (Gemini) [parallel] → Gap Detector (Gemini) → Evidence Verifier (local) → Judge (Gemini)
```

## Folder Structure
```
/
├── app/
│   ├── page.tsx              # Main dashboard (client component)
│   ├── layout.tsx            # Root layout with theme init
│   ├── globals.css           # Tailwind + light/dark variables
│   └── api/
│       ├── analyze/route.ts  # POST: triggers full pipeline
│       └── gaps/route.ts     # GET: serves cached results
├── components/               # React UI components
├── lib/
│   ├── agents/               # 6-step pipeline agents
│   ├── data.ts               # Data loading + caching
│   ├── types.ts              # Core data types
│   └── utils.ts              # Client-safe helpers
├── data/raw/                 # Reviews + issues JSON
├── output/                   # Cached analysis results
└── .env.local                # GEMINI_API_KEY
```

## Coding Rules
- **TypeScript strict mode** - no `any`, use proper types from `lib/types.ts`
- **Server/Client boundary** - server components in `app/`, client components in `components/`
- **No external API calls from client** - all Gemini calls go through `/api/*` routes
- **Tailwind CSS 4** - use CSS variables for theming, no inline styles
- **Error handling** - agents return typed errors, orchestrator catches and continues
- **No comments** - code should be self-documenting
- **Follow existing patterns** - match code style of neighboring files

## Agent System
Each agent in `lib/agents/` exports a single async function:
- `preprocessor.ts`: `preprocessReviews()`, `preprocessIssues()` - local, no Gemini
- `review-analyst.ts`: `runReviewAnalyst()` - Gemini call
- `roadmap-analyst.ts`: `runRoadmapAnalyst()` - Gemini call
- `gap-detector.ts`: `runGapDetector()` - Gemini call
- `evidence-verifier.ts`: `runEvidenceVerifier()` - local verification
- `judge.ts`: `runJudge()` - Gemini call

All agent I/O types defined in `lib/agents/types.ts`.

## Gemini Client
`lib/agents/gemini-client.ts`:
- Model fallback: `gemini-3.5-flash` → `gemini-2.0-flash`
- Retry logic with exponential backoff
- Rate limiting: 1 request/second
- File-based caching in `.cache/gemini/` (1hr TTL)
- Use `callGeminiJson<T>()` for structured JSON responses

## Environment Variables
```bash
GEMINI_API_KEY=your_key_here  # Required for Gemini API
```

## Running
```bash
npm install
npm run dev      # Dev server on localhost:3000
npx next build   # Production build
```

## Testing
- Pipeline test: `POST /api/analyze` with body `{ "forceRefresh": true }`
- Check results: `GET /api/gaps`
- Build check: `npx next build` should succeed with no errors
- No formal test framework - verify via build + manual E2E testing

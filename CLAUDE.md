# CLAUDE.md - Silent Stakeholder Project

## Project Overview
A multi-agent AI system that discovers hidden unmet user needs by comparing Google Play reviews against GitHub roadmap issues for **WordPress for Android**. Uses Gemini API for LLM reasoning across a 4-agent pipeline.

## Architecture
```
Preprocessor (local) → LatentNeedDetector (Gemini) → EvidenceVerifier (local) → Critic (Gemini)
```

If Gemini fails at any stage, the error surfaces in `pipeline.errors` — there is no silent fallback that produces fake gaps.

## Folder Structure
```
/
├── app/
│   ├── page.tsx              # Main dashboard (client component)
│   ├── layout.tsx            # Root layout with theme init
│   ├── globals.css           # Tailwind + light/dark variables
│   └── api/
│       ├── analyze/route.ts  # POST: triggers full pipeline
│       ├── gaps/route.ts     # GET: serves cached results
│       └── sources/route.ts  # GET: data source health
├── components/               # React UI components
├── lib/
│   ├── agents/               # 4-step pipeline agents
│   ├── data.ts               # Data loading + caching
│   ├── types.ts              # Core data types
│   └── utils.ts              # Client-safe helpers
├── data/raw/                 # Reviews + issues JSON
└── output/                   # Cached analysis results
```

## Coding Rules
- **TypeScript strict mode** - no `any`, use proper types from `lib/types.ts`
- **Server/Client boundary** - server components in `app/`, client components in `components/`
- **No external API calls from client** - all Gemini calls go through `/api/*` routes
- **Tailwind CSS 4** - use CSS variables for theming, no inline styles
- **Error handling** - agents return typed errors, orchestrator catches and continues. Gemini failures surface as real errors, not silent fallbacks.
- **No comments** - code should be self-documenting
- **Follow existing patterns** - match code style of neighboring files

## Agent System
Each agent in `lib/agents/` exports a single async function:
- `preprocessor.ts`: `preprocessReviews()`, `preprocessIssues()` - local, no Gemini
- `latent-need-detector.ts`: `runLatentNeedDetector()` - Gemini call, finds hidden needs. **No local fallback** — Gemini failure propagates as a real error.
- `evidence-verifier.ts`: `runEvidenceVerifier()` - local verification. Rejects gaps only when BOTH review and issue evidence are empty. Gaps with at least one evidence side survive.
- `critic.ts`: `runCritic()` - Gemini call, adversarial counter-arguments. Gracefully sets counter-argument text on failure.

All agent I/O types defined in `lib/agents/types.ts`.

## Gemini Client
`lib/agents/gemini-client.ts`:
- Model fallback: `gemini-3.6-flash` → `gemini-3.5-flash`
- Retry logic with exponential backoff (3 attempts per model)
- Rate limiting: 1 request/second
- File-based caching in `.cache/gemini/` (1hr TTL)
- Use `callGeminiJson<T>()` for structured JSON responses
- **No silent fallback** — if all models fail, throws `All Gemini models failed after retries`

## Environment Variables
```bash
GEMINI_API_KEY=your_key_here  # Required for Gemini API
GITHUB_TOKEN=your_token_here  # Optional: increases GitHub API rate limit from 60 to 5,000 requests/hour
```

## Running
```bash
npm install
npm run dev      # Dev server on localhost:3000
npx next build   # Production build
```

## Testing
- Pipeline test: `POST /api/analyze`
- Check results: `GET /api/gaps`
- Build check: `npx next build` should succeed with no errors
- No formal test framework - verify via build + manual E2E testing

## Known Behaviors
- **Gemini quota required:** Pipeline fails with clear error if quota is exhausted. No silent fallback.
- **Evidence verification:** Gaps need at least one evidence side (reviews OR issues). Both-empty = rejected.
- **Confidence divergence:** LLM vs computed confidence differing by >15 points flags the gap.
- **Critic failure:** If critic agent fails, gap gets placeholder counter-argument text but is not rejected.

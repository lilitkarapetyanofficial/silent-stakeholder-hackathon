# Silent Stakeholder

**Discovering hidden user needs by comparing Google Play reviews against GitHub roadmap issues for WordPress for Android.**

## The Problem

Product teams build what they *see* in issues and feature requests. But the most valuable insights are buried in user reviews—the "silent stakeholders" who never file bugs but whose frustrations reveal unmet needs. This gap between what users *say* and what teams *build* leaves product opportunities undiscovered.

## How It Works

A multi-agent AI pipeline analyzes 500+ Google Play reviews and 1,000+ GitHub issues to find mismatches between user needs and the product roadmap:

1. **Preprocessor** — Clusters similar reviews using Jaccard similarity, extracts keywords, summarizes issues (local, no API calls)
2. **Review Analyst** — Uses Gemini to find latent hidden needs from clustered reviews
3. **Roadmap Analyst** — Uses Gemini to analyze what the dev team is building (parallel with step 2)
4. **Gap Detector** — Cross-references user needs against roadmap to find mismatches
5. **Evidence Verifier** — Validates that evidence IDs exist in real data, removes unsupported claims
6. **Judge Agent** — Evaluates findings against hackathon quality criteria

Each gap receives a verdict:
- **IGNORED** — Need exists but no roadmap issue addresses it
- **UNDER-PRIORITIZED** — Issues exist but are closed/stale/low-priority
- **MISUNDERSTOOD** — Issues exist but solve a different problem

## Tech Stack

- **Frontend:** Next.js 15, React 19, Tailwind CSS 4, TypeScript
- **AI:** Gemini API (`gemini-3.5-flash` → `gemini-2.0-flash` fallback)
- **Data:** WordPress for Android Play Store reviews + GitHub issues/milestones

## Setup

```bash
# Clone and install
npm install

# Add your Gemini API key
echo "GEMINI_API_KEY=your_key_here" > .env.local

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

1. Click **Analyze** on the dashboard to trigger the full pipeline
2. View discovered gaps with evidence (review quotes + linked issues)
3. Filter by verdict (IGNORED / UNDER-PRIORITIZED / MISUNDERSTOOD)
4. Toggle light/dark mode via the header icon

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analyze` | Run full pipeline. Body: `{ "forceRefresh": true }` |
| `GET` | `/api/gaps` | Get cached results + stats |

## Project Structure

```
├── app/                  # Next.js pages + API routes
│   ├── api/analyze/      # Pipeline trigger
│   └── api/gaps/         # Cached results
├── components/           # React UI components
├── lib/
│   ├── agents/           # 6-step pipeline agents
│   ├── data.ts           # Data loading + caching
│   ├── types.ts          # Core data types
│   └── utils.ts          # Client-safe helpers
├── data/raw/             # 500 reviews + 1000 issues
└── output/               # Cached analysis results
```

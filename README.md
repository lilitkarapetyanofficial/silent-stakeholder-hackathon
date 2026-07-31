# Silent Stakeholder

**Discovering hidden user needs by comparing Google Play reviews against GitHub roadmap issues for WordPress for Android.**

## The Problem

Product teams build what they *see* in issues and feature requests. But the most valuable insights are buried in user reviews—the "silent stakeholders" who never file bugs but whose frustrations reveal unmet needs. This gap between what users *say* and what teams *build* leaves product opportunities undiscovered.

## How It Works

A multi-agent AI pipeline analyzes 500+ Google Play reviews and 1,000+ GitHub issues to find mismatches between user needs and the product roadmap:

1. **Preprocessor** — Clusters similar reviews using Jaccard similarity, extracts keywords, summarizes issues (local, no API calls)
2. **LatentNeedDetector** — Uses Gemini to find hidden unmet needs by cross-referencing user signals against roadmap activity
3. **EvidenceVerifier** — Validates that evidence IDs exist in real data, removes unsupported claims

Each gap receives a verdict:
- **IGNORED** — Need exists but no roadmap issue addresses it
- **UNDER-PRIORITIZED** — Issues exist but are closed/stale/low-priority
- **MISUNDERSTOOD** — Issues exist but solve a different problem

Each gap includes:
- Hidden user need written from the user's perspective
- Confidence score (0-100%) with explanation
- Evidence trace with review IDs and issue numbers
- Defense explanation for live Q&A with judges

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
│   ├── agents/           # 2-step pipeline agents
│   ├── data.ts           # Data loading + caching
│   ├── types.ts          # Core data types
│   └── utils.ts          # Client-safe helpers
├── data/raw/             # 500 reviews + 1000 issues
└── output/               # Cached analysis results
```

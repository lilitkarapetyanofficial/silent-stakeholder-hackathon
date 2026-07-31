# Silent Stakeholder

> **The gap:** Users need to feel confident that their mobile device is a secure, trusted extension of their desktop workspace, without security protocols locking them out of their own creative flow.

**Discovering hidden user needs by comparing Google Play reviews against GitHub roadmap issues for WordPress for Android.**

## The Problem

Product teams build what they *see* in issues and feature requests. But the most valuable insights are buried in user reviews—the "silent stakeholders" who never file bugs but whose frustrations reveal unmet needs. This gap between what users *say* and what teams *build* leaves product opportunities undiscovered.

## How It Works

A multi-agent AI pipeline analyzes Google Play reviews and GitHub issues to find mismatches between user needs and the product roadmap:

1. **Preprocessor** — Clusters similar reviews using Jaccard similarity, extracts keywords, summarizes issues (local, no API calls)
2. **LatentNeedDetector** — Uses Gemini to find hidden unmet needs by cross-referencing user signals against roadmap activity. If Gemini is unavailable, the pipeline surfaces a real error (no silent fallback).
3. **EvidenceVerifier** — Validates that evidence IDs exist in real data, removes unsupported claims. Requires at least one side (reviews OR issues) to have evidence.
4. **Critic** — Uses Gemini to generate adversarial counter-arguments for each gap.

Each gap receives a verdict:
- **IGNORED** — Need exists but no roadmap issue addresses it
- **UNDER-PRIORITIZED** — Issues exist but are closed/stale/low-priority
- **MISUNDERSTOOD** — Issues exist but solve a different problem

Each gap includes:
- Hidden user need written from the user's perspective
- Confidence score (0-100%) with justification
- LLM confidence vs. computed confidence (divergence flagged)
- Evidence trace with review IDs and issue numbers
- Defense explanation for live Q&A with judges
- Counter-argument from adversarial critic

## Data Sources

### User Signals (Reviews)
- **Dataset:** [sealuzh/app_reviews](https://huggingface.co/datasets/sealuzh/app_reviews) from HuggingFace
- **Package:** `org.wordpress.android` (WordPress for Android)
- **Records:** 3,200 reviews filtered from 288,065 total
- **Date Range:** February 2016 - May 2017
- **Fields:** review text, star rating (1-5), date
- **Citation:** Grano, G., Di Sorbo, A., Mercaldo, F., Visaggio, C. A., Canfora, G., & Panichella, S. (2017). Software Applications User Reviews. Zurich Open Repository and Archive.

### Roadmap (GitHub Issues)
- **Repository:** [wordpress-mobile/WordPress-Android](https://github.com/wordpress-mobile/WordPress-Android)
- **Records:** 1,000 issues + 50 milestones
- **Fields:** issue number, title, body, state, labels, milestone, comments, dates

## Tech Stack

- **Frontend:** Next.js 15, React 19, Tailwind CSS 4, TypeScript
- **AI:** Gemini API (`gemini-2.0-flash` primary, `gemini-2.5-flash` fallback)
- **Data:** HuggingFace datasets + GitHub API

## Setup

```bash
# Clone and install
npm install

# Add your Gemini API key
echo "GEMINI_API_KEY=your_key_here" > .env.local

# Optional: add GitHub token for higher rate limits
# GITHUB_TOKEN=your_token_here

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

1. Click **Analyze** on the dashboard to trigger the full pipeline
2. View discovered gaps with evidence (review quotes + linked issues)
3. Filter by verdict (IGNORED / UNDER-PRIORITIZED / MISUNDERSTOOD)
4. Toggle light/dark mode via the header icon
5. Expand a gap to see ranking reasoning, verdict reason, defense explanation, and counter-argument

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analyze` | Run full pipeline (Gemini required) |
| `GET` | `/api/gaps` | Get cached results + stats |
| `GET` | `/api/sources` | Get data source health info |

## Project Structure

```
├── app/                  # Next.js pages + API routes
│   ├── api/analyze/      # Pipeline trigger
│   ├── api/gaps/         # Cached results
│   └── api/sources/      # Source health
├── components/           # React UI components
├── lib/
│   ├── agents/           # 4-step pipeline agents
│   ├── data.ts           # Data loading + caching
│   ├── types.ts          # Core data types
│   └── utils.ts          # Client-safe helpers
├── data/raw/             # Reviews + issues JSON
└── output/               # Cached analysis results
```

## Known Behaviors

- **Gemini quota required:** The pipeline requires a valid Gemini API key with available quota. If quota is exhausted, the pipeline fails with a clear error in `pipeline.errors` — no silent fallback produces fake gaps.
- **Evidence verification:** Gaps are rejected if both review and issue evidence are empty. Gaps with only reviews or only issues are allowed (e.g., IGNORED gaps may have no matching issues).
- **Confidence divergence:** When LLM confidence and computed confidence differ by more than 15 points, the gap is flagged for manual review.

import type { Review, Issue, Gap, EvidenceReview, EvidenceIssue } from "./types";

const MODELS = [
  "gemini-3.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-flash-preview-tts",
];

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set in .env.local");
  return key;
}

async function callGeminiWithRetry(prompt: string, retries = 3): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    for (const model of MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${getApiKey()}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 8192,
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text;
        }

        if (response.status === 503) {
          await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }

        const err = await response.text();
        throw new Error(`Gemini ${model} error: ${response.status} - ${err}`);
      } catch (e) {
        if (attempt === retries - 1 && model === MODELS[MODELS.length - 1]) {
          throw e;
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }
  throw new Error("All Gemini models failed after retries");
}

function sampleReviews(reviews: Review[], count: number): Review[] {
  const lowRated = reviews.filter((r) => r.score <= 3);
  const highThumbs = [...reviews].sort((a, b) => b.thumbs_up - a.thumbs_up);
  const sampled: Review[] = [];
  const seen = new Set<string>();

  for (const r of lowRated) {
    if (sampled.length >= count) break;
    if (!seen.has(r.id)) { sampled.push(r); seen.add(r.id); }
  }
  for (const r of highThumbs) {
    if (sampled.length >= count) break;
    if (!seen.has(r.id)) { sampled.push(r); seen.add(r.id); }
  }
  return sampled;
}

function sampleIssues(issues: Issue[], count: number): Issue[] {
  return [...issues].sort((a, b) => b.comments - a.comments).slice(0, count);
}

interface GeminiGap {
  topic: string;
  need: string;
  explanation: string;
  confidence: number;
  verdict: "IGNORED" | "UNDER-PRIORITIZED" | "MISUNDERSTOOD";
  confidenceReasoning: string;
  evidenceReviews: { content: string; score: number; thumbsUp: number }[];
  matchedIssueNumbers: number[];
}

export async function analyzeWithGemini(
  reviews: Review[],
  issues: Issue[]
): Promise<{ gaps: Gap[]; rawAnalysis: string }> {
  const sampledReviews = sampleReviews(reviews, 40);
  const sampledIssues = sampleIssues(issues, 30);

  const reviewText = sampledReviews
    .map((r, i) => `[Review ${i + 1}] ID:${r.id} | ${r.score}★ | ${r.thumbs_up}👍 | ${r.at?.slice(0, 10) || "?"}\n${r.content.slice(0, 300)}`)
    .join("\n\n");

  const issueText = sampledIssues
    .map((i) => `[#${i.number}] ${i.state} | ${i.labels.join(",") || "none"} | ${i.comments}💬\n${i.title}`)
    .join("\n");

  const prompt = `You are a senior product strategy analyst. Analyze WordPress for Android.

FIND THE TOP 5 LATENT UNMET USER NEEDS - deeper than surface complaints.

USER REVIEWS (${sampledReviews.length} sampled from ${reviews.length}):
${reviewText}

GITHUB ROADMAP (${sampledIssues.length} sampled from ${issues.length}):
${issueText}

RULES:
- Do NOT summarize complaints. Find HIDDEN underlying needs.
- "Users complain about uploads" is BAD. "Users need confidence their content is safe" is GOOD.
- Connect what users SIGNAL to what the roadmap MISSES.

Return a JSON array of exactly 5 objects:
[{
  "topic": "kebab-case-label",
  "need": "The hidden user need in plain English (1 sentence)",
  "explanation": "Why this is a hidden need the team is missing (2 sentences)",
  "confidence": 0.0-1.0,
  "verdict": "IGNORED|UNDER-PRIORITIZED|MISUNDERSTOOD",
  "confidenceReasoning": "Why this confidence score (2 sentences)",
  "evidenceReviews": [{"content":"quote", "score":N, "thumbsUp":N}],
  "matchedIssueNumbers": [123]
}]

IGNORED=no roadmap coverage. UNDER-PRIORITIZED=exists but insufficient. MISUNDERSTOOD=wrong solution.
Return ONLY the JSON array.`;

  const rawAnalysis = await callGeminiWithRetry(prompt);

  let parsed: GeminiGap[];
  try {
    const jsonMatch = rawAnalysis.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array found in response");
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return { gaps: [], rawAnalysis };
  }

  const issueMap = new Map(issues.map((i) => [i.number, i]));

  const gaps: Gap[] = parsed.map((g, idx) => {
    const evidenceReviews: EvidenceReview[] = g.evidenceReviews.map((e) => {
      const match = sampledReviews.find((r) => r.content.slice(0, 50) === e.content.slice(0, 50));
      return {
        reviewId: match?.id || `rev-local-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        content: e.content,
        score: e.score,
        thumbsUp: e.thumbsUp,
        date: match?.at || "unknown",
      };
    });

    const evidenceIssues: EvidenceIssue[] = g.matchedIssueNumbers.map((num) => {
      const issue = issueMap.get(num);
      return {
        issueNumber: num,
        title: issue?.title || `Issue #${num}`,
        url: issue?.url || `https://github.com/wordpress-mobile/WordPress-Android/issues/${num}`,
        state: issue?.state || "unknown",
        labels: issue?.labels || [],
      };
    });

    const matchedReviews = sampledReviews.filter((r) =>
      g.evidenceReviews.some((e) => e.content.slice(0, 40) === r.content.slice(0, 40))
    );

    return {
      id: `gap-${idx + 1}`,
      topic: g.topic,
      need: g.need,
      explanation: g.explanation,
      confidence: Math.min(1, Math.max(0, g.confidence)),
      confidenceBreakdown: {
        volume: Math.min(1, matchedReviews.length / sampledReviews.length * 3),
        social: g.confidence * 0.8,
        pain: Math.min(1, Math.max(0, (3.5 - (matchedReviews.reduce((s, r) => s + r.score, 0) / (matchedReviews.length || 1))) / 2)),
        coverage: g.matchedIssueNumbers.length > 0 ? 0.2 : 0.8,
      },
      confidenceExplanation: g.confidenceReasoning,
      verdict: g.verdict,
      evidence: {
        reviews: evidenceReviews.slice(0, 3),
        issues: evidenceIssues.slice(0, 5),
      },
      createdAt: new Date().toISOString(),
    };
  });

  return { gaps, rawAnalysis };
}

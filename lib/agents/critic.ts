import { appendFileSync } from "fs";
import type { Review, Issue } from "../types";
import type { VerifiedGap } from "./types";
import { callGeminiJson } from "./gemini-client";

interface CriticResponse {
  counterArgument: string;
}

export async function runCritic(
  verifiedGaps: VerifiedGap[],
  reviews: Review[],
  issues: Issue[]
): Promise<VerifiedGap[]> {
  const reviewMap = new Map(reviews.map((r) => [r.id, r]));
  const issueMap = new Map(issues.map((i) => [i.number, i]));

  const results: VerifiedGap[] = [];

  for (const gap of verifiedGaps) {
    const reviewEvidenceText = gap.evidence.reviews
      .map((r) => {
        const full = reviewMap.get(r.reviewId);
        return `[${r.reviewId}] ${r.score}★ — "${(full?.content ?? r.content).slice(0, 300)}"`;
      })
      .join("\n");

    const issueEvidenceText = gap.evidence.issues
      .map((i) => {
        const full = issueMap.get(i.issueNumber);
        return `[#${i.issueNumber}] ${i.state} — "${(full?.title ?? i.title).slice(0, 200)}"`;
      })
      .join("\n");

    const prompt = `You are an adversarial critic reviewing a proposed "latent user need" gap for the WordPress for Android app.

YOUR JOB: Argue the STRONGEST possible case AGAINST this being a real, unmet user gap.

GAP UNDER REVIEW:
- Topic: ${gap.topic}
- User Need: ${gap.userNeed}
- Verdict: ${gap.verdict}
- Confidence: ${gap.llmConfidence}%
- Explanation: ${gap.explanation}

EVIDENCE REVIEWS (${gap.evidence.reviews.length} sources):
${reviewEvidenceText || "No review evidence"}

EVIDENCE ISSUES (${gap.evidence.issues.length} issues):
${issueEvidenceText || "No issue evidence"}

RULES FOR YOUR COUNTER-ARGUMENT:
1. Provide ALTERNATIVE EXPLANATIONS for the evidence (e.g., users might be confused, not actually blocked)
2. Point out CONTRADICTING EVIDENCE if any reviews actually praise the feature
3. Question whether the gap is already adequately addressed by existing issues or features
4. Challenge the severity or business impact
5. Be specific — cite review IDs, issue numbers, or quote text
6. Keep it to 2-4 sentences, tight and focused
7. Do NOT agree with the gap. Your role is purely adversarial.

Return ONLY a JSON object: { "counterArgument": "your adversarial analysis" }`;

    try {
      const response = await callGeminiJson<CriticResponse>(prompt, {
        temperature: 0.5,
        maxTokens: 500,
      });
      results.push({ ...gap, counterArgument: response.counterArgument });
    } catch (e) {
      const errorDetail = e instanceof Error ? (e.stack || e.message) : String(e);
      appendFileSync("critic-error.log", `[${new Date().toISOString()}] ${errorDetail}\n\n`);
      console.error("[Critic] Full error:", e);
      results.push({
        ...gap,
        counterArgument: `Counter-argument unavailable: critic agent failed to process this gap.`,
      });
    }
  }

  return results;
}

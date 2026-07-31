import type { Review, Issue } from "../types";
import type { PreprocessedData, IssueSummary, LatentNeedDetectorOutput } from "./types";
import { callGeminiJson } from "./gemini-client";

export async function runLatentNeedDetector(
  preprocessed: PreprocessedData,
  issues: Issue[],
  issueSummary: IssueSummary
): Promise<LatentNeedDetectorOutput> {
  const clusterSummaries = preprocessed.clusters.slice(0, 15).map((c, i) =>
    `Cluster ${i + 1} (${c.clusterSize} reviews, avg ${c.avgScore.toFixed(1)} stars, ${c.totalThumbsUp} thumbs-up):
Keywords: ${c.keywords.join(", ")}
Representative: "${c.representativeReview.content.slice(0, 200)}"`
  ).join("\n\n");

  const lowRatedSummary = preprocessed.topLowRated.slice(0, 10).map((r) =>
    `[${r.score} stars ${r.thumbs_up} thumbs-up] ${r.content.slice(0, 150)}`
  ).join("\n");

  const highCommentSummary = issueSummary.highCommentIssues.slice(0, 20).map((i) =>
    `[#${i.number}] ${i.state} | ${i.labels.join(",") || "none"} | ${i.comments} comments | ${i.milestone || "no milestone"}
${i.title}`
  ).join("\n");

  const labelSummary = issueSummary.topLabels.map((l) => `${l.label} (${l.count})`).join(", ");
  const milestoneSummary = issueSummary.topMilestones.map((m) => `${m.milestone} (${m.count} issues)`).join(", ");

  const prompt = `You are a latent need detection specialist for the WordPress for Android mobile app.

YOUR MISSION: Find HIDDEN UNMET USER NEEDS that the product roadmap is missing or under-serving. You are NOT summarizing complaints. You are inferring what users NEED but NEVER SAID OUT LOUD.

━━━━━━━━━━━━━━━━━━

INPUT DATA:

REVIEW CLUSTERS (${preprocessed.totalClusters} clusters from ${preprocessed.totalReviews} reviews):
${clusterSummaries}

TOP LOW-RATED REVIEWS (highest pain signals):
${lowRatedSummary}

GITHUB ROADMAP:
Total issues: ${issueSummary.total} (${issueSummary.open} open, ${issueSummary.closed} closed)
Top labels: ${labelSummary}
Top milestones: ${milestoneSummary || "none"}

MOST-DISCUSSED ISSUES (sorted by community engagement):
${highCommentSummary}

━━━━━━━━━━━━━━━━━━

DETECTION RULES:

1. Find SECOND-ORDER patterns. Users rarely state their real need directly.
   - "App crashes when uploading" → SECOND-ORDER: "Users need to trust the app won't lose their work during critical moments"
   - "Can't find the editor" → SECOND-ORDER: "Users need intuitive navigation that respects their workflow"
   - "Login fails sometimes" → SECOND-ORDER: "Users need reliable access without friction"

2. Cross-reference EVERY user signal against the roadmap:
   - If NO roadmap issue addresses it → IGNORED
   - If issues exist but are closed/stale/low-priority → UNDER-PRIORITIZED
   - If issues exist but solve a DIFFERENT problem than what users actually need → MISUNDERSTOOD

3. Rank gaps by STRENGTH OF EVIDENCE, not frequency:
   - Number of supporting reviews (more = stronger)
   - Consistency across users (same pattern in different reviews = stronger)
   - Severity of pain (low ratings + high thumbs-up = stronger)
   - Roadmap gap size (completely missing = stronger)

4. For each gap, generate a DEFENSE EXPLANATION that answers:
   "Why do you believe this is a real unmet need?"
   This must be specific enough to defend during a live Q&A with hackathon judges.

━━━━━━━━━━━━━━━━━━

Return JSON:
{
  "gaps": [
    {
      "topic": "kebab-case-label",
      "hiddenNeed": "Users need [specific need] (1 sentence, in user's plain language, NOT technical)",
      "confidence": 85,
      "confidenceExplanation": "Why this confidence score: evidence volume, consistency across users, severity of pain signals, and roadmap gap size (2-3 sentences)",
      "verdict": "IGNORED|UNDER-PRIORITIZED|MISUNDERSTOOD",
      "supportingReviewIds": ["rev-xxx"],
      "supportingQuotes": ["exact quote from review that reveals the hidden need"],
      "relatedIssueNumbers": [123],
      "defenseExplanation": "Why this is a real unmet need: specific evidence that proves this is not just a complaint but a genuine gap in the product (2-3 sentences, ready for live Q&A)"
    }
  ],
  "stats": {
    "totalReviews": ${preprocessed.totalReviews},
    "totalIssues": ${issueSummary.total},
    "clustersFormed": ${preprocessed.totalClusters},
    "avgRating": 0.0
  }
}

RULES:
- Return TOP 3-5 gaps only. Quality over quantity.
- confidence MUST be an integer from 0-100 (not decimal).
- Every gap MUST have at least 1 supporting review ID.
- Every insight MUST be provable from the data.
- Do NOT return generic complaints. Return HIDDEN NEEDS.
- Do NOT rank by frequency only. Rank by evidence strength.

Return ONLY the JSON.`;

  return callGeminiJson<LatentNeedDetectorOutput>(prompt, { temperature: 0.3 });
}

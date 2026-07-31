import type { Issue } from "../types";
import type { PreprocessedData, IssueSummary, LatentNeedDetectorOutput } from "./types";
import { callGeminiJson } from "./gemini-client";

export async function runLatentNeedDetector(
  preprocessed: PreprocessedData,
  issues: Issue[],
  issueSummary: IssueSummary,
  product: string,
  reviewsAvailable: boolean
): Promise<LatentNeedDetectorOutput> {
  const clusterSummaries = preprocessed.clusters.slice(0, 15).map((c, i) =>
    `Cluster ${i + 1} (${c.clusterSize} reviews, avg ${c.avgScore.toFixed(1)} stars, ${c.totalThumbsUp} thumbs-up):
Keywords: ${c.keywords.join(", ")}
Review IDs in this cluster: ${c.similarReviewIds.slice(0, 10).join(", ")}
Representative [ID:${c.representativeReview.id}]: "${c.representativeReview.content.slice(0, 200)}"`
  ).join("\n\n");

  const lowRatedSummary = preprocessed.topLowRated.slice(0, 10).map((r) =>
    `[ID:${r.id}] ${r.score} stars ${r.thumbs_up} thumbs-up | ${r.at?.slice(0, 10) || "?"}
${r.content.slice(0, 200)}`
  ).join("\n\n");

  const highCommentSummary = issueSummary.highCommentIssues.slice(0, 50).map((i) =>
    `[#${i.number}] ${i.state} | ${i.labels.join(",") || "none"} | ${i.comments} comments | ${i.milestone || "no milestone"}
${i.title}`
  ).join("\n");

  const labelSummary = issueSummary.topLabels.map((l) => `${l.label} (${l.count})`).join(", ");
  const milestoneSummary = issueSummary.topMilestones.map((m) => `${m.milestone} (${m.count} issues)`).join(", ");

  const prompt = `You are a latent need detection specialist for the ${product} mobile app.

YOUR MISSION: Find HIDDEN UNMET USER NEEDS that the product roadmap is missing or under-serving. You are NOT summarizing complaints. You are inferring what users NEED but NEVER SAID OUT LOUD.

━━━━━━━━━━━━━━━━━━━

INPUT DATA:

REVIEW AVAILABILITY: ${reviewsAvailable ? "User reviews are available and included below." : "No user review data available for this product. Base your analysis solely on the GitHub roadmap issues."}

REVIEW CLUSTERS (${preprocessed.totalClusters} clusters from ${preprocessed.totalReviews} reviews):
${clusterSummaries}

TOP LOW-RATED REVIEWS (highest pain signals):
${lowRatedSummary}

GITHUB ROADMAP:
Total issues: ${issueSummary.total} (${issueSummary.open} open, ${issueSummary.closed} closed)
Top labels: ${labelSummary}
Top milestones: ${milestoneSummary || "none"}

OPEN ISSUE NUMBERS (for checking if gap is already tracked):
${issueSummary.openIssueNumbers.slice(0, 100).join(", ")}

MOST-DISCUSSED ISSUES (sorted by community engagement):
${highCommentSummary}

━━━━━━━━━━━━━━━━━━

DETECTION RULES:

1. Find SECOND-ORDER patterns. Users rarely state their real need directly.
   - "App crashes when uploading" → SECOND-ORDER: "Users need to trust the app won't lose their work during critical moments"
   - "Can't find the editor" → SECOND-ORDER: "Users need intuitive navigation that respects their workflow"
   - "Login fails sometimes" → SECOND-ORDER: "Users need reliable access without friction"

2. CRITICAL CHECK: Is this gap already an open GitHub issue?
   - If YES and the roadmap is handling it adequately → EXCLUDE this gap entirely
   - If YES but the roadmap is clearly mishandling it (wrong solution, not enough focus) → classify as MISUNDERSTOOD
   - If NO open issue exists → classify as IGNORED
   - If issue exists but is closed/stale/low-priority → classify as UNDER-PRIORITIZED

3. BAN surface-level complaint summarization:
   - "Users complain about crashes" = BAD (this is a complaint summary)
   - "Users need confidence their work is safe during publishing" = GOOD (this is an inferred need)
   - Do NOT output a gap if it's simply "users are frequently annoyed by X" and X is already tracked

4. Rank gaps by EVIDENCE STRENGTH (define your ranking rationale):
   Strength = (a) number of independent supporting signals × (b) consistency across sources × (c) recency
   - More independent reviews mentioning same pattern = stronger
   - Same pattern appearing in different contexts = stronger
   - Recent reviews = stronger than old reviews
   - You MUST include rankingReasoning explaining WHY this gap is ranked at its position

━━━━━━━━━━━━━━━━━━

For EVERY gap, produce ALL FOUR of these fields (no exceptions):

{
  "topic": "kebab-case-label",
  "hiddenNeed": "The user's need stated in THEIR words/framing, not technical language. 1 sentence.",
  "confidence": 85,
  "confidenceJustification": "62% — corroborated by 14 reviews across 2 time periods but contradicted by 3 reviews praising the same feature",
  "verdict": "IGNORED|UNDER-PRIORITIZED|MISUNDERSTOOD",
  "verdictReason": "One sentence explaining WHY this specific verdict label applies",
  "supportingReviewIds": ["rev-xxx", "rev-yyy"],
  "supportingQuotes": ["exact quote from review that reveals the hidden need"],
  "relatedIssueNumbers": [123],
  "defenseExplanation": "Why this is a real unmet need: specific evidence that proves this is not just a complaint but a genuine gap in the product (2-3 sentences, ready for live Q&A)",
  "rankingReasoning": "Ranked #1 because: 23 independent reviews, consistent across 3 months, no open GitHub issue addressing this specific need"
}

━━━━━━━━━━━━━━━━━━

RULES:
- Return TOP 3-5 gaps ONLY. Quality over quantity.
- confidence MUST be an integer from 0-100 (not decimal).
- Every gap MUST have at least 1 supporting review ID.
- supportingReviewIds MUST be copied exactly from an [ID:...] tag or a 'Review IDs in this cluster' list shown above — never invented. If you cannot find a real review ID to cite, do not create the gap.
- Every gap MUST have ALL FOUR fields: hiddenNeed, confidenceJustification, verdictReason, defenseExplanation
- Every insight MUST be provable from the data.
- Do NOT return generic complaints. Return HIDDEN NEEDS.
- Do NOT include gaps where the issue is already open and being handled (除非 roadmap is clearly mishandling it)
- rankingReasoning MUST explain the evidence strength calculation

Return ONLY the JSON.`;

  const result = await callGeminiJson<{ gaps?: LatentNeedDetectorOutput["gaps"]; stats?: LatentNeedDetectorOutput["stats"] } | LatentNeedDetectorOutput["gaps"]>(prompt, { temperature: 0.3 });

  const gapsArray = Array.isArray(result) ? result : (result.gaps ?? []);
  console.log(`[LatentNeedDetector] Gemini returned ${gapsArray.length} gaps`);
  if (gapsArray.length > 0) {
    for (const g of gapsArray) {
      console.log(`  Gap: "${g.topic}" | reviewIds: [${(g.supportingReviewIds || []).join(", ")}] | issueNums: [${(g.relatedIssueNumbers || []).join(", ")}]`);
    }
  }

  return {
    gaps: gapsArray.map((g) => ({ ...g, product })),
    stats: Array.isArray(result) ? {
      totalReviews: preprocessed.totalReviews,
      totalIssues: issueSummary.total,
      clustersFormed: preprocessed.totalClusters,
      avgRating: 0,
    } : (result.stats ?? {
      totalReviews: preprocessed.totalReviews,
      totalIssues: issueSummary.total,
      clustersFormed: preprocessed.totalClusters,
      avgRating: 0,
    }),
  };
}

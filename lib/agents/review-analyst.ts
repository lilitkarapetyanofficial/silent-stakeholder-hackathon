import type { PreprocessedData, ReviewAgentOutput } from "./types";
import { callGeminiJson } from "./gemini-client";

export async function runReviewAnalyst(
  preprocessed: PreprocessedData
): Promise<ReviewAgentOutput> {
  const clusterSummaries = preprocessed.clusters.slice(0, 15).map((c, i) =>
    `Cluster ${i + 1} (${c.clusterSize} reviews, avg ${c.avgScore.toFixed(1)}★, ${c.totalThumbsUp}👍):
Keywords: ${c.keywords.join(", ")}
Representative: "${c.representativeReview.content.slice(0, 200)}"`
  ).join("\n\n");

  const lowRatedSummary = preprocessed.topLowRated.slice(0, 10).map((r) =>
    `[${r.score}★ ${r.thumbs_up}👍] ${r.content.slice(0, 150)}`
  ).join("\n");

  const prompt = `You are a user research analyst for the WordPress for Android mobile app.

Your job: Find LATENT, HIDDEN USER NEEDS that go beyond surface complaints. Do NOT just summarize - find the deeper need underneath.

PREPROCESSED REVIEW CLUSTERS (${preprocessed.totalClusters} clusters from ${preprocessed.totalReviews} reviews):
${clusterSummaries}

TOP LOW-RATED REVIEWS:
${lowRatedSummary}

Analyze these clusters and find the TOP 5 hidden user needs.

RULES:
- Do NOT say "users want bug fixes" - find the UNDERLYING need
- Instead of "app crashes" → find "users need reliability to trust the app for professional work"
- Instead of "slow uploads" → find "users need confidence their content is being processed"
- Instead of "login issues" → find "users need seamless access without friction"
- Each need must connect to actual review evidence

Return JSON:
{
  "latentNeeds": [
    {
      "topic": "kebab-case-label",
      "needStatement": "Users need [specific need] (1 sentence, plain English)",
      "explanation": "Why this is hidden (2-3 sentences)",
      "sentiment": "frustrated|confused|hoping|angry",
      "frequency": "high|medium|low",
      "supportingClusters": ["cluster-0", "cluster-1"],
      "sampleReviewIds": ["rev-xxx"],
      "sampleQuotes": ["exact quote from review"]
    }
  ],
  "reviewStats": {
    "totalAnalyzed": ${preprocessed.totalReviews},
    "clustersFormed": ${preprocessed.totalClusters},
    "avgRating": 0.0,
    "topComplaintThemes": ["theme1", "theme2"]
  }
}`;

  return callGeminiJson<ReviewAgentOutput>(prompt, { temperature: 0.4 });
}

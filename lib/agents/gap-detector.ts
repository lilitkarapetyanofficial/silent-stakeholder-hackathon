import type { ReviewAgentOutput, RoadmapAgentOutput, GapAgentOutput } from "./types";
import { callGeminiJson } from "./gemini-client";

export async function runGapDetector(
  reviewAnalysis: ReviewAgentOutput,
  roadmapAnalysis: RoadmapAgentOutput
): Promise<GapAgentOutput> {
  const needsJson = JSON.stringify(reviewAnalysis.latentNeeds, null, 2);
  const roadmapJson = JSON.stringify({
    activeWork: roadmapAnalysis.activeWork,
    plannedFeatures: roadmapAnalysis.plannedFeatures,
    roadmapGaps: roadmapAnalysis.roadmapGaps,
  }, null, 2);

  const prompt = `You are a gap detection specialist for the WordPress for Android mobile app.

Your job: Find MISMATCHES between what users NEED and what the roadmap DELIVERS.

USER NEEDS (from Review Analyst):
${needsJson}

PRODUCT ROADMAP (from Roadmap Analyst):
${roadmapJson}

For each user need, cross-reference against the roadmap:
- If NO roadmap issue addresses it → IGNORED
- If issues exist but are closed/stale/low-priority → UNDER-PRIORITIZED
- If issues exist but solve a DIFFERENT problem → MISUNDERSTOOD

Find the TOP 3-5 most significant gaps. Quality over quantity.

Return JSON:
{
  "gaps": [
    {
      "topic": "kebab-case-label",
      "userNeed": "The user need in plain English (1 sentence)",
      "whyHidden": "Why this gap exists and why the team missed it (2-3 sentences)",
      "confidence": 0.0-1.0,
      "verdict": "IGNORED|UNDER-PRIORITIZED|MISUNDERSTOOD",
      "confidenceReasoning": "Why this confidence score (2 sentences)",
      "supportingReviewIds": ["rev-xxx"],
      "supportingQuotes": ["exact quote from review"],
      "relatedIssueNumbers": [123]
    }
  ]
}`;

  return callGeminiJson<GapAgentOutput>(prompt, { temperature: 0.3 });
}

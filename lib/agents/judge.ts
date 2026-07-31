import type { VerifiedGap, JudgeAgentOutput } from "./types";
import { callGeminiJson } from "./gemini-client";

export async function runJudge(
  gaps: VerifiedGap[],
  reviewCount: number,
  issueCount: number
): Promise<JudgeAgentOutput> {
  const gapsJson = gaps.map((g) => ({
    topic: g.topic,
    need: g.userNeed,
    verdict: g.verdict,
    confidence: g.confidence,
    evidenceReviews: g.evidence.reviews.length,
    evidenceIssues: g.evidence.issues.length,
  }));

  const prompt = `You are a hackathon judge evaluator for the "Silent Stakeholder" project.

PROJECT: An AI multi-agent system that discovers hidden user needs by comparing Google Play reviews against GitHub roadmap issues for WordPress for Android.

DATA: ${reviewCount} reviews analyzed, ${issueCount} GitHub issues analyzed.

FINDINGS (${gaps.length} gaps discovered):
${JSON.stringify(gapsJson, null, 2)}

Evaluate against hackathon criteria:

1. INNOVATION (0-25): Does this solve a real problem in a novel way?
2. TECHNICAL EXECUTION (0-25): Is the architecture clean? Does it work?
3. IMPACT (0-25): Would product teams actually use this?
4. DEMO QUALITY (0-25): Is it clear, polished, and compelling?

Return JSON:
{
  "totalScore": 0-100,
  "maxScore": 100,
  "overallFeedback": "2-3 sentence overall assessment",
  "scores": [
    {
      "category": "Innovation",
      "score": 0-25,
      "maxScore": 25,
      "feedback": "specific feedback"
    }
  ],
  "improvements": ["specific improvement 1", "improvement 2"],
  "strengths": ["strength 1", "strength 2"]
}`;

  return callGeminiJson<JudgeAgentOutput>(prompt, { temperature: 0.5 });
}

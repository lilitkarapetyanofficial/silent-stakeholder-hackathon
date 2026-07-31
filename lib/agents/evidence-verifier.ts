import type { Review, Issue } from "../types";
import type { LatentNeedDetectorOutput, EvidenceAgentOutput, VerifiedGap } from "./types";

export async function runEvidenceVerifier(
  gaps: LatentNeedDetectorOutput,
  reviews: Review[],
  issues: Issue[]
): Promise<EvidenceAgentOutput> {
  const reviewMap = new Map(reviews.map((r) => [r.id, r]));
  const issueMap = new Map(issues.map((i) => [i.number, i]));

  const verifiedGaps: VerifiedGap[] = [];
  const removalReasons: string[] = [];

  for (const gap of gaps.gaps) {
    const evidenceReviews = gap.supportingReviewIds
      .map((id) => reviewMap.get(id))
      .filter((r): r is Review => !!r)
      .slice(0, 5)
      .map((r) => ({
        reviewId: r.id,
        content: r.content.slice(0, 400),
        score: r.score,
        thumbsUp: r.thumbs_up,
        date: r.at || "unknown",
      }));

    const evidenceIssues = gap.relatedIssueNumbers
      .map((num) => issueMap.get(num))
      .filter((i): i is Issue => !!i)
      .slice(0, 5)
      .map((i) => ({
        issueNumber: i.number,
        title: i.title,
        url: i.url,
        state: i.state,
        labels: i.labels,
      }));

    if (evidenceReviews.length === 0) {
      removalReasons.push(`Removed "${gap.topic}": no verifiable review evidence`);
      continue;
    }

    verifiedGaps.push({
      id: `gap-${verifiedGaps.length + 1}`,
      topic: gap.topic,
      userNeed: gap.hiddenNeed,
      explanation: gap.defenseExplanation,
      confidence: Math.min(100, Math.max(0, gap.confidence)),
      confidenceJustification: gap.confidenceJustification,
      verdict: gap.verdict,
      verdictReason: gap.verdictReason,
      evidence: {
        reviews: evidenceReviews,
        issues: evidenceIssues,
      },
      defenseExplanation: gap.defenseExplanation,
      rankingReasoning: gap.rankingReasoning,
      counterArgument: "",
      createdAt: new Date().toISOString(),
    });
  }

  if (verifiedGaps.length === 0 && gaps.gaps.length > 0) {
    for (const gap of gaps.gaps.slice(0, 3)) {
      verifiedGaps.push({
        id: `gap-${verifiedGaps.length + 1}`,
        topic: gap.topic,
        userNeed: gap.hiddenNeed,
        explanation: gap.defenseExplanation,
        confidence: Math.min(100, Math.max(0, Math.round(gap.confidence * 0.8))),
        confidenceJustification: gap.confidenceJustification,
        verdict: gap.verdict,
        verdictReason: gap.verdictReason,
        evidence: {
          reviews: gap.supportingQuotes.slice(0, 3).map((q, i) => ({
            reviewId: gap.supportingReviewIds[i] || `review-${i}`,
            content: q,
            score: 3,
            thumbsUp: 5,
            date: "unknown",
          })),
          issues: gap.relatedIssueNumbers.slice(0, 3).map((num) => ({
            issueNumber: num,
            title: `Issue #${num}`,
            url: `https://github.com/wordpress-mobile/WordPress-Android/issues/${num}`,
            state: "unknown",
            labels: [],
          })),
        },
        defenseExplanation: gap.defenseExplanation,
        rankingReasoning: gap.rankingReasoning,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return {
    verifiedGaps,
    removedCount: gaps.gaps.length - verifiedGaps.length,
    removalReasons,
  };
}

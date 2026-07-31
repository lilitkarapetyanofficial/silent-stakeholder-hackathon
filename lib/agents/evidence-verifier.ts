import type { Review, Issue } from "../types";
import type { LatentNeedDetectorOutput, EvidenceAgentOutput, VerifiedGap } from "./types";

const STALE_ISSUE_DAYS = 180;
const CONFIDENCE_DIVERGENCE_THRESHOLD = 15;

function computedConfidence(
  gap: { supportingReviewIds: string[]; relatedIssueNumbers: number[] },
  reviews: Review[],
  issues: Issue[]
): number {
  const reviewMap = new Map(reviews.map((r) => [r.id, r]));
  const issueMap = new Map(issues.map((i) => [i.number, i]));

  const matchedReviews = gap.supportingReviewIds
    .map((id) => reviewMap.get(id))
    .filter((r): r is Review => !!r);

  if (matchedReviews.length === 0) return 0;

  const clusterSizeScore = Math.min(30, matchedReviews.length * 6);

  const avgRating = matchedReviews.reduce((sum, r) => sum + r.score, 0) / matchedReviews.length;
  const ratingScore = Math.round((avgRating / 5) * 25);

  const now = Date.now();
  const threeMonthsAgo = now - 90 * 24 * 60 * 60 * 1000;
  const recentCount = matchedReviews.filter((r) => {
    if (!r.at) return false;
    return new Date(r.at).getTime() > threeMonthsAgo;
  }).length;
  const recencyScore = Math.round((recentCount / matchedReviews.length) * 25);

  const matchedIssues = gap.relatedIssueNumbers
    .map((num) => issueMap.get(num))
    .filter((i): i is Issue => !!i);

  let issueScore = 0;
  if (matchedIssues.length > 0) {
    const openCount = matchedIssues.filter((i) => i.state === "open").length;
    const staleCount = matchedIssues.filter((i) => {
      if (i.state === "closed") return false;
      const updatedAt = new Date(i.updated_at).getTime();
      return now - updatedAt > STALE_ISSUE_DAYS * 24 * 60 * 60 * 1000;
    }).length;

    if (openCount > 0) issueScore = 10 + Math.min(10, staleCount * 5);
    else issueScore = 5;
  }

  return Math.min(100, Math.max(0, clusterSizeScore + ratingScore + recencyScore + issueScore));
}

function makeVerifiedGap(
  gap: LatentNeedDetectorOutput["gaps"][0],
  evidenceReviews: VerifiedGap["evidence"]["reviews"],
  evidenceIssues: VerifiedGap["evidence"]["issues"],
  allReviews: Review[],
  allIssues: Issue[],
  product: string,
  reviewsAvailable: boolean
): VerifiedGap {
  const llmConf = Math.min(100, Math.max(0, gap.confidence));
  const compConf = computedConfidence(gap, allReviews, allIssues);
  return {
    id: `gap-0`,
    topic: gap.topic,
    userNeed: gap.hiddenNeed,
    explanation: gap.defenseExplanation,
    llmConfidence: llmConf,
    computedConfidence: compConf,
    flagged: Math.abs(llmConf - compConf) > CONFIDENCE_DIVERGENCE_THRESHOLD,
    confidenceJustification: gap.confidenceJustification,
    verdict: gap.verdict,
    verdictReason: gap.verdictReason,
    evidence: { reviews: evidenceReviews, issues: evidenceIssues },
    defenseExplanation: gap.defenseExplanation,
    rankingReasoning: gap.rankingReasoning,
    counterArgument: "",
    product,
    reviewsAvailable,
    createdAt: new Date().toISOString(),
  };
}

export async function runEvidenceVerifier(
  gaps: LatentNeedDetectorOutput,
  reviews: Review[],
  issues: Issue[],
  product: string,
  reviewsAvailable: boolean
): Promise<EvidenceAgentOutput> {
  const reviewMap = new Map(reviews.map((r) => [r.id, r]));
  const issueMap = new Map(issues.map((i) => [i.number, i]));

  const verifiedGaps: VerifiedGap[] = [];
  const removalReasons: string[] = [];

  for (const gap of gaps.gaps) {
    console.log(`[EvidenceVerifier] Checking gap "${gap.topic}" | reviewIds: [${gap.supportingReviewIds.join(", ")}] | issueNums: [${gap.relatedIssueNumbers.join(", ")}]`);
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

    if (evidenceReviews.length === 0 && evidenceIssues.length === 0) {
      console.log(`  -> REMOVED: no matching reviews (${gap.supportingReviewIds.length} IDs tried) and no matching issues (${gap.relatedIssueNumbers.length} nums tried)`);
      removalReasons.push(`Removed "${gap.topic}": no verifiable review or issue evidence`);
      continue;
    }
    console.log(`  -> KEPT: ${evidenceReviews.length} reviews, ${evidenceIssues.length} issues`);

    const vg = makeVerifiedGap(gap, evidenceReviews, evidenceIssues, reviews, issues, product, reviewsAvailable);
    vg.id = `gap-${verifiedGaps.length + 1}`;
    verifiedGaps.push(vg);
  }

  return {
    verifiedGaps,
    removedCount: gaps.gaps.length - verifiedGaps.length,
    removalReasons,
  };
}

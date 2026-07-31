import type { Review, Issue } from "../types";
import type { PreprocessedData, ClusteredReview, IssueSummary } from "./types";

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "shall",
  "should", "can", "could", "may", "might", "must", "i", "you", "he",
  "she", "it", "we", "they", "me", "him", "her", "us", "them", "my",
  "your", "his", "its", "our", "their", "and", "but", "or", "if", "then",
  "so", "because", "as", "until", "while", "of", "at", "by", "for",
  "with", "about", "against", "between", "into", "through", "during",
  "before", "after", "above", "below", "to", "from", "up", "down",
  "in", "out", "on", "off", "over", "under", "again", "further",
  "once", "here", "there", "when", "where", "why", "how", "all", "any",
  "both", "each", "few", "more", "most", "other", "some", "such", "no",
  "nor", "not", "only", "own", "same", "than", "too", "very", "s", "t",
  "just", "don", "now", "app", "wordpress", "use", "using", "used",
  "like", "really", "also", "even", "still", "much", "lot", "bit",
  "get", "got", "go", "going", "would", "could", "one", "two", "make",
  "know", "think", "want", "need", "try", "tried", "trying", "way",
]);

function extractKeywords(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  return [...new Set(words)];
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  const intersection = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function clusterReviews(reviews: Review[]): ClusteredReview[] {
  const reviewedKeywords = reviews.map((r) => ({
    review: r,
    keywords: new Set(extractKeywords(r.content)),
  }));

  const used = new Set<number>();
  const clusters: ClusteredReview[] = [];

  for (let i = 0; i < reviewedKeywords.length; i++) {
    if (used.has(i)) continue;

    const cluster: Review[] = [reviewedKeywords[i].review];
    used.add(i);

    for (let j = i + 1; j < reviewedKeywords.length; j++) {
      if (used.has(j)) continue;
      const sim = jaccardSimilarity(reviewedKeywords[i].keywords, reviewedKeywords[j].keywords);
      if (sim > 0.3) {
        cluster.push(reviewedKeywords[j].review);
        used.add(j);
      }
    }

    if (cluster.length >= 2) {
      const allKeywords = cluster.flatMap((r) =>
        extractKeywords(r.content)
      );
      const keywordCounts = new Map<string, number>();
      for (const kw of allKeywords) {
        keywordCounts.set(kw, (keywordCounts.get(kw) || 0) + 1);
      }
      const topKeywords = [...keywordCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([k]) => k);

      clusters.push({
        id: `cluster-${clusters.length}`,
        representativeReview: cluster.sort((a, b) => a.score - b.score)[0],
        similarReviewIds: cluster.map((r) => r.id),
        clusterSize: cluster.length,
        avgScore: cluster.reduce((s, r) => s + r.score, 0) / cluster.length,
        totalThumbsUp: cluster.reduce((s, r) => s + r.thumbs_up, 0),
        keywords: topKeywords,
      });
    }
  }

  return clusters.sort((a, b) => b.clusterSize - a.clusterSize);
}

export function preprocessReviews(reviews: Review[]): PreprocessedData {
  const clusters = clusterReviews(reviews);
  const topLowRated = [...reviews]
    .filter((r) => r.score <= 2)
    .sort((a, b) => b.thumbs_up - a.thumbs_up)
    .slice(0, 20);
  const topThumbed = [...reviews]
    .sort((a, b) => b.thumbs_up - a.thumbs_up)
    .slice(0, 20);

  return {
    clusters,
    topLowRated,
    topThumbed,
    totalReviews: reviews.length,
    totalClusters: clusters.length,
  };
}

export function preprocessIssues(issues: Issue[]): IssueSummary {
  const byState = { open: 0, closed: 0 };
  const byLabel = new Map<string, number>();
  const byMilestone = new Map<string, number>();

  for (const issue of issues) {
    if (issue.state === "open") byState.open++;
    else byState.closed++;

    for (const label of issue.labels) {
      byLabel.set(label, (byLabel.get(label) || 0) + 1);
    }
    if (issue.milestone) {
      byMilestone.set(issue.milestone, (byMilestone.get(issue.milestone) || 0) + 1);
    }
  }

  const topLabels = [...byLabel.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([label, count]) => ({ label, count }));

  const topMilestones = [...byMilestone.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([milestone, count]) => ({ milestone, count }));

  const highCommentIssues = [...issues]
    .sort((a, b) => b.comments - a.comments)
    .slice(0, 30)
    .map((i) => ({
      number: i.number,
      title: i.title,
      state: i.state,
      labels: i.labels,
      milestone: i.milestone,
      comments: i.comments,
    }));

  const openIssueNumbers = issues
    .filter((i) => i.state === "open")
    .map((i) => i.number);

  return {
    total: issues.length,
    open: byState.open,
    closed: byState.closed,
    openIssueNumbers,
    topLabels,
    topMilestones,
    highCommentIssues,
  };
}

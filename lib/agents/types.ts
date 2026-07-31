import type { Review } from "../types";

export interface ClusteredReview {
  id: string;
  representativeReview: Review;
  similarReviewIds: string[];
  clusterSize: number;
  avgScore: number;
  totalThumbsUp: number;
  keywords: string[];
}

export interface PreprocessedData {
  clusters: ClusteredReview[];
  topLowRated: Review[];
  topThumbed: Review[];
  totalReviews: number;
  totalClusters: number;
}

export interface IssueSummary {
  total: number;
  open: number;
  closed: number;
  openIssueNumbers: number[];
  topLabels: { label: string; count: number }[];
  topMilestones: { milestone: string; count: number }[];
  highCommentIssues: {
    number: number;
    title: string;
    state: string;
    labels: string[];
    milestone: string | null;
    comments: number;
  }[];
}

export interface DetectedGap {
  topic: string;
  hiddenNeed: string;
  confidence: number;
  confidenceJustification: string;
  verdict: "IGNORED" | "UNDER-PRIORITIZED" | "MISUNDERSTOOD";
  verdictReason: string;
  supportingReviewIds: string[];
  supportingQuotes: string[];
  relatedIssueNumbers: number[];
  defenseExplanation: string;
  rankingReasoning: string;
}

export interface LatentNeedDetectorOutput {
  gaps: DetectedGap[];
  stats: {
    totalReviews: number;
    totalIssues: number;
    clustersFormed: number;
    avgRating: number;
  };
}

export interface VerifiedGap {
  id: string;
  topic: string;
  userNeed: string;
  explanation: string;
  confidence: number;
  confidenceJustification: string;
  verdict: "IGNORED" | "UNDER-PRIORITIZED" | "MISUNDERSTOOD";
  verdictReason: string;
  evidence: {
    reviews: { reviewId: string; content: string; score: number; thumbsUp: number; date: string }[];
    issues: { issueNumber: number; title: string; url: string; state: string; labels: string[] }[];
  };
  defenseExplanation: string;
  rankingReasoning: string;
  counterArgument: string;
  createdAt: string;
}

export interface EvidenceAgentOutput {
  verifiedGaps: VerifiedGap[];
  removedCount: number;
  removalReasons: string[];
}

export type AgentStatus = "pending" | "running" | "completed" | "failed";

export interface PipelineState {
  status: AgentStatus;
  currentAgent: string;
  agents: {
    preprocessor: AgentStatus;
    latentNeedDetector: AgentStatus;
    evidenceVerifier: AgentStatus;
  };
  results: {
    preprocessed?: PreprocessedData;
    latentNeeds?: LatentNeedDetectorOutput;
    evidence?: EvidenceAgentOutput;
  };
  errors: string[];
  startedAt: string;
  completedAt?: string;
}

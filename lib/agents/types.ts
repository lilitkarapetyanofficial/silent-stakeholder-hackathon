import type { Review, Issue } from "../types";

// ─── Preprocessed Data ───────────────────────────────────────────────
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

// ─── Agent Outputs ───────────────────────────────────────────────────
export interface ReviewAgentOutput {
  latentNeeds: {
    topic: string;
    needStatement: string;
    explanation: string;
    sentiment: "frustrated" | "confused" | "hoping" | "angry";
    frequency: "high" | "medium" | "low";
    supportingClusters: string[];
    sampleReviewIds: string[];
    sampleQuotes: string[];
  }[];
  reviewStats: {
    totalAnalyzed: number;
    clustersFormed: number;
    avgRating: number;
    topComplaintThemes: string[];
  };
}

export interface RoadmapAgentOutput {
  activeWork: {
    topic: string;
    issueCount: number;
    priority: "high" | "medium" | "low";
    sampleIssueNumbers: number[];
  }[];
  plannedFeatures: {
    topic: string;
    milestone: string | null;
    status: "planned" | "in-progress" | "completed";
    issueNumbers: number[];
  }[];
  roadmapGaps: string[];
  roadmapStats: {
    totalIssues: number;
    openIssues: number;
    closedIssues: number;
    milestonesCount: number;
    topLabels: string[];
  };
}

export interface GapAgentOutput {
  gaps: {
    topic: string;
    userNeed: string;
    whyHidden: string;
    confidence: number;
    verdict: "IGNORED" | "UNDER-PRIORITIZED" | "MISUNDERSTOOD";
    confidenceReasoning: string;
    supportingReviewIds: string[];
    supportingQuotes: string[];
    relatedIssueNumbers: number[];
  }[];
}

export interface EvidenceItem {
  type: "review" | "issue";
  id: string;
  content: string;
  url?: string;
  rating?: number;
  date?: string;
  state?: string;
}

export interface VerifiedGap {
  id: string;
  topic: string;
  userNeed: string;
  explanation: string;
  confidence: number;
  verdict: "IGNORED" | "UNDER-PRIORITIZED" | "MISUNDERSTOOD";
  confidenceExplanation: string;
  evidence: {
    reviews: { reviewId: string; content: string; score: number; thumbsUp: number; date: string }[];
    issues: { issueNumber: number; title: string; url: string; state: string; labels: string[] }[];
  };
  createdAt: string;
}

export interface EvidenceAgentOutput {
  verifiedGaps: VerifiedGap[];
  removedCount: number;
  removalReasons: string[];
}

export interface JudgeScore {
  category: string;
  score: number;
  maxScore: number;
  feedback: string;
}

export interface JudgeAgentOutput {
  totalScore: number;
  maxScore: number;
  overallFeedback: string;
  scores: JudgeScore[];
  improvements: string[];
  strengths: string[];
}

// ─── Pipeline State ──────────────────────────────────────────────────
export type AgentStatus = "pending" | "running" | "completed" | "failed";

export interface PipelineState {
  status: AgentStatus;
  currentAgent: string;
  agents: {
    preprocessor: AgentStatus;
    reviewAnalyst: AgentStatus;
    roadmapAnalyst: AgentStatus;
    gapDetector: AgentStatus;
    evidenceVerifier: AgentStatus;
    judge: AgentStatus;
  };
  results: {
    preprocessed?: PreprocessedData;
    reviewAnalysis?: ReviewAgentOutput;
    roadmapAnalysis?: RoadmapAgentOutput;
    gaps?: GapAgentOutput;
    evidence?: EvidenceAgentOutput;
    judge?: JudgeAgentOutput;
  };
  errors: string[];
  startedAt: string;
  completedAt?: string;
}

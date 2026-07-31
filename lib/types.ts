export interface Review {
  id: string;
  content: string;
  score: number;
  thumbs_up: number;
  at: string | null;
  app_version: string | null;
  reply_content: string | null;
}

export interface Issue {
  id: string;
  number: number;
  title: string;
  body: string;
  state: string;
  labels: string[];
  milestone: string | null;
  created_at: string;
  updated_at: string;
  comments: number;
  url: string;
}

export interface Milestone {
  id: string;
  title: string;
  state: string;
  open_issues: number;
  closed_issues: number;
}

export interface EvidenceReview {
  reviewId: string;
  content: string;
  score: number;
  thumbsUp: number;
  date: string;
}

export interface EvidenceIssue {
  issueNumber: number;
  title: string;
  url: string;
  state: string;
  labels: string[];
}

export interface Gap {
  id: string;
  topic: string;
  need: string;
  explanation: string;
  confidence: number;
  confidenceBreakdown: {
    volume: number;
    social: number;
    pain: number;
    coverage: number;
  };
  confidenceExplanation: string;
  verdict: "IGNORED" | "UNDER-PRIORITIZED" | "MISUNDERSTOOD";
  evidence: {
    reviews: EvidenceReview[];
    issues: EvidenceIssue[];
  };
  createdAt: string;
}

export interface AnalysisResult {
  gaps: Gap[];
  stats: {
    totalReviews: number;
    totalIssues: number;
    dateRange: string;
    analyzedAt: string;
    ignoredCount: number;
    underPrioritizedCount: number;
    misunderstoodCount: number;
  };
}

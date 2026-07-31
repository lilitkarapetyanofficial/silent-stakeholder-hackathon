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

export interface Gap {
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

import type { Issue } from "../types";
import type { RoadmapAgentOutput } from "./types";
import { callGeminiJson } from "./gemini-client";

export async function runRoadmapAnalyst(
  issues: Issue[],
  issueSummary: {
    total: number;
    open: number;
    closed: number;
    topLabels: { label: string; count: number }[];
    topMilestones: { milestone: string; count: number }[];
    highCommentIssues: Issue[];
  }
): Promise<RoadmapAgentOutput> {
  const highCommentSummary = issueSummary.highCommentIssues.slice(0, 20).map((i) =>
    `[#${i.number}] ${i.state} | ${i.labels.join(",") || "none"} | ${i.comments}💬 | ${i.milestone || "no milestone"}
${i.title}`
  ).join("\n");

  const labelSummary = issueSummary.topLabels.map((l) => `${l.label} (${l.count})`).join(", ");
  const milestoneSummary = issueSummary.topMilestones.map((m) => `${m.milestone} (${m.count} issues)`).join(", ");

  const prompt = `You are a product roadmap analyst for the WordPress for Android mobile app.

Your job: Understand what the development team is building and what they're NOT building.

GITHUB ROADMAP DATA:
Total issues: ${issueSummary.total} (${issueSummary.open} open, ${issueSummary.closed} closed)
Top labels: ${labelSummary}
Top milestones: ${milestoneSummary || "none"}

MOST-DISCUSSED ISSUES (sorted by comments):
${highCommentSummary}

Analyze this roadmap and return:
{
  "activeWork": [
    {
      "topic": "kebab-case-label",
      "issueCount": N,
      "priority": "high|medium|low",
      "sampleIssueNumbers": [123]
    }
  ],
  "plannedFeatures": [
    {
      "topic": "kebab-case-label",
      "milestone": "milestone name or null",
      "status": "planned|in-progress|completed",
      "issueNumbers": [123]
    }
  ],
  "roadmapGaps": [
    "Description of what's NOT in the roadmap but should be"
  ],
  "roadmapStats": {
    "totalIssues": ${issueSummary.total},
    "openIssues": ${issueSummary.open},
    "closedIssues": ${issueSummary.closed},
    "milestonesCount": ${issueSummary.topMilestones.length},
    "topLabels": ["label1", "label2"]
  }
}`;

  return callGeminiJson<RoadmapAgentOutput>(prompt, { temperature: 0.3 });
}

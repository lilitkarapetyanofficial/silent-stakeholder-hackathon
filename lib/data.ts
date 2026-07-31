import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import type { Review, Issue, Gap, AnalysisResult } from "./types";

const ROOT = process.cwd();
const DATA_DIR = join(ROOT, "data", "raw");
const OUTPUT_DIR = join(ROOT, "output");

const GITHUB_API_BASE = "https://api.github.com";

function getGitHubToken(): string | null {
  return process.env.GITHUB_TOKEN ?? null;
}

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "silent-stakeholder-hackathon",
  };
  const token = getGitHubToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchGitHubIssues(
  owner: string,
  repo: string,
  options?: { state?: string; perPage?: number; maxPages?: number }
): Promise<Issue[]> {
  const state = options?.state ?? "all";
  const perPage = options?.perPage ?? 100;
  const maxPages = options?.maxPages ?? 5;
  const allIssues: Issue[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues?state=${state}&per_page=${perPage}&page=${page}`;
    const response = await fetch(url, { headers: githubHeaders() });

    if (!response.ok) {
      if (response.status === 403 || response.status === 429) {
        const rateLimitReset = response.headers.get("x-ratelimit-reset");
        const resetMessage = rateLimitReset
          ? ` (resets at ${new Date(Number(rateLimitReset) * 1000).toISOString()})`
          : "";
        throw new Error(
          `GitHub API rate limit exceeded${resetMessage}. ` +
          `Unauthenticated limit: 60 requests/hour. ` +
          `Set GITHUB_TOKEN env var to increase to 5,000 requests/hour.`
        );
      }
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data: unknown[] = await response.json();
    const issues = data.filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null && !("pull_request" in item)
    );

    if (issues.length === 0) break;

    for (const raw of issues) {
      allIssues.push({
        id: `gh-${raw.id}`,
        number: raw.number as number,
        title: (raw.title as string) ?? "",
        body: ((raw.body as string) ?? "").slice(0, 2000),
        state: raw.state as string,
        labels: Array.isArray(raw.labels)
          ? (raw.labels as Array<{ name: string }>).map((l) => l.name)
          : [],
        milestone: raw.milestone && typeof raw.milestone === "object"
          ? (raw.milestone as { title: string }).title
          : null,
        created_at: (raw.created_at as string) ?? "",
        updated_at: (raw.updated_at as string) ?? "",
        comments: (raw.comments as number) ?? 0,
        url: (raw.html_url as string) ?? "",
      });
    }

    if (issues.length < perPage) break;
  }

  return allIssues;
}

export function getGitHubRateLimitStatus(): { authenticated: boolean; note: string } {
  const token = getGitHubToken();
  return {
    authenticated: !!token,
    note: token
      ? "Authenticated: 5,000 requests/hour"
      : "Unauthenticated: 60 requests/hour. Set GITHUB_TOKEN for higher limits.",
  };
}

export function loadReviews(): Review[] {
  const raw = readFileSync(join(DATA_DIR, "reviews.json"), "utf-8");
  return JSON.parse(raw);
}

export function loadIssues(): { issues: Issue[]; milestones: { id: string; title: string; state: string }[] } {
  const raw = readFileSync(join(DATA_DIR, "issues.json"), "utf-8");
  const data = JSON.parse(raw);
  return { issues: data.issues || [], milestones: data.milestones || [] };
}

export function loadIssuesFromPath(issuesPath: string): Issue[] {
  const raw = readFileSync(issuesPath, "utf-8");
  const data = JSON.parse(raw);
  return data.issues || [];
}

export function loadReviewsFromPath(reviewsPath: string): Review[] {
  const raw = readFileSync(reviewsPath, "utf-8");
  return JSON.parse(raw);
}

export function loadCachedAnalysis(): AnalysisResult | null {
  const path = join(OUTPUT_DIR, "analysis.json");
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw);
}

export function loadMilestoneStats(): { milestone: string; open: number; closed: number; total: number }[] {
  const { issues } = loadIssues();
  const milestoneMap = new Map<string, { open: number; closed: number }>();

  for (const issue of issues) {
    const ms = issue.milestone;
    if (!ms) continue;
    const entry = milestoneMap.get(ms) ?? { open: 0, closed: 0 };
    if (issue.state === "open") entry.open++;
    else entry.closed++;
    milestoneMap.set(ms, entry);
  }

  const milestones = Array.from(milestoneMap.entries())
    .map(([milestone, { open, closed }]) => ({
      milestone,
      open,
      closed,
      total: open + closed,
    }))
    .sort((a, b) => {
      const aNum = parseFloat(a.milestone);
      const bNum = parseFloat(b.milestone);
      if (!isNaN(aNum) && !isNaN(bNum)) return bNum - aNum;
      if (a.milestone === "Future") return 1;
      if (b.milestone === "Future") return -1;
      return b.milestone.localeCompare(a.milestone);
    });

  return milestones;
}

export function getDateRange(reviews: Review[]): string {
  const dates = reviews.filter((r) => r.at).map((r) => r.at!).sort();
  return dates.length > 0
    ? `${dates[0].slice(0, 7)} to ${dates[dates.length - 1].slice(0, 7)}`
    : "Unknown";
}

export function saveAnalysis(gaps: Gap[], rejectedGaps: string[] = []): AnalysisResult {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  const reviews = loadReviews();
  const { issues } = loadIssues();

  const result: AnalysisResult = {
    gaps,
    rejectedGaps,
    stats: {
      totalReviews: reviews.length,
      totalIssues: issues.length,
      dateRange: getDateRange(reviews),
      analyzedAt: new Date().toISOString(),
      ignoredCount: gaps.filter((g) => g.verdict === "IGNORED").length,
      underPrioritizedCount: gaps.filter((g) => g.verdict === "UNDER-PRIORITIZED").length,
      misunderstoodCount: gaps.filter((g) => g.verdict === "MISUNDERSTOOD").length,
    },
  };

  writeFileSync(join(OUTPUT_DIR, "analysis.json"), JSON.stringify(result, null, 2));
  return result;
}

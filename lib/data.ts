import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import type { Review, Issue, Gap, AnalysisResult } from "./types";

const ROOT = process.cwd();
const DATA_DIR = join(ROOT, "data", "raw");
const OUTPUT_DIR = join(ROOT, "output");

export function loadReviews(): Review[] {
  const raw = readFileSync(join(DATA_DIR, "reviews.json"), "utf-8");
  return JSON.parse(raw);
}

export function loadIssues(): { issues: Issue[]; milestones: { id: string; title: string; state: string }[] } {
  const raw = readFileSync(join(DATA_DIR, "issues.json"), "utf-8");
  const data = JSON.parse(raw);
  return { issues: data.issues || [], milestones: data.milestones || [] };
}

export function loadCachedAnalysis(): AnalysisResult | null {
  const path = join(OUTPUT_DIR, "analysis.json");
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw);
}

export function getDateRange(reviews: Review[]): string {
  const dates = reviews.filter((r) => r.at).map((r) => r.at!).sort();
  return dates.length > 0
    ? `${dates[0].slice(0, 7)} to ${dates[dates.length - 1].slice(0, 7)}`
    : "Unknown";
}

export function saveAnalysis(gaps: Gap[]): AnalysisResult {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  const reviews = loadReviews();
  const { issues } = loadIssues();

  const result: AnalysisResult = {
    gaps,
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

import { NextResponse } from "next/server";
import { loadCachedAnalysis, loadReviewsFromPath, loadIssuesFromPath, getDateRange } from "@/lib/data";
import { SOURCE_REGISTRY } from "@/lib/agents/sources";

export async function GET() {
  try {
    const analysis = loadCachedAnalysis();

    let totalReviews = 0;
    let totalIssues = 0;
    const allDates: string[] = [];

    for (const source of SOURCE_REGISTRY) {
      try {
        if (source.reviewsPath) {
          const reviews = loadReviewsFromPath(source.reviewsPath);
          totalReviews += reviews.length;
          for (const r of reviews) {
            if (r.at) allDates.push(r.at);
          }
        }
        const issues = loadIssuesFromPath(source.issuesPath);
        totalIssues += issues.length;
      } catch {
        continue;
      }
    }

    allDates.sort();
    const dateRange = allDates.length > 0
      ? `${allDates[0].slice(0, 7)} to ${allDates[allDates.length - 1].slice(0, 7)}`
      : "Unknown";

    return NextResponse.json({
      gaps: analysis?.gaps ?? [],
      rejectedGaps: analysis?.rejectedGaps ?? [],
      stats: {
        totalReviews,
        totalIssues,
        dateRange,
        analyzedAt: analysis?.stats.analyzedAt ?? null,
        ignoredCount: analysis?.stats.ignoredCount ?? 0,
        underPrioritizedCount: analysis?.stats.underPrioritizedCount ?? 0,
        misunderstoodCount: analysis?.stats.misunderstoodCount ?? 0,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

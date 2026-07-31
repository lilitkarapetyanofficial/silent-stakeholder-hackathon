import { NextResponse } from "next/server";
import { loadCachedAnalysis, loadReviews, loadIssues, getDateRange } from "@/lib/data";

export async function GET() {
  try {
    const analysis = loadCachedAnalysis();
    const reviews = loadReviews();
    const { issues } = loadIssues();

    return NextResponse.json({
      gaps: analysis?.gaps ?? [],
      stats: {
        totalReviews: reviews.length,
        totalIssues: issues.length,
        dateRange: getDateRange(reviews),
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

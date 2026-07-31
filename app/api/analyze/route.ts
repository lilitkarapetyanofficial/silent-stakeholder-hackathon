import { NextResponse } from "next/server";
import { loadReviews, loadIssues, saveAnalysis } from "@/lib/data";
import { runPipeline } from "@/lib/agents/orchestrator";

export const maxDuration = 120;

export async function POST() {
  try {
    const reviews = loadReviews();
    const { issues } = loadIssues();

    const { state, gaps } = await runPipeline(reviews, issues);

    if (!gaps?.verifiedGaps?.length) {
      return NextResponse.json({
        error: "Pipeline completed but no verified gaps found",
        pipeline: state,
      }, { status: 500 });
    }

    const result = saveAnalysis(gaps.verifiedGaps);

    return NextResponse.json({
      ...result,
      pipeline: {
        agents: state.agents,
        errors: state.errors,
        startedAt: state.startedAt,
        completedAt: state.completedAt,
        judge: state.results.judge,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { saveAnalysis } from "@/lib/data";
import { runPipeline } from "@/lib/agents/orchestrator";

export const maxDuration = 300;

export async function POST() {
  try {
    const { state, gaps } = await runPipeline();

    if (!gaps?.verifiedGaps?.length) {
      return NextResponse.json({
        error: "Pipeline completed but no verified gaps found",
        pipelineErrors: state.errors,
        pipeline: state,
        removalReasons: gaps?.removalReasons ?? [],
      }, { status: 500 });
    }

    const result = saveAnalysis(gaps.verifiedGaps, gaps.removalReasons);

    return NextResponse.json({
      ...result,
      pipeline: {
        agents: state.agents,
        errors: state.errors,
        startedAt: state.startedAt,
        completedAt: state.completedAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

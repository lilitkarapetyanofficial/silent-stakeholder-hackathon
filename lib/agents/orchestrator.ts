import type { Review, Issue } from "../types";
import type { PipelineState, PreprocessedData } from "./types";
import { preprocessReviews, preprocessIssues } from "./preprocessor";
import { runReviewAnalyst } from "./review-analyst";
import { runRoadmapAnalyst } from "./roadmap-analyst";
import { runGapDetector } from "./gap-detector";
import { runEvidenceVerifier } from "./evidence-verifier";
import { runJudge } from "./judge";

export type ProgressCallback = (state: PipelineState) => void;

function createState(): PipelineState {
  return {
    status: "running",
    currentAgent: "preprocessor",
    agents: {
      preprocessor: "pending",
      reviewAnalyst: "pending",
      roadmapAnalyst: "pending",
      gapDetector: "pending",
      evidenceVerifier: "pending",
      judge: "pending",
    },
    results: {},
    errors: [],
    startedAt: new Date().toISOString(),
  };
}

export async function runPipeline(
  reviews: Review[],
  issues: Issue[],
  onProgress?: ProgressCallback
): Promise<{ state: PipelineState; gaps: PipelineState["results"]["evidence"] }> {
  const state = createState();

  const notify = () => onProgress?.({ ...state });

  try {
    // ── Step 1: Local Preprocessing ──────────────────────────────────
    state.agents.preprocessor = "running";
    state.currentAgent = "preprocessor";
    notify();

    const preprocessed = preprocessReviews(reviews);
    const issueData = preprocessIssues(issues);
    state.results.preprocessed = preprocessed;
    state.agents.preprocessor = "completed";
    notify();

    // ── Step 2: Review Analyst + Roadmap Analyst (parallel) ──────────
    state.agents.reviewAnalyst = "running";
    state.agents.roadmapAnalyst = "running";
    state.currentAgent = "review+roadmap";
    notify();

    const [reviewAnalysis, roadmapAnalysis] = await Promise.all([
      runReviewAnalyst(preprocessed).catch((e) => {
        state.errors.push(`Review Analyst: ${e.message}`);
        return null;
      }),
      runRoadmapAnalyst(issues, issueData).catch((e) => {
        state.errors.push(`Roadmap Analyst: ${e.message}`);
        return null;
      }),
    ]);

    if (reviewAnalysis) {
      state.results.reviewAnalysis = reviewAnalysis;
      state.agents.reviewAnalyst = "completed";
    } else {
      state.agents.reviewAnalyst = "failed";
    }

    if (roadmapAnalysis) {
      state.results.roadmapAnalysis = roadmapAnalysis;
      state.agents.roadmapAnalyst = "completed";
    } else {
      state.agents.roadmapAnalyst = "failed";
    }
    notify();

    if (!reviewAnalysis || !roadmapAnalysis) {
      state.status = "failed";
      state.errors.push("Cannot proceed without both Review and Roadmap analysis");
      state.completedAt = new Date().toISOString();
      return { state, gaps: null };
    }

    // ── Step 3: Gap Detection ────────────────────────────────────────
    state.agents.gapDetector = "running";
    state.currentAgent = "gapDetector";
    notify();

    const gaps = await runGapDetector(reviewAnalysis, roadmapAnalysis).catch((e) => {
      state.errors.push(`Gap Detector: ${e.message}`);
      return null;
    });

    if (gaps) {
      state.results.gaps = gaps;
      state.agents.gapDetector = "completed";
    } else {
      state.agents.gapDetector = "failed";
      state.status = "failed";
      state.completedAt = new Date().toISOString();
      return { state, gaps: null };
    }
    notify();

    // ── Step 4: Evidence Verification ────────────────────────────────
    state.agents.evidenceVerifier = "running";
    state.currentAgent = "evidenceVerifier";
    notify();

    const evidence = await runEvidenceVerifier(gaps, reviews, issues).catch((e) => {
      state.errors.push(`Evidence Verifier: ${e.message}`);
      return null;
    });

    if (evidence) {
      state.results.evidence = evidence;
      state.agents.evidenceVerifier = "completed";
    } else {
      state.agents.evidenceVerifier = "failed";
    }
    notify();

    // ── Step 5: Judge Evaluation ─────────────────────────────────────
    state.agents.judge = "running";
    state.currentAgent = "judge";
    notify();

    const verifiedGaps = evidence?.verifiedGaps ?? [];
    const judge = await runJudge(verifiedGaps, reviews.length, issues.length).catch((e) => {
      state.errors.push(`Judge: ${e.message}`);
      return null;
    });

    if (judge) {
      state.results.judge = judge;
      state.agents.judge = "completed";
    } else {
      state.agents.judge = "failed";
    }
    notify();

    state.status = "completed";
    state.completedAt = new Date().toISOString();
    notify();

    return { state, gaps: evidence };
  } catch (error) {
    state.status = "failed";
    state.errors.push(error instanceof Error ? error.message : "Unknown error");
    state.completedAt = new Date().toISOString();
    notify();
    return { state, gaps: null };
  }
}

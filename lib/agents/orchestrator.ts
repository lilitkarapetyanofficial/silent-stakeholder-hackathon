import type { Review, Issue } from "../types";
import type { PipelineState } from "./types";
import { preprocessReviews, preprocessIssues } from "./preprocessor";
import { runLatentNeedDetector } from "./latent-need-detector";
import { runEvidenceVerifier } from "./evidence-verifier";

export async function runPipeline(
  reviews: Review[],
  issues: Issue[]
): Promise<{ state: PipelineState; gaps: PipelineState["results"]["evidence"] }> {
  const state: PipelineState = {
    status: "running",
    currentAgent: "preprocessor",
    agents: {
      preprocessor: "pending",
      latentNeedDetector: "pending",
      evidenceVerifier: "pending",
    },
    results: {},
    errors: [],
    startedAt: new Date().toISOString(),
  };

  try {
    state.agents.preprocessor = "running";
    state.currentAgent = "preprocessor";

    const preprocessed = preprocessReviews(reviews);
    const issueSummary = preprocessIssues(issues);
    state.results.preprocessed = preprocessed;
    state.agents.preprocessor = "completed";

    state.agents.latentNeedDetector = "running";
    state.currentAgent = "latentNeedDetector";

    const latentNeeds = await runLatentNeedDetector(preprocessed, issues, issueSummary).catch((e) => {
      state.errors.push(`Latent Need Detector: ${e.message}`);
      return null;
    });

    if (latentNeeds) {
      state.results.latentNeeds = latentNeeds;
      state.agents.latentNeedDetector = "completed";
    } else {
      state.agents.latentNeedDetector = "failed";
      state.status = "failed";
      state.completedAt = new Date().toISOString();
      return { state, gaps: undefined };
    }

    state.agents.evidenceVerifier = "running";
    state.currentAgent = "evidenceVerifier";

    const evidence = await runEvidenceVerifier(latentNeeds, reviews, issues).catch((e) => {
      state.errors.push(`Evidence Verifier: ${e.message}`);
      return null;
    });

    if (evidence) {
      state.results.evidence = evidence;
      state.agents.evidenceVerifier = "completed";
    } else {
      state.agents.evidenceVerifier = "failed";
    }

    state.status = "completed";
    state.completedAt = new Date().toISOString();

    return { state, gaps: evidence ?? undefined };
  } catch (error) {
    state.status = "failed";
    state.errors.push(error instanceof Error ? error.message : "Unknown error");
    state.completedAt = new Date().toISOString();
    return { state, gaps: undefined };
  }
}

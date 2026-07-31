import type { Review, Issue } from "../types";
import type { EvidenceAgentOutput, PipelineState, VerifiedGap } from "./types";
import { preprocessReviews, preprocessIssues } from "./preprocessor";
import { runLatentNeedDetector } from "./latent-need-detector";
import { runEvidenceVerifier } from "./evidence-verifier";
import { runCritic } from "./critic";
import { SOURCE_REGISTRY, type SourceEntry } from "./sources";
import { loadReviewsFromPath, loadIssuesFromPath } from "../data";
import { findCrossProjectPatterns, boostCrossProjectConfidence, type CrossProjectPattern } from "./pattern-matcher";

async function runProductPipeline(
  source: SourceEntry,
  reviews: Review[],
  issues: Issue[],
  state: PipelineState
): Promise<EvidenceAgentOutput | null> {
  const product = source.product;

  state.agents.preprocessor = "running";
  state.currentAgent = `preprocessor:${source.name}`;

  const preprocessed = reviews.length > 0
    ? preprocessReviews(reviews)
    : { clusters: [], topLowRated: [], topThumbed: [], totalReviews: 0, totalClusters: 0 };
  const issueSummary = preprocessIssues(issues);
  state.agents.preprocessor = "completed";

  state.agents.latentNeedDetector = "running";
  state.currentAgent = `latentNeedDetector:${source.name}`;

  const latentNeeds = await runLatentNeedDetector(preprocessed, issues, issueSummary, product, source.reviewsAvailable).catch((e) => {
    state.errors.push(`Latent Need Detector (${source.name}): ${e.message}`);
    return null;
  });

  if (!latentNeeds) {
    state.agents.latentNeedDetector = "failed";
    return null;
  }
  state.agents.latentNeedDetector = "completed";

  state.agents.evidenceVerifier = "running";
  state.currentAgent = `evidenceVerifier:${source.name}`;

  const evidence = await runEvidenceVerifier(latentNeeds, reviews, issues, product, source.reviewsAvailable).catch((e) => {
    state.errors.push(`Evidence Verifier (${source.name}): ${e.message}`);
    return null;
  });

  if (!evidence) {
    state.agents.evidenceVerifier = "failed";
    return null;
  }
  state.agents.evidenceVerifier = "completed";

  if (evidence.verifiedGaps.length > 0) {
    state.agents.critic = "running";
    state.currentAgent = `critic:${source.name}`;

    const critiqued = await runCritic(evidence.verifiedGaps, reviews, issues).catch((e) => {
      state.errors.push(`Critic (${source.name}): ${e.message}`);
      return null;
    });

    if (critiqued) {
      evidence.verifiedGaps = critiqued;
      state.agents.critic = "completed";
    } else {
      state.agents.critic = "failed";
    }
  } else {
    state.agents.critic = "completed";
  }

  return evidence;
}

export async function runPipeline(): Promise<{
  state: PipelineState;
  gaps: EvidenceAgentOutput | undefined;
  patterns: CrossProjectPattern[];
}> {
  const state: PipelineState = {
    status: "running",
    currentAgent: "preprocessor",
    agents: {
      preprocessor: "pending",
      latentNeedDetector: "pending",
      evidenceVerifier: "pending",
      critic: "pending",
    },
    results: {},
    errors: [],
    startedAt: new Date().toISOString(),
  };

  try {
    const allVerifiedGaps: VerifiedGap[] = [];
    const allRemovalReasons: string[] = [];
    let totalRemoved = 0;

    for (const source of SOURCE_REGISTRY) {
      try {
        const reviews = source.reviewsPath ? loadReviewsFromPath(source.reviewsPath) : [];
        const issues = loadIssuesFromPath(source.issuesPath);

        if (reviews.length === 0 && issues.length === 0) {
          state.errors.push(`Skipping ${source.name}: no reviews or issues available`);
          continue;
        }

        const evidence = await runProductPipeline(source, reviews, issues, state);

        if (evidence) {
          allVerifiedGaps.push(...evidence.verifiedGaps);
          allRemovalReasons.push(...evidence.removalReasons);
          totalRemoved += evidence.removedCount;
        }
      } catch (e) {
        state.errors.push(`Pipeline failed for ${source.name}: ${e instanceof Error ? e.message : "Unknown error"}`);
      }
    }

    const mergedEvidence: EvidenceAgentOutput = {
      verifiedGaps: allVerifiedGaps,
      removedCount: totalRemoved,
      removalReasons: allRemovalReasons,
    };

    state.status = "completed";
    state.completedAt = new Date().toISOString();

    const patterns = findCrossProjectPatterns(allVerifiedGaps);
    const boostedGaps = boostCrossProjectConfidence(allVerifiedGaps, patterns);

    mergedEvidence.verifiedGaps = boostedGaps;
    state.results.evidence = mergedEvidence;

    return { state, gaps: boostedGaps.length > 0 ? mergedEvidence : undefined, patterns };
  } catch (error) {
    state.status = "failed";
    state.errors.push(error instanceof Error ? error.message : "Unknown error");
    state.completedAt = new Date().toISOString();
    return { state, gaps: undefined, patterns: [] };
  }
}

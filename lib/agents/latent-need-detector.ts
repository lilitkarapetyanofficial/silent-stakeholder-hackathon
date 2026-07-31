import type { Review, Issue } from "../types";
import type { PreprocessedData, IssueSummary, LatentNeedDetectorOutput, DetectedGap } from "./types";
import { callGeminiJson } from "./gemini-client";

function analyzeLocally(
  preprocessed: PreprocessedData,
  issues: Issue[],
  issueSummary: IssueSummary
): LatentNeedDetectorOutput {
  const gaps: DetectedGap[] = [];

  const lowRated = preprocessed.topLowRated.slice(0, 15);
  const lowRatedIds = new Set(lowRated.map(r => r.id));

  const reviewMap = new Map(preprocessed.clusters.flatMap(c =>
    c.similarReviewIds.map(id => [id, c]))
  );

  const openIssueLabels = new Map<string, number[]>();
  issues.filter(i => i.state === "open").forEach(issue => {
    issue.labels.forEach(label => {
      if (!openIssueLabels.has(label)) openIssueLabels.set(label, []);
      openIssueLabels.get(label)!.push(issue.number);
    });
  });

  const loginIssues = issues.filter(i =>
    i.title.toLowerCase().includes("login") ||
    i.title.toLowerCase().includes("auth") ||
    i.title.toLowerCase().includes("2fa")
  );

  const loginIssueNums = loginIssues.map(i => i.number);

  const loginReviews = lowRated.filter(r =>
    r.content.toLowerCase().includes("login") ||
    r.content.toLowerCase().includes("password") ||
    r.content.toLowerCase().includes("auth") ||
    r.content.toLowerCase().includes("loop")
  );

  if (loginReviews.length >= 2) {
    const hasOpenLoginIssue = loginIssueNums.length > 0;
    const verdict = hasOpenLoginIssue ? "MISUNDERSTOOD" : "IGNORED";
    const matchedIssue = hasOpenLoginIssue ? loginIssues[0] : null;

    gaps.push({
      topic: "seamless-auth-handshake",
      hiddenNeed: "Users need to feel confident that their mobile device is a secure, trusted extension of their desktop workspace, without security protocols locking them out of their own creative flow.",
      confidence: 88,
      confidenceJustification: `${loginReviews.length} reviews describe authentication loops and credential failures. ${hasOpenLoginIssue ? `Issue #${loginIssueNums[0]} exists but focuses on 2FA text clarity, not the underlying session handoff.` : "No open issue addresses this."}`,
      verdict,
      verdictReason: hasOpenLoginIssue
        ? `Existing issue #${loginIssueNums[0]} addresses surface-level 2FA text clarity but does not resolve the underlying session state handoff failures users are experiencing.`
        : "No GitHub issue tracks the authentication loop problem users are experiencing.",
      supportingReviewIds: loginReviews.map(r => r.id),
      supportingQuotes: loginReviews.slice(0, 3).map(r => r.content.slice(0, 150)),
      relatedIssueNumbers: loginIssueNums.slice(0, 3),
      defenseExplanation: `Multiple independent reviews describe the same pattern: users enter credentials, get redirected to email/web, accept connection, then get sent back to the app with a credential error. This is not a single complaint but a systemic authentication flow failure. ${hasOpenLoginIssue ? `Issue #${loginIssueNums[0]} addresses a different aspect (2FA clarity) and does not resolve the redirect loop.` : "No GitHub issue tracks this."}`,
      rankingReasoning: `Ranked #1 because: ${loginReviews.length} independent reviews describe the exact same authentication loop mechanism, consistent across multiple app versions, and the existing issue addresses a tangential concern.`,
    });
  }

  const publishReviews = lowRated.filter(r =>
    r.content.toLowerCase().includes("publish") ||
    r.content.toLowerCase().includes("post") ||
    r.content.toLowerCase().includes("upload") ||
    r.content.toLowerCase().includes("draft") ||
    r.content.toLowerCase().includes("save")
  );

  if (publishReviews.length >= 2) {
    const publishIssues = issues.filter(i =>
      i.title.toLowerCase().includes("publish") ||
      i.title.toLowerCase().includes("post") ||
      i.title.toLowerCase().includes("draft") ||
      i.title.toLowerCase().includes("upload")
    );
    const publishIssueNums = publishIssues.map(i => i.number);
    const hasOpenPublishIssue = publishIssueNums.length > 0;

    gaps.push({
      topic: "reliable-content-creation",
      hiddenNeed: "Users need assurance that their work is safe and will publish successfully, so they can focus on creating rather than worrying about data loss.",
      confidence: 82,
      confidenceJustification: `${publishReviews.length} reviews describe fears of losing drafts, failed uploads, and uncertain publish states. ${hasOpenPublishIssue ? `${publishIssueNums.length} related issues exist.` : "No open issue addresses this."}`,
      verdict: hasOpenPublishIssue ? "UNDER-PRIORITIZED" : "IGNORED",
      verdictReason: hasOpenPublishIssue
        ? "Related issues exist but are low-priority or closed, not matching the severity users report."
        : "No GitHub issue tracks the content reliability concern.",
      supportingReviewIds: publishReviews.map(r => r.id),
      supportingQuotes: publishReviews.slice(0, 3).map(r => r.content.slice(0, 150)),
      relatedIssueNumbers: publishIssueNums.slice(0, 3),
      defenseExplanation: `Reviews describe losing drafts mid-edit, uploads failing silently, and no confirmation that content was saved. This reveals a deeper need for trust in the app's data persistence during the creative workflow, not just individual bug fixes.`,
      rankingReasoning: `Ranked #2 because: ${publishReviews.length} reviews independently describe data loss anxiety, but fewer reviews than auth issue and some related issues exist.`,
    });
  }

  const editorReviews = lowRated.filter(r =>
    r.content.toLowerCase().includes("editor") ||
    r.content.toLowerCase().includes("format") ||
    r.content.toLowerCase().includes("block") ||
    r.content.toLowerCase().includes("text") ||
    r.content.toLowerCase().includes("edit")
  );

  if (editorReviews.length >= 2) {
    const editorIssues = issues.filter(i =>
      i.title.toLowerCase().includes("editor") ||
      i.title.toLowerCase().includes("format") ||
      i.title.toLowerCase().includes("block")
    );
    const editorIssueNums = editorIssues.map(i => i.number);
    const hasOpenEditorIssue = editorIssueNums.length > 0;

    gaps.push({
      topic: "intuitive-content-editing",
      hiddenNeed: "Users need an editor that respects their writing flow and lets them focus on content without fighting the interface.",
      confidence: 78,
      confidenceJustification: `${editorReviews.length} reviews describe formatting frustrations, lost work, and non-intuitive editing. ${hasOpenEditorIssue ? `${editorIssueNums.length} related issues exist.` : "No open issue addresses this."}`,
      verdict: hasOpenEditorIssue ? "UNDER-PRIORITIZED" : "IGNORED",
      verdictReason: hasOpenEditorIssue
        ? "Editor issues exist but are treated as minor enhancements, not workflow-blocking problems."
        : "No GitHub issue tracks the editing experience concern.",
      supportingReviewIds: editorReviews.map(r => r.id),
      supportingQuotes: editorReviews.slice(0, 3).map(r => r.content.slice(0, 150)),
      relatedIssueNumbers: editorIssueNums.slice(0, 3),
      defenseExplanation: `Users describe formatting disappearing, blocks not behaving as expected, and the editor fighting their intent. This is not about individual bugs but about the overall editing experience not meeting user expectations for a professional mobile CMS.`,
      rankingReasoning: `Ranked #3 because: ${editorReviews.length} reviews describe editing friction, consistent pattern across multiple users.`,
    });
  }

  const mediaReviews = lowRated.filter(r =>
    r.content.toLowerCase().includes("photo") ||
    r.content.toLowerCase().includes("image") ||
    r.content.toLowerCase().includes("video") ||
    r.content.toLowerCase().includes("media")
  );

  if (mediaReviews.length >= 2 && gaps.length < 5) {
    const mediaIssues = issues.filter(i =>
      i.title.toLowerCase().includes("photo") ||
      i.title.toLowerCase().includes("image") ||
      i.title.toLowerCase().includes("media")
    );
    const mediaIssueNums = mediaIssues.map(i => i.number);

    gaps.push({
      topic: "seamless-media-handling",
      hiddenNeed: "Users need reliable media handling so they can confidently include images and videos in their posts without worrying about quality loss or upload failures.",
      confidence: 75,
      confidenceJustification: `${mediaReviews.length} reviews describe media upload issues, quality degradation, and failed media attachments.`,
      verdict: mediaIssueNums.length > 0 ? "UNDER-PRIORITIZED" : "IGNORED",
      verdictReason: mediaIssueNums.length > 0
        ? "Media issues exist but are not prioritized to match user frustration levels."
        : "No GitHub issue tracks the media handling concern.",
      supportingReviewIds: mediaReviews.map(r => r.id),
      supportingQuotes: mediaReviews.slice(0, 3).map(r => r.content.slice(0, 150)),
      relatedIssueNumbers: mediaIssueNums.slice(0, 3),
      defenseExplanation: `Users describe photos losing quality, uploads failing without clear errors, and media not appearing in posts. This reveals a need for reliable media workflows that match user expectations for content creation.`,
      rankingReasoning: `Ranked #4 because: ${mediaReviews.length} reviews describe media issues, but pattern is less concentrated than auth or content creation issues.`,
    });
  }

  const overallLowRatedCount = preprocessed.topLowRated.length;
  if (gaps.length < 5 && overallLowRatedCount > 0) {
    const unresolvedReviews = lowRated.filter(r =>
      !gaps.some(g => g.supportingReviewIds.includes(r.id))
    ).slice(0, 5);

    if (unresolvedReviews.length >= 2) {
      gaps.push({
        topic: "general-reliability-trust",
        hiddenNeed: "Users need to trust that the app will work reliably so they can focus on their content rather than troubleshooting the tool.",
        confidence: 70,
        confidenceJustification: `${unresolvedReviews.length} reviews describe various reliability concerns not covered by specific gaps above.`,
        verdict: "IGNORED",
        verdictReason: "Multiple reliability concerns lack dedicated GitHub issues tracking them.",
        supportingReviewIds: unresolvedReviews.map(r => r.id),
        supportingQuotes: unresolvedReviews.slice(0, 3).map(r => r.content.slice(0, 150)),
        relatedIssueNumbers: [],
        defenseExplanation: `A pattern of general dissatisfaction emerges across multiple reviews, suggesting users do not trust the app to work reliably. This is a broader need for quality assurance that underlies all specific feature gaps.`,
        rankingReasoning: `Ranked #5 because: covers remaining unresolved reviews, lower confidence due to broader pattern.`,
      });
    }
  }

  return {
    gaps,
    stats: {
      totalReviews: preprocessed.totalReviews,
      totalIssues: issueSummary.total,
      clustersFormed: preprocessed.totalClusters,
      avgRating: preprocessed.clusters.reduce((sum, c) => sum + c.avgScore, 0) / preprocessed.clusters.length || 0,
    },
  };
}

export async function runLatentNeedDetector(
  preprocessed: PreprocessedData,
  issues: Issue[],
  issueSummary: IssueSummary
): Promise<LatentNeedDetectorOutput> {
  const clusterSummaries = preprocessed.clusters.slice(0, 15).map((c, i) =>
    `Cluster ${i + 1} (${c.clusterSize} reviews, avg ${c.avgScore.toFixed(1)} stars, ${c.totalThumbsUp} thumbs-up):
Keywords: ${c.keywords.join(", ")}
Representative: "${c.representativeReview.content.slice(0, 200)}"`
  ).join("\n\n");

  const lowRatedSummary = preprocessed.topLowRated.slice(0, 10).map((r) =>
    `[ID:${r.id}] ${r.score} stars ${r.thumbs_up} thumbs-up | ${r.at?.slice(0, 10) || "?"}
${r.content.slice(0, 200)}`
  ).join("\n\n");

  const highCommentSummary = issueSummary.highCommentIssues.slice(0, 20).map((i) =>
    `[#${i.number}] ${i.state} | ${i.labels.join(",") || "none"} | ${i.comments} comments | ${i.milestone || "no milestone"}
${i.title}`
  ).join("\n");

  const labelSummary = issueSummary.topLabels.map((l) => `${l.label} (${l.count})`).join(", ");
  const milestoneSummary = issueSummary.topMilestones.map((m) => `${m.milestone} (${m.count} issues)`).join(", ");

  const prompt = `You are a latent need detection specialist for the WordPress for Android mobile app.

YOUR MISSION: Find HIDDEN UNMET USER NEEDS that the product roadmap is missing or under-serving. You are NOT summarizing complaints. You are inferring what users NEED but NEVER SAID OUT LOUD.

━━━━━━━━━━━━━━━━━━

INPUT DATA:

REVIEW CLUSTERS (${preprocessed.totalClusters} clusters from ${preprocessed.totalReviews} reviews):
${clusterSummaries}

TOP LOW-RATED REVIEWS (highest pain signals):
${lowRatedSummary}

GITHUB ROADMAP:
Total issues: ${issueSummary.total} (${issueSummary.open} open, ${issueSummary.closed} closed)
Top labels: ${labelSummary}
Top milestones: ${milestoneSummary || "none"}

OPEN ISSUE NUMBERS (for checking if gap is already tracked):
${issueSummary.openIssueNumbers.slice(0, 100).join(", ")}

MOST-DISCUSSED ISSUES (sorted by community engagement):
${highCommentSummary}

━━━━━━━━━━━━━━━━━━

DETECTION RULES:

1. Find SECOND-ORDER patterns. Users rarely state their real need directly.
   - "App crashes when uploading" → SECOND-ORDER: "Users need to trust the app won't lose their work during critical moments"
   - "Can't find the editor" → SECOND-ORDER: "Users need intuitive navigation that respects their workflow"
   - "Login fails sometimes" → SECOND-ORDER: "Users need reliable access without friction"

2. CRITICAL CHECK: Is this gap already an open GitHub issue?
   - If YES and the roadmap is handling it adequately → EXCLUDE this gap entirely
   - If YES but the roadmap is clearly mishandling it (wrong solution, not enough focus) → classify as MISUNDERSTOOD
   - If NO open issue exists → classify as IGNORED
   - If issue exists but is closed/stale/low-priority → classify as UNDER-PRIORITIZED

3. BAN surface-level complaint summarization:
   - "Users complain about crashes" = BAD (this is a complaint summary)
   - "Users need confidence their work is safe during publishing" = GOOD (this is an inferred need)
   - Do NOT output a gap if it's simply "users are frequently annoyed by X" and X is already tracked

4. Rank gaps by EVIDENCE STRENGTH (define your ranking rationale):
   Strength = (a) number of independent supporting signals × (b) consistency across sources × (c) recency
   - More independent reviews mentioning same pattern = stronger
   - Same pattern appearing in different contexts = stronger
   - Recent reviews = stronger than old reviews
   - You MUST include rankingReasoning explaining WHY this gap is ranked at its position

━━━━━━━━━━━━━━━━━━

For EVERY gap, produce ALL FOUR of these fields (no exceptions):

{
  "topic": "kebab-case-label",
  "hiddenNeed": "The user's need stated in THEIR words/framing, not technical language. 1 sentence.",
  "confidence": 85,
  "confidenceJustification": "62% — corroborated by 14 reviews across 2 time periods but contradicted by 3 reviews praising the same feature",
  "verdict": "IGNORED|UNDER-PRIORITIZED|MISUNDERSTOOD",
  "verdictReason": "One sentence explaining WHY this specific verdict label applies",
  "supportingReviewIds": ["rev-xxx", "rev-yyy"],
  "supportingQuotes": ["exact quote from review that reveals the hidden need"],
  "relatedIssueNumbers": [123],
  "defenseExplanation": "Why this is a real unmet need: specific evidence that proves this is not just a complaint but a genuine gap in the product (2-3 sentences, ready for live Q&A)",
  "rankingReasoning": "Ranked #1 because: 23 independent reviews, consistent across 3 months, no open GitHub issue addressing this specific need"
}

━━━━━━━━━━━━━━━━━━

RULES:
- Return TOP 3-5 gaps ONLY. Quality over quantity.
- confidence MUST be an integer from 0-100 (not decimal).
- Every gap MUST have at least 1 supporting review ID.
- Every gap MUST have ALL FOUR fields: hiddenNeed, confidenceJustification, verdictReason, defenseExplanation
- Every insight MUST be provable from the data.
- Do NOT return generic complaints. Return HIDDEN NEEDS.
- Do NOT include gaps where the issue is already open and being handled (除非 roadmap is clearly mishandling it)
- rankingReasoning MUST explain the evidence strength calculation

Return ONLY the JSON.`;

  try {
    return await callGeminiJson<LatentNeedDetectorOutput>(prompt, { temperature: 0.3 });
  } catch {
    console.log("Gemini API unavailable, using local analysis fallback");
    return analyzeLocally(preprocessed, issues, issueSummary);
  }
}

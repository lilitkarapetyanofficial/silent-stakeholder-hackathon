"use client";

import { useState } from "react";
import type { Gap } from "@/lib/types";
import { getVerdictColor, getVerdictIcon, getConfidenceColor } from "@/lib/utils";

interface GapCardProps {
  gap: Gap;
  rank: number;
  isDark: boolean;
}

export default function GapCard({ gap, rank, isDark }: GapCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--fg-muted)]/30 transition-all duration-200 overflow-hidden">
      <div className="p-5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getVerdictColor(gap.verdict, isDark)}`}>
                <span className="text-[10px]">{getVerdictIcon(gap.verdict)}</span>
                {gap.verdict}
              </span>
              <span className="text-[11px] text-[var(--fg-muted)] font-mono">#{rank}</span>
              {gap.product && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  {gap.product}
                </span>
              )}
              {gap.product && !gap.reviewsAvailable && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Issues-only source
                </span>
              )}
              {gap.flagged && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  Confidence flagged
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-[var(--fg)] capitalize mb-1">{gap.topic}</h3>
            <p className="text-sm font-medium text-[var(--fg)] leading-relaxed">{gap.userNeed}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-3">
              <div>
                <div className="text-2xl font-bold font-mono text-[var(--fg)]">{gap.llmConfidence}%</div>
                <p className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wider mt-0.5">LLM</p>
              </div>
              <div className="text-[var(--fg-muted)]/40 text-lg">/</div>
              <div>
                <div className={`text-2xl font-bold font-mono ${gap.flagged ? "text-amber-500" : "text-[var(--fg)]"}`}>{gap.computedConfidence}%</div>
                <p className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wider mt-0.5">Computed</p>
              </div>
            </div>
          </div>
        </div>

        <div className="h-2 bg-[var(--bg-muted)] rounded-full overflow-hidden mb-3 flex gap-0.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ${getConfidenceColor(gap.llmConfidence / 100, isDark)}`}
            style={{ width: `${gap.llmConfidence}%`, opacity: 0.4 }}
          />
          <div
            className={`h-full rounded-full transition-all duration-700 ${getConfidenceColor(gap.computedConfidence / 100, isDark)}`}
            style={{ width: `${gap.computedConfidence}%` }}
          />
        </div>

        {gap.confidenceJustification && (
          <p className="text-xs text-[var(--fg-muted)] mb-3 italic">{gap.confidenceJustification}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-[var(--fg-muted)]">
          <span>{gap.evidence.reviews.length} review evidence</span>
          <span>{gap.evidence.issues.length} roadmap issues</span>
          <span className="ml-auto text-[var(--fg-muted)]/60">{expanded ? "▲ collapse" : "▼ expand"}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[var(--border)] p-5 bg-[var(--bg-muted)]/30 space-y-4">
          {gap.rankingReasoning && (
            <div>
              <h4 className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-2">
                Why Ranked #{rank}
              </h4>
              <p className="text-xs text-[var(--fg-muted)] leading-relaxed bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3">
                {gap.rankingReasoning}
              </p>
            </div>
          )}

          {gap.verdictReason && (
            <div>
              <h4 className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-2">
                Verdict Reason
              </h4>
              <p className="text-xs text-[var(--fg-muted)] leading-relaxed bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3">
                <span className={`font-medium ${gap.verdict === "IGNORED" ? "text-red-500" : gap.verdict === "UNDER-PRIORITIZED" ? "text-amber-500" : "text-blue-500"}`}>{gap.verdict}:</span> {gap.verdictReason}
              </p>
            </div>
          )}

          {gap.defenseExplanation && (
            <div>
              <h4 className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-2">
                Why This Is a Real Unmet Need
              </h4>
              <p className="text-xs text-[var(--fg-muted)] leading-relaxed bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3">
                {gap.defenseExplanation}
              </p>
            </div>
          )}

          {gap.counterArgument && (
            <div>
              <h4 className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-2">
                Counter-argument
              </h4>
              <p className="text-xs text-[var(--fg-muted)] leading-relaxed bg-[var(--bg-card)] border border-amber-200 dark:border-amber-500/30 rounded-lg p-3">
                {gap.counterArgument}
              </p>
            </div>
          )}

          {gap.evidence.reviews.length > 0 && (
            <div>
              <h4 className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-2">
                Evidence from Reviews ({gap.evidence.reviews.length} sources)
              </h4>
              <div className="space-y-2">
                {gap.evidence.reviews.map((r, i) => (
                  <div key={i} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-mono text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">{r.reviewId}</span>
                      <span className="text-[10px] text-[var(--fg-muted)]">{r.score} stars</span>
                      <span className="text-[10px] text-[var(--fg-muted)]">{r.thumbsUp} thumbs-up</span>
                      <span className="text-[10px] text-[var(--fg-muted)]">{r.date?.slice(0, 10)}</span>
                    </div>
                    <p className="text-xs text-[var(--fg)] italic">&ldquo;{r.content}&rdquo;</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {gap.evidence.issues.length > 0 && (
            <div>
              <h4 className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-2">
                Matched Roadmap Issues ({gap.evidence.issues.length} issues)
              </h4>
              <div className="space-y-1">
                {gap.evidence.issues.map((issue) => (
                  <a
                    key={issue.issueNumber}
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-[var(--fg-muted)] hover:text-blue-500 dark:hover:text-blue-400 transition-colors py-1.5 px-2 rounded hover:bg-[var(--bg-card)]"
                  >
                    <span className="font-mono text-blue-500 dark:text-blue-400">#{issue.issueNumber}</span>
                    <span className="truncate flex-1">{issue.title}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${issue.state === "open" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"}`}>
                      {issue.state}
                    </span>
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

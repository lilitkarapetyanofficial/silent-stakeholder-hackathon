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
            </div>
            <h3 className="text-lg font-bold text-[var(--fg)] capitalize mb-1">{gap.topic}</h3>
            <p className="text-sm font-medium text-[var(--fg)] leading-relaxed">{gap.userNeed}</p>
            {gap.explanation && (
              <p className="text-xs text-[var(--fg-muted)] leading-relaxed mt-2">{gap.explanation}</p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-3xl font-bold font-mono text-[var(--fg)]">{gap.confidence}%</div>
            <p className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wider mt-0.5">confidence</p>
          </div>
        </div>

        <div className="h-2 bg-[var(--bg-muted)] rounded-full overflow-hidden mb-4">
          <div
            className={`h-full rounded-full transition-all duration-700 ${getConfidenceColor(gap.confidence / 100, isDark)}`}
            style={{ width: `${gap.confidence}%` }}
          />
        </div>

        <div className="flex items-center gap-4 text-xs text-[var(--fg-muted)]">
          <span>{gap.evidence.reviews.length} review quotes</span>
          <span>{gap.evidence.issues.length} matched issues</span>
          <span className="ml-auto text-[var(--fg-muted)]/60">{expanded ? "▲ collapse" : "▼ expand"}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[var(--border)] p-5 bg-[var(--bg-muted)]/30">
          {gap.confidenceExplanation && (
            <div className="mb-4">
              <h4 className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-2">
                Confidence Reasoning
              </h4>
              <p className="text-xs text-[var(--fg-muted)] leading-relaxed bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3">
                {gap.confidenceExplanation}
              </p>
            </div>
          )}

          {gap.defenseExplanation && (
            <div className="mb-4">
              <h4 className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-2">
                Why This Is a Real Unmet Need
              </h4>
              <p className="text-xs text-[var(--fg-muted)] leading-relaxed bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3">
                {gap.defenseExplanation}
              </p>
            </div>
          )}

          {gap.evidence.reviews.length > 0 && (
            <div className="mb-4">
              <h4 className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-2">
                Evidence from Reviews
              </h4>
              <div className="space-y-2">
                {gap.evidence.reviews.map((r, i) => (
                  <div key={i} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-[var(--fg-muted)]">{r.reviewId}</span>
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
                Matched Roadmap Issues
              </h4>
              <div className="space-y-1">
                {gap.evidence.issues.map((issue) => (
                  <a
                    key={issue.issueNumber}
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-[var(--fg-muted)] hover:text-blue-500 dark:hover:text-blue-400 transition-colors py-1"
                  >
                    <span className="font-mono text-[var(--fg-muted)]">#{issue.issueNumber}</span>
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

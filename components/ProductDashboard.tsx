"use client";

import { useState } from "react";

interface MilestoneStat {
  milestone: string;
  open: number;
  closed: number;
  total: number;
}

interface ProductDashboardProps {
  stats: {
    totalReviews: number;
    totalIssues: number;
    dateRange: string;
  };
  milestones?: MilestoneStat[];
}

export default function ProductDashboard({ stats, milestones = [] }: ProductDashboardProps) {
  const [milestonesExpanded, setMilestonesExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/>
                <path d="M9.5 8.5l7 3.5-7 3.5z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--fg)]">WordPress for Android</h2>
              <p className="text-xs text-[var(--fg-muted)]">Mobile blogging &amp; CMS app</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-[var(--bg-muted)] p-3 border border-[var(--border)]">
          <p className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wider font-medium mb-1">
            User Signals Source
          </p>
          <p className="text-xs font-semibold text-[var(--fg)]">Google Play Reviews</p>
          <p className="text-[10px] text-[var(--fg-muted)]">sealuzh/app_reviews (HuggingFace)</p>
          <p className="text-[10px] text-[var(--fg-muted)]">Package: org.wordpress.android</p>
        </div>
        <div className="rounded-xl bg-[var(--bg-muted)] p-3 border border-[var(--border)]">
          <p className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wider font-medium mb-1">
            Roadmap Source
          </p>
          <p className="text-xs font-semibold text-[var(--fg)]">GitHub Issues</p>
          <p className="text-[10px] text-[var(--fg-muted)]">wordpress-mobile/WordPress-Android</p>
        </div>
        <div className="rounded-xl bg-[var(--bg-muted)] p-3 border border-[var(--border)]">
          <p className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wider font-medium mb-1">
            Data Period
          </p>
          <p className="text-xs font-semibold text-[var(--fg)]">{stats.dateRange}</p>
          <p className="text-[10px] text-[var(--fg-muted)]">{stats.totalReviews.toLocaleString()} reviews, {stats.totalIssues.toLocaleString()} issues</p>
        </div>
      </div>

      {milestones.length > 0 && (
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <button
            onClick={() => setMilestonesExpanded(!milestonesExpanded)}
            className="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[var(--fg-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-xs font-semibold text-[var(--fg)]">Roadmap Milestones</span>
              <span className="text-[10px] text-[var(--fg-muted)] bg-[var(--bg-muted)] px-1.5 py-0.5 rounded-full">
                {milestones.length}
              </span>
            </div>
            <span className="text-[var(--fg-muted)] text-[10px]">
              {milestonesExpanded ? "▲" : "▼"}
            </span>
          </button>

          {milestonesExpanded && (
            <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-1">
              {milestones.map((ms) => {
                const closedPct = ms.total > 0 ? Math.round((ms.closed / ms.total) * 100) : 0;
                return (
                  <div key={ms.milestone} className="flex items-center gap-3 rounded-lg bg-[var(--bg-muted)]/50 border border-[var(--border)] px-3 py-2">
                    <span className="text-xs font-mono font-semibold text-[var(--fg)] w-10 shrink-0">
                      {ms.milestone}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden flex">
                        <div
                          className="bg-emerald-500/70 h-full rounded-full"
                          style={{ width: `${closedPct}%` }}
                        />
                        <div
                          className="bg-amber-500/70 h-full rounded-full"
                          style={{ width: `${100 - closedPct}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-[10px] text-[var(--fg-muted)] w-16 text-right shrink-0">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">{ms.closed}</span>
                      <span className="mx-0.5">/</span>
                      <span className="text-amber-600 dark:text-amber-400 font-medium">{ms.open}</span>
                      <span className="ml-1 text-[var(--fg-muted)]/60">({closedPct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

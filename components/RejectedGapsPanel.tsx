"use client";

import { useState } from "react";

interface RejectedGapsPanelProps {
  reasons: string[];
}

export default function RejectedGapsPanel({ reasons }: RejectedGapsPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (reasons.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--bg-muted)]/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[var(--fg-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <span className="text-sm font-semibold text-[var(--fg)]">
            Considered and rejected
          </span>
          <span className="text-xs text-[var(--fg-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">
            {reasons.length}
          </span>
        </div>
        <span className="text-[var(--fg-muted)]/60 text-xs">
          {expanded ? "▲ collapse" : "▼ expand"}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-[var(--border)] p-4 space-y-2">
          {reasons.map((reason, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-xs text-[var(--fg-muted)] bg-[var(--bg-muted)]/50 rounded-lg p-3"
            >
              <span className="text-red-400 mt-0.5 flex-shrink-0">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="leading-relaxed">{reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

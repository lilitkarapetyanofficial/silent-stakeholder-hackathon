"use client";

import { useState } from "react";

interface Pattern {
  patternId: string;
  label: string;
  topics: string[];
  products: string[];
  gapIds: string[];
  sharedKeywords: string[];
}

interface CrossProjectPatternsProps {
  patterns: Pattern[];
}

export default function CrossProjectPatterns({ patterns }: CrossProjectPatternsProps) {
  const [expanded, setExpanded] = useState(false);

  if (patterns.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center justify-between text-left hover:bg-[var(--bg-muted)]/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div>
            <span className="text-sm font-semibold text-[var(--fg)]">
              Cross-project patterns
            </span>
            <p className="text-xs text-[var(--fg-muted)] mt-0.5">
              Shared unmet needs detected across {new Set(patterns.flatMap((p) => p.products)).size} products
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--fg-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">
            {patterns.length}
          </span>
          <span className="text-[var(--fg-muted)]/60 text-xs">
            {expanded ? "▲" : "▼"}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[var(--border)] p-5 space-y-3">
          {patterns.map((pattern) => (
            <div
              key={pattern.patternId}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-muted)]/30 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-[var(--fg)]">{pattern.label}</h4>
                <span className="text-[10px] font-mono text-[var(--fg-muted)]">{pattern.patternId}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {pattern.products.map((product) => (
                  <span
                    key={product}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/30 font-mono"
                  >
                    {product}
                  </span>
                ))}
              </div>
              <div className="text-xs text-[var(--fg-muted)]">
                <span className="font-medium">Topics:</span>{" "}
                {pattern.topics.join(", ")}
              </div>
              {pattern.sharedKeywords.length > 0 && (
                <div className="text-xs text-[var(--fg-muted)] mt-1">
                  <span className="font-medium">Shared signals:</span>{" "}
                  {pattern.sharedKeywords.slice(0, 8).join(", ")}
                </div>
              )}
              <div className="text-[10px] text-[var(--fg-muted)]/60 mt-2">
                {pattern.gapIds.length} gaps matched across {pattern.products.length} products
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

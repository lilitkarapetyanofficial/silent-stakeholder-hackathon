"use client";

import { useState, useEffect } from "react";

interface SourceHealth {
  name: string;
  product: string;
  hasReviews: boolean;
  issueCount: number;
  dateRange: string;
  fetchedAt: string;
  freshness: "fresh" | "stale" | "unknown";
  daysSinceFetch: number | null;
}

export default function SourceHealthPanel() {
  const [sources, setSources] = useState<SourceHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch("/api/sources")
      .then((res) => res.json())
      .then((data) => setSources(data.sources ?? []))
      .catch(() => setSources([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || sources.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center justify-between text-left hover:bg-[var(--bg-muted)]/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div>
            <span className="text-sm font-semibold text-[var(--fg)]">
              Source Health
            </span>
            <p className="text-xs text-[var(--fg-muted)] mt-0.5">
              {sources.filter((s) => s.freshness === "fresh").length} of {sources.length} sources fresh
            </p>
          </div>
        </div>
        <span className="text-[var(--fg-muted)]/60 text-xs">
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-[var(--border)] p-5 space-y-3">
          {sources.map((source) => (
            <div
              key={source.name}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-muted)]/30 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      source.freshness === "fresh"
                        ? "bg-emerald-500"
                        : source.freshness === "stale"
                        ? "bg-amber-500"
                        : "bg-zinc-400"
                    }`}
                  />
                  <h4 className="text-sm font-semibold text-[var(--fg)]">{source.name}</h4>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    source.freshness === "fresh"
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                      : source.freshness === "stale"
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {source.freshness === "fresh"
                    ? "Fresh"
                    : source.freshness === "stale"
                    ? `Stale (${source.daysSinceFetch}d ago)`
                    : "Unknown"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[var(--fg-muted)]">
                <div>
                  <span className="font-medium">Product:</span> {source.product}
                </div>
                <div>
                  <span className="font-medium">Reviews:</span>{" "}
                  {source.hasReviews ? "Available" : "Not available"}
                </div>
                <div>
                  <span className="font-medium">Issues:</span> {source.issueCount.toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Date range:</span> {source.dateRange}
                </div>
                {source.fetchedAt && (
                  <div className="col-span-2">
                    <span className="font-medium">Last fetched:</span>{" "}
                    {new Date(source.fetchedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

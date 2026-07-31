"use client";

import { useState, useEffect, useCallback } from "react";
import type { AnalysisResult } from "@/lib/types";
import Header from "@/components/Header";
import ProductDashboard from "@/components/ProductDashboard";
import StatsBar from "@/components/StatsBar";
import GapCard from "@/components/GapCard";
import FilterBar from "@/components/FilterBar";
import AnalyzeButton from "@/components/AnalyzeButton";
import RejectedGapsPanel from "@/components/RejectedGapsPanel";

import SourceHealthPanel from "@/components/SourceHealthPanel";

export default function Home() {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [milestones, setMilestones] = useState<Array<{ milestone: string; open: number; closed: number; total: number }>>([]);
  const [rejectedGaps, setRejectedGaps] = useState<string[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/gaps");
      if (res.ok) {
        const result = await res.json();
        setData(result);
        setRejectedGaps(result.rejectedGaps ?? []);
        setMilestones(result.milestones ?? []);
      }
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Analysis failed");
      }
      const result = await res.json();
      setData(result);
      setRejectedGaps(result.rejectedGaps ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const filteredGaps = filter && data
    ? data.gaps.filter((g) => g.verdict === filter)
    : data?.gaps ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="mb-8 animate-fade-up">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 text-[var(--fg)]">
            Latent Need Detection
          </h2>
          <p className="text-[var(--fg-muted)] max-w-2xl text-sm sm:text-base leading-relaxed">
            An AI digital stakeholder that discovers hidden user needs by comparing
            Google Play reviews against the GitHub roadmap for WordPress for Android.
          </p>
        </div>

        <div className="mb-6 animate-fade-up delay-100">
          <ProductDashboard
            stats={{
              totalReviews: data?.stats.totalReviews ?? 0,
              totalIssues: data?.stats.totalIssues ?? 0,
              dateRange: data?.stats.dateRange ?? "Loading...",
            }}
            milestones={milestones}
          />
        </div>

        <div className="mb-6 animate-fade-up delay-100">
          <SourceHealthPanel />
        </div>

        <div className="mb-6 animate-fade-up delay-200">
          <AnalyzeButton onAnalyze={runAnalysis} analyzing={analyzing} hasData={!!data?.gaps?.length} />
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4 text-red-600 dark:text-red-400 text-sm animate-fade-up">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-[var(--fg-muted)] text-sm">Loading data...</p>
            </div>
          </div>
        ) : data ? (
          <>
            {data.gaps.length > 0 && (
              <div className="mb-6 animate-fade-up delay-300">
                <StatsBar stats={data.stats} />
              </div>
            )}

            {data.gaps.length > 0 && (
              <div className="mb-6 animate-fade-up delay-400">
                <FilterBar activeFilter={filter} onFilter={setFilter} />
              </div>
            )}

            {filteredGaps.length === 0 ? (
              <div className="text-center py-16 animate-fade-up delay-500">
                {data.gaps.length === 0 ? (
                  <>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-muted)] border border-[var(--border)] flex items-center justify-center text-3xl">
                      🔍
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-[var(--fg)]">No Analysis Yet</h3>
                    <p className="text-[var(--fg-muted)] text-sm max-w-md mx-auto">
                      Click &quot;Run AI Analysis&quot; above to discover hidden user needs
                      by analyzing real WordPress for Android reviews against GitHub roadmap issues.
                    </p>
                  </>
                ) : (
                  <p className="text-[var(--fg-muted)]">No gaps match the current filter.</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredGaps.map((gap, i) => (
                  <div
                    key={gap.id}
                    className="animate-fade-up"
                    style={{ animationDelay: `${(i + 5) * 100}ms` }}
                  >
                    <GapCard gap={gap} rank={i + 1} isDark={isDark} />
                  </div>
                ))}
              </div>
            )}

            {rejectedGaps.length > 0 && (
              <div className="mt-6 mb-6 animate-fade-up delay-400">
                <RejectedGapsPanel reasons={rejectedGaps} />
              </div>
            )}

            {data.gaps.length > 0 && (
              <div className="mt-16 mb-8 border-t border-[var(--border)] pt-8 animate-fade-up delay-500">
                <h3 className="text-sm font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-4">
                  How It Works
                </h3>
                <div className="grid sm:grid-cols-3 gap-4 text-sm">
                  <Step num="1" title="Collect" desc="Loads WordPress for Android reviews from Google Play and GitHub issues from the roadmap." />
                  <Step num="2" title="Analyze" desc="Gemini AI cross-references user signals against roadmap activity to find deeper latent needs." />
                  <Step num="3" title="Classify" desc="Each gap is classified as IGNORED, UNDER-PRIORITIZED, or MISUNDERSTOOD with evidence." />
                </div>
              </div>
            )}
          </>
        ) : null}
      </main>

      <footer className="border-t border-[var(--border)] py-4 text-center text-xs text-[var(--fg-muted)]">
        Silent Stakeholder — Hackathon Prototype
      </footer>
    </div>
  );
}

function Step({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">{num}</span>
        <span className="text-blue-600 dark:text-blue-400 font-semibold">{title}</span>
      </div>
      <p className="text-[var(--fg-muted)] text-xs leading-relaxed">{desc}</p>
    </div>
  );
}

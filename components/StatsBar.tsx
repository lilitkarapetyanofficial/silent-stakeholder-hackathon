interface StatsBarProps {
  stats: {
    totalReviews: number;
    totalIssues: number;
    analyzedAt: string | null;
    ignoredCount: number;
    underPrioritizedCount: number;
    misunderstoodCount: number;
  };
}

export default function StatsBar({ stats }: StatsBarProps) {
  const total = stats.ignoredCount + stats.underPrioritizedCount + stats.misunderstoodCount;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard label="Reviews" value={stats.totalReviews.toLocaleString()} accent="text-blue-500 dark:text-blue-400" />
      <StatCard label="Issues" value={stats.totalIssues.toLocaleString()} accent="text-purple-500 dark:text-purple-400" />
      <StatCard label="Gaps Found" value={total.toString()} accent="text-violet-500 dark:text-violet-400" />
      <StatCard label="Ignored" value={stats.ignoredCount.toString()} accent="text-red-500 dark:text-red-400" />
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 hover:border-[var(--fg-muted)]/30 transition-colors">
      <p className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wider font-medium mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

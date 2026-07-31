interface ProductDashboardProps {
  stats: {
    totalReviews: number;
    totalIssues: number;
    dateRange: string;
  };
}

export default function ProductDashboard({ stats }: ProductDashboardProps) {
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
    </div>
  );
}

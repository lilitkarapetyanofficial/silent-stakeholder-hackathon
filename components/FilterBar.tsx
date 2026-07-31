"use client";

interface FilterBarProps {
  activeFilter: string | null;
  onFilter: (verdict: string | null) => void;
}

const filters = [
  { label: "All", value: null },
  { label: "Ignored", value: "IGNORED" },
  { label: "Under-Prioritized", value: "UNDER-PRIORITIZED" },
  { label: "Misunderstood", value: "MISUNDERSTOOD" },
];

export default function FilterBar({ activeFilter, onFilter }: FilterBarProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[11px] text-[var(--fg-muted)] uppercase tracking-wider mr-1 font-medium">
        Filter
      </span>
      {filters.map((f) => (
        <button
          key={f.value ?? "all"}
          onClick={() => onFilter(f.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            activeFilter === f.value
              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30"
              : "text-[var(--fg-muted)] border-[var(--border)] hover:border-[var(--fg-muted)]/50 hover:text-[var(--fg)]"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

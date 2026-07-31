"use client";

interface AnalyzeButtonProps {
  onAnalyze: () => void;
  analyzing: boolean;
  hasData: boolean;
}

export default function AnalyzeButton({ onAnalyze, analyzing, hasData }: AnalyzeButtonProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onAnalyze}
        disabled={analyzing}
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
          analyzing
            ? "bg-[var(--bg-muted)] text-[var(--fg-muted)] cursor-not-allowed border border-[var(--border)]"
            : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
        }`}
      >
        {analyzing ? (
          <>
            <div className="w-4 h-4 border-2 border-[var(--fg-muted)] border-t-transparent rounded-full animate-spin" />
            Analyzing with Gemini AI...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
            {hasData ? "Re-run AI Analysis" : "Run AI Analysis"}
          </>
        )}
      </button>
      {hasData && !analyzing && (
        <span className="text-xs text-[var(--fg-muted)]">Using cached results</span>
      )}
    </div>
  );
}

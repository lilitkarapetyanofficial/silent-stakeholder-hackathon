"use client";

import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20">
            SS
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-semibold tracking-tight text-[var(--fg)]">
              Silent Stakeholder
            </h1>
            <p className="text-[11px] text-[var(--fg-muted)] -mt-0.5 hidden sm:block">
              Latent Need Detection
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-muted)] text-[11px] text-[var(--fg-muted)] font-mono border border-[var(--border)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            WordPress for Android
          </span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

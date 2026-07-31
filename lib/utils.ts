export function getVerdictColor(verdict: string, isDark: boolean): string {
  if (isDark) {
    switch (verdict) {
      case "IGNORED": return "bg-red-500/15 text-red-400 border-red-500/30";
      case "UNDER-PRIORITIZED": return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "MISUNDERSTOOD": return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      default: return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";
    }
  }
  switch (verdict) {
    case "IGNORED": return "bg-red-50 text-red-700 border-red-200";
    case "UNDER-PRIORITIZED": return "bg-amber-50 text-amber-700 border-amber-200";
    case "MISUNDERSTOOD": return "bg-blue-50 text-blue-700 border-blue-200";
    default: return "bg-zinc-100 text-zinc-600 border-zinc-200";
  }
}

export function getVerdictIcon(verdict: string): string {
  switch (verdict) {
    case "IGNORED": return "\u2715";
    case "UNDER-PRIORITIZED": return "\u25B3";
    case "MISUNDERSTOOD": return "?";
    default: return "\u2022";
  }
}

export function getConfidenceColor(confidence: number, isDark: boolean): string {
  if (isDark) {
    if (confidence >= 0.7) return "bg-red-500";
    if (confidence >= 0.5) return "bg-amber-500";
    return "bg-emerald-500";
  }
  if (confidence >= 0.7) return "bg-red-500";
  if (confidence >= 0.5) return "bg-amber-500";
  return "bg-emerald-500";
}

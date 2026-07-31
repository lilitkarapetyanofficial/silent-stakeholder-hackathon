import type { VerifiedGap } from "./types";
import type { Gap } from "../types";

export interface CrossProjectPattern {
  patternId: string;
  label: string;
  topics: string[];
  products: string[];
  gapIds: string[];
  sharedKeywords: string[];
}

type GapLike = VerifiedGap | Gap;

const TOPIC_KEYWORDS: Record<string, string[]> = {
  "auth": ["login", "auth", "credential", "password", "session", "sso", "2fa", "sign-in", "signin"],
  "crash": ["crash", "error", "exception", "force-close", "anr", "freeze", "hang"],
  "performance": ["slow", "lag", "performance", "speed", "loading", "delay", "latency"],
  "media": ["image", "photo", "video", "media", "upload", "gallery", "camera"],
  "editor": ["editor", "format", "text", "block", "editing", "rich-text", "wysiwyg"],
  "notification": ["notification", "push", "alert", "notify", "badge"],
  "sync": ["sync", "synchronize", "offline", "background", "refresh"],
  "navigation": ["navigation", "menu", "drawer", "tab", "back-button", "flow"],
  "search": ["search", "filter", "find", "query", "discover"],
  "backup": ["backup", "export", "import", "data-loss", "restore"],
  "ui": ["ui", "interface", "design", "layout", "theme", "dark-mode", "accessibility"],
  "payment": ["payment", "purchase", "subscription", "billing", "premium"],
  "onboarding": ["onboarding", "setup", "tutorial", "getting-started", "welcome"],
  "share": ["share", "sharing", "social", "integrate"],
};

function normalizeTopic(topic: string): string[] {
  const lower = topic.toLowerCase();
  const matches: string[] = [];
  for (const [category, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      matches.push(category);
    }
  }
  return matches.length > 0 ? matches : [lower.split("-")[0]];
}

function findSharedKeywords(a: string[], b: string[]): string[] {
  const setA = new Set(a.map((k) => k.toLowerCase()));
  return b.filter((k) => setA.has(k.toLowerCase()));
}

export function findCrossProjectPatterns(verifiedGaps: GapLike[]): CrossProjectPattern[] {
  const productGroups = new Map<string, VerifiedGap[]>();
  for (const gap of verifiedGaps) {
    const list = productGroups.get(gap.product) || [];
    list.push(gap);
    productGroups.set(gap.product, list);
  }

  if (productGroups.size < 2) return [];

  const categoryToGaps = new Map<string, VerifiedGap[]>();
  for (const gap of verifiedGaps) {
    const categories = normalizeTopic(gap.topic);
    for (const cat of categories) {
      const list = categoryToGaps.get(cat) || [];
      list.push(gap);
      categoryToGaps.set(cat, list);
    }
  }

  const patterns: CrossProjectPattern[] = [];
  let patternCounter = 0;

  for (const [category, gaps] of categoryToGaps) {
    const uniqueProducts = new Set(gaps.map((g) => g.product));
    if (uniqueProducts.size < 2) continue;

    const representativeGaps = gaps.slice(0, 10);
    const sharedKw = representativeGaps.reduce<string[]>(
      (acc, g, i) => (i === 0 ? [...(g.evidence.reviews.flatMap((r) => r.content.split(/\s+/).slice(0, 5)))] : findSharedKeywords(acc, g.evidence.reviews.flatMap((r) => r.content.split(/\s+/).slice(0, 5)))),
      []
    ).slice(0, 5);

    const label = category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, " ");
    patternCounter++;

    patterns.push({
      patternId: `pattern-${patternCounter}`,
      label: `${label} across products`,
      topics: [...new Set(gaps.map((g) => g.topic))],
      products: [...uniqueProducts],
      gapIds: gaps.map((g) => g.id),
      sharedKeywords: sharedKw,
    });
  }

  return patterns.sort((a, b) => b.gapIds.length - a.gapIds.length);
}

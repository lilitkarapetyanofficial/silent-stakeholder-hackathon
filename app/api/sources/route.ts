import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

interface SourceManifestEntry {
  name: string;
  product: string;
  hasReviews: boolean;
  issueCount: number;
  dateRange: string;
  fetchedAt: string;
}

interface SourceHealthEntry extends SourceManifestEntry {
  freshness: "fresh" | "stale" | "unknown";
  daysSinceFetch: number | null;
}

const STALENESS_THRESHOLD_DAYS = 7;

export async function GET() {
  try {
    const manifestPath = join(process.cwd(), "data", "raw", "sources-manifest.json");
    if (!existsSync(manifestPath)) {
      return NextResponse.json({ sources: [] });
    }

    const raw = readFileSync(manifestPath, "utf-8");
    const manifest: SourceManifestEntry[] = JSON.parse(raw);

    const now = Date.now();
    const sources: SourceHealthEntry[] = manifest.map((entry) => {
      let daysSinceFetch: number | null = null;
      let freshness: SourceHealthEntry["freshness"] = "unknown";

      if (entry.fetchedAt) {
        const fetchedTime = new Date(entry.fetchedAt).getTime();
        daysSinceFetch = Math.floor((now - fetchedTime) / (1000 * 60 * 60 * 24));
        freshness = daysSinceFetch <= STALENESS_THRESHOLD_DAYS ? "fresh" : "stale";
      }

      return {
        ...entry,
        freshness,
        daysSinceFetch,
      };
    });

    return NextResponse.json({ sources });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

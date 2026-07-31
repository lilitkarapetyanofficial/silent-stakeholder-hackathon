import { join } from "path";

const ROOT = process.cwd();
const DATA_DIR = join(ROOT, "data", "raw");

export interface SourceEntry {
  name: string;
  product: string;
  reviewsPath: string | null;
  issuesPath: string;
}

export const SOURCE_REGISTRY: SourceEntry[] = [
  {
    name: "wordpress-android",
    product: "wordpress-mobile/WordPress-Android",
    reviewsPath: join(DATA_DIR, "reviews.json"),
    issuesPath: join(DATA_DIR, "issues.json"),
  },
  {
    name: "antennapod",
    product: "AntennaPod/AntennaPod",
    reviewsPath: null,
    issuesPath: join(DATA_DIR, "issues-antennapod.json"),
  },
  {
    name: "ankidroid",
    product: "AnkiDroid/Anki-Android",
    reviewsPath: null,
    issuesPath: join(DATA_DIR, "issues-ankidroid.json"),
  },
];

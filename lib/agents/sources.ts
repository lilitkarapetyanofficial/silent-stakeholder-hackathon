import { join } from "path";

const ROOT = process.cwd();
const DATA_DIR = join(ROOT, "data", "raw");

export interface SourceEntry {
  name: string;
  product: string;
  reviewsPath: string | null;
  reviewsAvailable: boolean;
  issuesPath: string;
}

export const SOURCE_REGISTRY: SourceEntry[] = [
  {
    name: "wordpress-android",
    product: "wordpress-mobile/WordPress-Android",
    reviewsPath: join(DATA_DIR, "reviews.json"),
    reviewsAvailable: true,
    issuesPath: join(DATA_DIR, "issues.json"),
  },
];

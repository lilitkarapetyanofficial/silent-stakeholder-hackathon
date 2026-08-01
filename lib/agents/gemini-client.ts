import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from "fs";
import { join } from "path";

const CACHE_DIR = join(process.cwd(), ".cache", "gemini");
const MODELS = ["gemini-3.6-flash", "gemini-3.5-flash"];
const RATE_LIMIT_MS = 3000;

let lastCallTime = 0;

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set in .env.local");
  return key;
}

function computeCacheKey(prompt: string, model: string): string {
  let hash = 0;
  const str = model + prompt.slice(0, 200);
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `gemini_${Math.abs(hash).toString(36)}`;
}

function readCache(key: string): string | null {
  try {
    const path = join(CACHE_DIR, `${key}.json`);
    if (!existsSync(path)) return null;
    const raw = readFileSync(path, "utf-8");
    const data = JSON.parse(raw);
    if (Date.now() - data.timestamp > 3600000) return null;
    return data.text;
  } catch {
    return null;
  }
}

function writeCache(key: string, text: string): void {
  try {
    if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(join(CACHE_DIR, `${key}.json`), JSON.stringify({
      text,
      timestamp: Date.now(),
    }));
  } catch {}
}

export async function callGemini(
  prompt: string,
  opts?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const cacheKey = computeCacheKey(prompt, MODELS[0]);
  const cached = readCache(cacheKey);
  if (cached) return cached;

  const now = Date.now();
  const wait = RATE_LIMIT_MS - (now - lastCallTime);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCallTime = Date.now();

  for (const model of MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${getApiKey()}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: opts?.temperature ?? 0.3,
              maxOutputTokens: opts?.maxTokens ?? 8192,
              responseMimeType: "application/json",
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          if (text) {
            writeCache(cacheKey, text);
            return text;
          }
          console.error(`Gemini ${model} returned OK but empty text. Response:`, JSON.stringify(data).slice(0, 500));
        }

        if (response.status === 503 || response.status === 429) {
          console.warn(`Gemini ${model} rate-limited/unavailable (${response.status}), retrying in ${2000 * (attempt + 1)}ms...`);
          await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }

        const errBody = await response.text();
        console.error(`Gemini ${model} HTTP ${response.status} (attempt ${attempt + 1}/3). Full response: ${errBody}`);
        break;
      } catch (e) {
        console.error(`Gemini ${model} attempt ${attempt + 1} threw exception:`, e instanceof Error ? e.message : String(e));
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  console.error(`All Gemini models exhausted. Models tried: ${MODELS.join(", ")}`);
  throw new Error("All Gemini models failed after retries");
}

export async function callGeminiJson<T>(
  prompt: string,
  opts?: { temperature?: number; maxTokens?: number }
): Promise<T> {
  const text = await callGemini(prompt, opts);
  console.log(`[callGeminiJson] Raw text (first 500 chars): ${text.slice(0, 500)}`);
  appendFileSync("critic-error.log", `[${new Date().toISOString()}] RAW TEXT (${text.length} chars):\n${text}\n\n`);
  const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("No JSON found in Gemini response");
  return JSON.parse(jsonMatch[0]);
}

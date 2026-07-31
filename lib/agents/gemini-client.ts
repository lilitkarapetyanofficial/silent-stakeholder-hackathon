import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const CACHE_DIR = join(process.cwd(), ".cache", "gemini");
const MODELS = ["gemini-3.5-flash", "gemini-2.0-flash"];
const RATE_LIMIT_MS = 1000;

let lastCallTime = 0;

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set in .env.local");
  return key;
}

function getCacheKey(prompt: string, model: string): string {
  let hash = 0;
  const str = model + prompt.slice(0, 200);
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `gemini_${Math.abs(hash).toString(36)}`;
}

function getFromCache(key: string): string | null {
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

function saveToCache(key: string, text: string): void {
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
  const cacheKey = getCacheKey(prompt, MODELS[0]);
  const cached = getFromCache(cacheKey);
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
              maxOutputTokens: opts?.maxTokens ?? 4096,
              responseMimeType: "application/json",
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          if (text) {
            saveToCache(cacheKey, text);
            return text;
          }
        }

        if (response.status === 503 || response.status === 429) {
          await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }

        const err = await response.text();
        console.error(`Gemini ${model} error: ${response.status} - ${err.slice(0, 200)}`);
        break;
      } catch (e) {
        console.error(`Gemini ${model} attempt ${attempt + 1} failed:`, e);
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  throw new Error("All Gemini models failed after retries");
}

export async function callGeminiJson<T>(
  prompt: string,
  opts?: { temperature?: number; maxTokens?: number }
): Promise<T> {
  const text = await callGemini(prompt, opts);
  const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("No JSON found in Gemini response");
  return JSON.parse(jsonMatch[0]);
}

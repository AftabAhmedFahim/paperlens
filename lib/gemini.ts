import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

export function hasKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function generateJson(prompt: string): Promise<unknown> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set in .env.local");

  const model = new GoogleGenerativeAI(key).getGenerativeModel({
    model: MODEL,
    generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
  });

  const res = await model.generateContent(prompt);
  return parseJson(res.response.text());
}

/** Models sometimes wrap JSON in fences or add prose. Strip it all before parsing. */
export function parseJson(raw: string): unknown {
  let s = (raw ?? "").trim();
  s = s.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

  try {
    return JSON.parse(s);
  } catch {
    // fall through
  }

  const first = Math.min(
    ...[s.indexOf("{"), s.indexOf("[")].filter((i) => i >= 0)
  );
  const last = Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));
  if (Number.isFinite(first) && last > first) {
    try {
      return JSON.parse(s.slice(first, last + 1));
    } catch {
      // fall through
    }
  }
  throw new Error("Model did not return parseable JSON");
}

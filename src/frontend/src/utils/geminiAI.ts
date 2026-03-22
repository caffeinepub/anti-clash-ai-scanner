const GEMINI_API_KEY = "AIzaSyD3pY6TmTNA17OCAghZJrPfn7zxPYd7cF0";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export interface GeminiOutfit {
  title: string;
  hairstyle: string;
  top: { label: string; color: string; hex: string };
  bottom: { label: string; color: string; hex: string };
  shoes: { label: string; color: string; hex: string };
  accessory: { label: string; color: string; hex: string };
  bag?: { label: string; color: string; hex: string };
}

export interface GeminiAdvice {
  scannedColorTip: string;
  matchedColorTip: string;
  outfits: GeminiOutfit[];
}

function extractJson(text: string): string {
  // Try to pull out a JSON block from markdown or raw text
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  const braceStart = text.indexOf("{");
  const braceEnd = text.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd !== -1)
    return text.slice(braceStart, braceEnd + 1);
  return text;
}

export async function getGeminiAdvice(
  scannedHex: string,
  garmentType: string,
  gender: "man" | "woman" | "all",
  matchedHex?: string,
): Promise<GeminiAdvice | null> {
  const genderLabel =
    gender === "woman" ? "woman" : gender === "man" ? "man" : "person";
  const matchedPart = matchedHex
    ? `The user has also selected ${matchedHex} as a matching color.`
    : "";

  const prompt = `You are a professional fashion stylist for Indian and global trends in 2026.

A ${genderLabel} has scanned a ${garmentType} in color ${scannedHex}. ${matchedPart}

Give 5 complete tip-to-toe outfit suggestions. Each outfit must include:
- A short title (e.g. "Casual Chic", "Office Ready")
- Hairstyle suggestion
- Top (type + color name + hex)
- Bottom (type + color name + hex)
- Shoes (type + color name + hex)
- Accessory (watch/jewelry type + color + hex)
- Bag (optional, type + color + hex)

Also give:
- scannedColorTip: 1-2 sentence specific fashion advice about ${scannedHex} as a ${garmentType}
- matchedColorTip: 1-2 sentence advice on pairing ${scannedHex} with ${matchedHex ?? "a complementary color"}

Respond ONLY with valid JSON in exactly this format:
{
  "scannedColorTip": "...",
  "matchedColorTip": "...",
  "outfits": [
    {
      "title": "...",
      "hairstyle": "...",
      "top": { "label": "...", "color": "...", "hex": "#RRGGBB" },
      "bottom": { "label": "...", "color": "...", "hex": "#RRGGBB" },
      "shoes": { "label": "...", "color": "...", "hex": "#RRGGBB" },
      "accessory": { "label": "...", "color": "...", "hex": "#RRGGBB" },
      "bag": { "label": "...", "color": "...", "hex": "#RRGGBB" }
    }
  ]
}`;

  try {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 2048 },
      }),
    });

    if (!res.ok) {
      console.error("Gemini API error:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const jsonStr = extractJson(rawText);
    const parsed = JSON.parse(jsonStr) as GeminiAdvice;
    return parsed;
  } catch (err) {
    console.error("Gemini parse error:", err);
    return null;
  }
}

export async function getGeminiColorAdvice(
  hex: string,
  garmentType: string,
  gender: string,
): Promise<string | null> {
  const prompt = `You are a professional fashion stylist. Give a 2-sentence specific tip for a ${gender} wearing ${garmentType} in color ${hex}. Focus on what to pair it with and the occasion. Keep it concise and practical.`;

  try {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 150 },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

export async function generateGarmentImage(
  garmentType: string,
  hexColor: string,
): Promise<string | null> {
  try {
    const prompt = `Professional fashion product photo of a ${garmentType} in the exact color ${hexColor}. Clean white background, studio lighting, high quality, no model, flat lay or hanging style.`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${GEMINI_API_KEY}`;
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith("image/")) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch {
    return null;
  }
}

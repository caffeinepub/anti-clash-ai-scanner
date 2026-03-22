/**
 * Convert hex color to HSL
 */
export function hexToHsl(hex: string): [number, number, number] {
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    case b:
      h = ((r - g) / d + 4) / 6;
      break;
  }

  return [h * 360, s, l];
}

/**
 * Map a hex color to a human-readable color name
 */
export function hexToColorName(hex: string): string {
  if (!hex || hex.length < 7) return "Unknown";
  const [h, s, l] = hexToHsl(hex);

  if (l < 0.1) return "Black";
  if (l > 0.93) return "White";
  if (s < 0.12) {
    if (l < 0.4) return "Dark Gray";
    if (l < 0.65) return "Gray";
    return "Light Gray";
  }

  if (h >= 345 || h < 15) return s > 0.5 ? "Red" : "Rose";
  if (h < 40) return s > 0.6 ? "Orange" : "Amber";
  if (h < 65) return s > 0.5 ? "Yellow" : "Gold";
  if (h < 150) return s > 0.4 ? "Green" : "Olive Green";
  if (h < 185) return "Teal";
  if (h < 260) return "Blue";
  if (h < 290) return "Indigo";
  if (h < 325) return "Purple";
  return "Pink";
}

/**
 * Get color family for trend suggestions
 */
export function getColorFamily(hex: string): "neutral" | "warm" | "cool" {
  if (!hex || hex.length < 7) return "neutral";
  const [h, s, l] = hexToHsl(hex);
  if (l > 0.85 || l < 0.15 || s < 0.12) return "neutral";
  if ((h >= 0 && h < 60) || h >= 345) return "warm";
  return "cool";
}

/**
 * Validate and normalize hex color
 */
export function normalizeHex(hex: string): string {
  const clean = hex.startsWith("#") ? hex : `#${hex}`;
  if (/^#[0-9a-fA-F]{6}$/.test(clean)) return clean.toUpperCase();
  return "#808080";
}

/**
 * Sample color from video element via canvas
 */
export function sampleVideoColor(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): string | null {
  if (!video || !canvas || video.readyState < 2) return null;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const cx = Math.floor(canvas.width / 2);
  const cy = Math.floor(canvas.height / 2);
  const data = ctx.getImageData(cx - 4, cy - 4, 8, 8).data;

  let r = 0;
  let g = 0;
  let b = 0;
  const pixels = 64;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  const avg = pixels;
  const rr = Math.round(r / avg)
    .toString(16)
    .padStart(2, "0");
  const gg = Math.round(g / avg)
    .toString(16)
    .padStart(2, "0");
  const bb = Math.round(b / avg)
    .toString(16)
    .padStart(2, "0");
  return `#${rr}${gg}${bb}`.toUpperCase();
}

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

/**
 * Generate N matching/complementary colors for a given hex using color theory.
 * For dark/neutral colors (black, grey, dark navy): returns light contrasting colors.
 * For vivid colors: returns complement + split-complements + neutrals + triadic.
 */
export function generateMatchingColors(
  hex: string,
  count = 10,
): { hex: string; name: string }[] {
  const [h, s, l] = hexToHsl(hex);

  const hslToHex = (hue: number, sat: number, lit: number): string => {
    const h2 = ((hue % 360) + 360) % 360;
    const s2 = Math.max(0, Math.min(1, sat));
    const l2 = Math.max(0, Math.min(1, lit));
    const c = (1 - Math.abs(2 * l2 - 1)) * s2;
    const x = c * (1 - Math.abs(((h2 / 60) % 2) - 1));
    const m = l2 - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;
    if (h2 < 60) {
      r = c;
      g = x;
    } else if (h2 < 120) {
      r = x;
      g = c;
    } else if (h2 < 180) {
      g = c;
      b = x;
    } else if (h2 < 240) {
      g = x;
      b = c;
    } else if (h2 < 300) {
      r = x;
      b = c;
    } else {
      r = c;
      b = x;
    }
    const rr = Math.round((r + m) * 255)
      .toString(16)
      .padStart(2, "0");
    const gg = Math.round((g + m) * 255)
      .toString(16)
      .padStart(2, "0");
    const bb = Math.round((b + m) * 255)
      .toString(16)
      .padStart(2, "0");
    return `#${rr}${gg}${bb}`.toUpperCase();
  };

  // For very dark colors (black, dark grey, dark navy) return light/neutral palette
  if (l < 0.2) {
    const candidates = [
      { hex: "#FFFFFF", name: "White" },
      { hex: "#F5F5F5", name: "Off White" },
      { hex: "#E8E8E8", name: "Light Gray" },
      { hex: "#D4D4D4", name: "Silver" },
      { hex: "#F5F0E8", name: "Cream" },
      { hex: "#F0EBE3", name: "Beige" },
      { hex: "#E8D5C0", name: "Sand" },
      { hex: "#1B3A6B", name: "Navy Blue" },
      { hex: "#8B2635", name: "Burgundy" },
      { hex: "#2D5A27", name: "Forest Green" },
      { hex: "#C4A882", name: "Khaki" },
      { hex: "#E8C4C4", name: "Blush Pink" },
    ];
    return candidates.slice(0, count);
  }

  // For light/white colors return vivid complements
  if (l > 0.85) {
    const candidates = [
      {
        hex: hslToHex(h + 180, 0.7, 0.35),
        name: hexToColorName(hslToHex(h + 180, 0.7, 0.35)),
      },
      {
        hex: hslToHex(h + 120, 0.65, 0.4),
        name: hexToColorName(hslToHex(h + 120, 0.65, 0.4)),
      },
      {
        hex: hslToHex(h + 240, 0.65, 0.4),
        name: hexToColorName(hslToHex(h + 240, 0.65, 0.4)),
      },
      { hex: "#1A1A1A", name: "Charcoal" },
      { hex: "#2C3E50", name: "Dark Navy" },
      { hex: "#4A4A4A", name: "Dark Gray" },
      { hex: "#8B6F47", name: "Warm Brown" },
      { hex: "#C0392B", name: "Deep Red" },
      { hex: "#27AE60", name: "Emerald" },
      { hex: "#8E44AD", name: "Violet" },
    ];
    return candidates.slice(0, count);
  }

  // For neutral/grey tones
  if (s < 0.15) {
    const vividHues = [0, 30, 60, 120, 180, 210, 270, 300, 330, 15];
    return vividHues.slice(0, count).map((hue) => {
      const hexVal = hslToHex(hue, 0.65, 0.45);
      return { hex: hexVal, name: hexToColorName(hexVal) };
    });
  }

  // For vivid/saturated colors use color wheel harmony
  const complement = h + 180;
  const splitComp1 = h + 150;
  const splitComp2 = h + 210;
  const triadic1 = h + 120;
  const triadic2 = h + 240;
  const analogous1 = h + 30;
  const analogous2 = h - 30;

  const rawColors = [
    { hue: complement, sat: s, lit: l },
    { hue: complement, sat: s * 0.8, lit: Math.min(l + 0.2, 0.85) },
    { hue: splitComp1, sat: s, lit: l },
    { hue: splitComp2, sat: s, lit: l },
    { hue: triadic1, sat: s * 0.9, lit: l },
    { hue: triadic2, sat: s * 0.9, lit: l },
    { hue: analogous1, sat: s * 0.7, lit: Math.min(l + 0.15, 0.85) },
    { hue: analogous2, sat: s * 0.7, lit: Math.min(l + 0.15, 0.85) },
    { hue: h, sat: 0.05, lit: 0.9 },
    { hue: h, sat: 0.08, lit: 0.2 },
    { hue: complement, sat: s * 0.6, lit: 0.85 },
    { hue: triadic1, sat: s * 0.5, lit: 0.75 },
  ];

  return rawColors.slice(0, count).map(({ hue, sat, lit }) => {
    const hexVal = hslToHex(hue, sat, lit);
    return { hex: hexVal, name: hexToColorName(hexVal) };
  });
}

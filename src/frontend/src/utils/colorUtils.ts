import { getColorName } from "../lib/colorNames";

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
 * Convert HSL to hex
 */
export function hslToHex(hue: number, sat: number, lit: number): string {
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
 * @param reticleNorm - Optional normalized position {x, y} (0-1). Defaults to center.
 */
export function sampleVideoColor(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  reticleNorm?: { x: number; y: number },
): string | null {
  if (!video || !canvas || video.readyState < 2) return null;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const nx = reticleNorm?.x ?? 0.5;
  const ny = reticleNorm?.y ?? 0.5;
  const cx = Math.floor(nx * canvas.width);
  const cy = Math.floor(ny * canvas.height);
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
 * Analyze a rectangular region on a canvas for multiple colors and patterns.
 * Returns top distinct color clusters, a descriptive breakdown, and a count.
 */
export function analyzeRegionColors(
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  w: number,
  h: number,
): {
  colors: Array<{ hex: string; name: string }>;
  breakdown: string;
  count: number;
} {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { colors: [], breakdown: "Could not read colors", count: 0 };
  }

  // Clamp region to canvas bounds
  const safeX = Math.max(0, Math.min(x, canvas.width - 1));
  const safeY = Math.max(0, Math.min(y, canvas.height - 1));
  const safeW = Math.min(w, canvas.width - safeX);
  const safeH = Math.min(h, canvas.height - safeY);

  if (safeW <= 0 || safeH <= 0) {
    return { colors: [], breakdown: "Invalid region", count: 0 };
  }

  const imageData = ctx.getImageData(safeX, safeY, safeW, safeH);
  const data = imageData.data;

  // Sample every 4th pixel in both axes (~stride of 4)
  const stride = 4;
  const samples: Array<{
    r: number;
    g: number;
    b: number;
    h: number;
    s: number;
    l: number;
  }> = [];

  for (let py = 0; py < safeH; py += stride) {
    for (let px = 0; px < safeW; px += stride) {
      const idx = (py * safeW + px) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const rn = r / 255;
      const gn = g / 255;
      const bn = b / 255;

      const max = Math.max(rn, gn, bn);
      const min = Math.min(rn, gn, bn);
      const lum = (max + min) / 2;

      let hue = 0;
      let sat = 0;
      if (max !== min) {
        const d = max - min;
        sat = lum > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case rn:
            hue = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
            break;
          case gn:
            hue = ((bn - rn) / d + 2) / 6;
            break;
          case bn:
            hue = ((rn - gn) / d + 4) / 6;
            break;
        }
      }
      samples.push({ r, g, b, h: hue * 360, s: sat, l: lum });
    }
  }

  if (samples.length === 0) {
    return { colors: [], breakdown: "No pixels sampled", count: 0 };
  }

  // Cluster by HSL proximity
  type Cluster = {
    pixels: typeof samples;
    sumR: number;
    sumG: number;
    sumB: number;
  };
  const clusters: Cluster[] = [];

  for (const px of samples) {
    let assigned = false;
    for (const cluster of clusters) {
      const rep = cluster.pixels[0];
      const hDiff = Math.min(
        Math.abs(px.h - rep.h),
        360 - Math.abs(px.h - rep.h),
      );
      const sDiff = Math.abs(px.s - rep.s);
      const lDiff = Math.abs(px.l - rep.l);
      if (hDiff < 30 && sDiff < 0.25 && lDiff < 0.25) {
        cluster.pixels.push(px);
        cluster.sumR += px.r;
        cluster.sumG += px.g;
        cluster.sumB += px.b;
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      clusters.push({ pixels: [px], sumR: px.r, sumG: px.g, sumB: px.b });
    }
  }

  const total = samples.length;
  const minClusterSize = Math.floor(total * 0.05);

  // Filter small clusters and sort by frequency
  const significant = clusters
    .filter((c) => c.pixels.length >= minClusterSize)
    .sort((a, b) => b.pixels.length - a.pixels.length)
    .slice(0, 5);

  if (significant.length === 0) {
    // All clusters too small — return the biggest one regardless
    clusters.sort((a, b) => b.pixels.length - a.pixels.length);
    significant.push(clusters[0]);
  }

  // Convert clusters to hex + name
  const colors = significant.map((c) => {
    const avgR = Math.round(c.sumR / c.pixels.length);
    const avgG = Math.round(c.sumG / c.pixels.length);
    const avgB = Math.round(c.sumB / c.pixels.length);
    const rr = avgR.toString(16).padStart(2, "0");
    const gg = avgG.toString(16).padStart(2, "0");
    const bb = avgB.toString(16).padStart(2, "0");
    const hex = `#${rr}${gg}${bb}`.toUpperCase();
    return { hex, name: getColorName(hex) };
  });

  // Build human-readable breakdown
  let breakdown = "";
  if (colors.length === 1) {
    breakdown = colors[0].name;
  } else if (colors.length === 2) {
    breakdown = `${colors[0].name} with ${colors[1].name} accents`;
  } else if (colors.length === 3) {
    breakdown = `${colors[0].name} and ${colors[1].name} with ${colors[2].name} highlights`;
  } else {
    const main = colors
      .slice(0, 2)
      .map((c) => c.name)
      .join(" and ");
    const accents = colors
      .slice(2)
      .map((c) => c.name)
      .join(", ");
    breakdown = `${main} with ${accents}`;
  }

  return { colors, breakdown, count: colors.length };
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

/**
 * Internal color theory: get category-based color matches instantly (no AI needed)
 */
export interface CategoryMatch {
  hex: string;
  label: string;
  harmony: string;
}

export function getCategoryMatches(
  baseHex: string,
  garmentType: string,
): CategoryMatch[] {
  const [h, s, l] = hexToHsl(baseHex);
  const isVeryDark = l < 0.2;
  const isLight = l > 0.75;
  const isNeutral = s < 0.18;

  // Helper to create a CategoryMatch
  const make = (hex: string, harmony: string): CategoryMatch => ({
    hex,
    label: hexToColorName(hex),
    harmony,
  });

  // For bottoms (pants, jeans, etc): suggest tops/shirts that pair well
  if (garmentType === "bottom" || garmentType === "pants") {
    if (isVeryDark) {
      return [
        make("#FFFFFF", "Neutral Balance"),
        make("#F5F0E8", "Neutral Balance"),
        make("#E8E0D4", "Neutral Balance"),
        make(hslToHex(h, 0.55, 0.65), "Monochromatic"),
        make("#8B2635", "Complementary"),
        make("#2D5A27", "Triadic"),
        make("#1B3A6B", "Analogous"),
        make("#D4A853", "Split Complementary"),
      ];
    }
    if (isLight || isNeutral) {
      return [
        make(hslToHex(h + 180, Math.min(s + 0.2, 0.9), 0.4), "Complementary"),
        make("#1A1A2E", "High Contrast"),
        make("#2C3E50", "High Contrast"),
        make(hslToHex(h + 120, 0.65, 0.4), "Triadic"),
        make(hslToHex(h - 30, s * 0.8, 0.45), "Analogous"),
        make("#8B6914", "Earthy"),
        make("#8B2635", "Bold Contrast"),
        make(hslToHex(h + 30, s * 0.7, 0.55), "Analogous"),
      ];
    }
    return [
      make("#F5F5F5", "Neutral Balance"),
      make("#1A1A1A", "High Contrast"),
      make(hslToHex(h + 180, s, l), "Complementary"),
      make("#D4D4D4", "Neutral Balance"),
      make(hslToHex(h + 150, s * 0.8, l * 0.9), "Split Complementary"),
      make("#F0EBE3", "Soft Neutral"),
      make(hslToHex(h + 120, s * 0.7, 0.55), "Triadic"),
      make("#C4A882", "Earthy Neutral"),
    ];
  }

  // For tops/shirts: suggest bottoms, shoes, accessories
  if (garmentType === "top" || garmentType === "shirt") {
    if (isVeryDark || isNeutral) {
      return [
        make("#F5F0E8", "Neutral Pair"),
        make("#E8D5C0", "Earthy Neutral"),
        make("#2C3E50", "Tonal"),
        make("#8B6914", "Warm Earthy"),
        make("#1B3A6B", "Deep Tonal"),
        make(hslToHex(h + 30, 0.55, 0.45), "Analogous"),
        make("#4A4A4A", "Monochromatic"),
        make("#C4A882", "Warm Contrast"),
      ];
    }
    return [
      make("#1A1A1A", "High Contrast"),
      make("#2C3E50", "Dark Neutral"),
      make("#4A4A4A", "Mid Neutral"),
      make(hslToHex(h + 180, s * 0.8, 0.3), "Complementary"),
      make("#F5F0E8", "Light Neutral"),
      make("#8B6914", "Earthy"),
      make(hslToHex(h + 150, s * 0.6, 0.35), "Split Complementary"),
      make("#C4A882", "Warm Neutral"),
    ];
  }

  // For shoes
  if (garmentType === "shoes" || garmentType === "footwear") {
    if (isVeryDark || isNeutral) {
      return [
        make("#FFFFFF", "Classic Contrast"),
        make("#F5F0E8", "Warm Neutral"),
        make(hslToHex(h + 180, 0.6, 0.5), "Complementary Pop"),
        make("#8B6914", "Earthy Warm"),
        make("#1B3A6B", "Navy Pair"),
        make("#D4A853", "Gold Accent"),
        make("#8B2635", "Burgundy Classic"),
        make(hslToHex(h + 120, 0.5, 0.5), "Triadic"),
      ];
    }
    return [
      make("#1A1A1A", "Black Classic"),
      make("#8B7355", "Brown Classic"),
      make("#FFFFFF", "White Fresh"),
      make(hslToHex(h + 180, s * 0.7, 0.4), "Complementary"),
      make("#D4D4D4", "Silver"),
      make(hslToHex(h + 150, s * 0.6, 0.45), "Split Complementary"),
      make("#C4A882", "Nude Tone"),
      make("#2C3E50", "Dark Pair"),
    ];
  }

  // For accessories (watches, jewelry, scarves)
  if (garmentType === "accessories" || garmentType === "watch") {
    return [
      make("#D4A853", "Gold Classic"),
      make("#C0C0C0", "Silver Modern"),
      make("#8B6914", "Bronze Warm"),
      make(hslToHex(h + 180, s * 0.8, 0.5), "Complementary Accent"),
      make("#1A1A1A", "Sleek Black"),
      make("#8B2635", "Burgundy Rich"),
      make(hslToHex(h + 120, s * 0.6, 0.5), "Triadic Pop"),
      make(hslToHex(h + 30, s * 0.7, 0.6), "Warm Analogous"),
    ];
  }

  // For ethnic wear (saree, kurta)
  if (
    garmentType === "ethnic" ||
    garmentType === "saree" ||
    garmentType === "kurta"
  ) {
    return [
      make("#D4A853", "Gold Classic"),
      make("#8B2635", "Maroon Royal"),
      make(hslToHex(h + 180, s, l), "Complementary"),
      make("#1A3A2E", "Deep Green"),
      make("#F5F0E8", "Ivory Neutral"),
      make(hslToHex(h + 120, s * 0.8, l * 0.9), "Triadic"),
      make("#8B6914", "Earthy"),
      make(hslToHex(h - 30, s * 0.9, Math.min(l + 0.1, 0.8)), "Analogous"),
    ];
  }

  // For bags/purses
  if (garmentType === "bag") {
    return [
      make("#1A1A1A", "Black Classic"),
      make("#8B7355", "Brown Tan"),
      make("#FFFFFF", "White Clean"),
      make("#D4A853", "Gold Tan"),
      make(hslToHex(h + 180, s * 0.7, 0.4), "Complementary"),
      make("#8B2635", "Burgundy"),
      make("#C4A882", "Nude Beige"),
      make(hslToHex(h + 150, s * 0.6, 0.45), "Split Complementary"),
    ];
  }

  // For jackets/blazers
  if (garmentType === "jacket") {
    if (isVeryDark || isNeutral) {
      return [
        make("#FFFFFF", "Classic White"),
        make("#F5F0E8", "Ivory"),
        make("#1B3A6B", "Navy Tonal"),
        make("#8B2635", "Burgundy Pop"),
        make("#8B6914", "Earthy Warm"),
        make(hslToHex(h + 120, 0.5, 0.5), "Triadic"),
        make("#D4D4D4", "Light Gray"),
        make("#2D5A27", "Forest Pop"),
      ];
    }
    return [
      make("#1A1A1A", "Black Sleek"),
      make("#F5F0E8", "Light Neutral"),
      make(hslToHex(h + 180, s * 0.7, 0.35), "Complementary"),
      make("#2C3E50", "Dark Neutral"),
      make(hslToHex(h + 30, s * 0.6, 0.55), "Analogous"),
      make("#8B6914", "Earthy"),
      make(hslToHex(h + 150, s * 0.8, 0.4), "Split Complementary"),
      make("#C4A882", "Warm Neutral"),
    ];
  }

  // Default fallback - use complementary + neutrals
  const comp = hslToHex(h + 180, s, l);
  const tri1 = hslToHex(h + 120, s * 0.8, l);
  const tri2 = hslToHex(h + 240, s * 0.8, l);
  return [
    make(comp, "Complementary"),
    make("#F5F5F5", "Light Neutral"),
    make("#1A1A1A", "Dark Neutral"),
    make(tri1, "Triadic"),
    make(tri2, "Triadic"),
    make(hslToHex(h + 30, s * 0.7, Math.min(l + 0.15, 0.85)), "Analogous"),
    make("#D4A853", "Warm Accent"),
    make(hslToHex(h + 150, s * 0.6, 0.5), "Split Complementary"),
  ];
}

/**
 * Get a 0-100 harmony score between two hex colors
 */
export function getColorHarmonyScore(hex1: string, hex2: string): number {
  const [h1, s1, l1] = hexToHsl(hex1);
  const [h2, s2, l2] = hexToHsl(hex2);
  const hueDiff = Math.abs((h1 - h2 + 360) % 360);
  const normalizedHueDiff = Math.min(hueDiff, 360 - hueDiff);

  // High contrast light/dark is always good
  const lightnessDiff = Math.abs(l1 - l2);
  if (lightnessDiff > 0.55) return 88;

  // Complementary (around 180 degrees)
  if (normalizedHueDiff > 150 && normalizedHueDiff < 210) return 90;
  // Triadic (around 120 degrees)
  if (normalizedHueDiff > 100 && normalizedHueDiff <= 150) return 80;
  // Analogous (close hues)
  if (normalizedHueDiff < 40) return s1 < 0.15 || s2 < 0.15 ? 85 : 70;
  // If one is neutral
  if (s1 < 0.18 || s2 < 0.18) return 85;
  // Clashing
  if (normalizedHueDiff > 60 && normalizedHueDiff < 100 && s1 > 0.5 && s2 > 0.5)
    return 35;
  return 65;
}

export interface CoupleHarmonyResult {
  score: number;
  tier:
    | "monochromatic"
    | "complementary"
    | "neutrals_pop"
    | "analogous"
    | "clash";
  advice: string;
  fixItSuggestion: string | null;
}

const TREND_COLORS_2026 = [
  { name: "Transformative Teal", hex: "#2D9B9B" },
  { name: "Cloud Dancer", hex: "#F5F0E8" },
  { name: "Lava Falls", hex: "#D4453A" },
  { name: "Mocha Brown", hex: "#6F4E37" },
  { name: "Sage Green", hex: "#7D9B76" },
  { name: "Dusty Pink", hex: "#D4A5A5" },
  { name: "Powder Blue", hex: "#A8C5D4" },
  { name: "Earthy Terracotta", hex: "#C87941" },
  { name: "Midnight Navy", hex: "#1B2A4A" },
  { name: "Vanilla Cream", hex: "#F5ECD7" },
];

/**
 * Get couple harmony score with tier and advice
 */
export function getCoupleHarmonyScore(
  hex1: string,
  hex2: string,
): CoupleHarmonyResult {
  const [h1, s1, l1] = hexToHsl(hex1);
  const [h2, s2, l2] = hexToHsl(hex2);
  const hueDiff = Math.abs((h1 - h2 + 360) % 360);
  const normalizedHueDiff = Math.min(hueDiff, 360 - hueDiff);
  const lightnessDiff = Math.abs(l1 - l2);

  const isNeutral1 = s1 < 0.2;
  const isNeutral2 = s2 < 0.2;
  const isVivid1 = s1 > 0.5;
  const isVivid2 = s2 > 0.5;

  let tier: CoupleHarmonyResult["tier"];
  let score: number;
  let advice: string;

  // Neutrals + Pop
  if ((isNeutral1 && isVivid2) || (isNeutral2 && isVivid1)) {
    tier = "neutrals_pop";
    score = 88;
    advice =
      "Clean and classic. That pop of color ties you both together beautifully.";
  }
  // Monochromatic (same hue family, different lightness)
  else if (normalizedHueDiff < 30 && lightnessDiff > 0.2) {
    tier = "monochromatic";
    score = 95;
    advice = "Perfect tonal transition! You look sophisticated and unified.";
  }
  // Complementary (opposite colors)
  else if (normalizedHueDiff >= 150 && normalizedHueDiff <= 210) {
    tier = "complementary";
    score = 90;
    advice = "Great contrast! These colors are balanced and photo-ready.";
  }
  // Analogous (close hues)
  else if (normalizedHueDiff >= 30 && normalizedHueDiff < 60) {
    tier = "analogous";
    score = 82;
    advice = "Harmonious and natural — a calm, coordinated look.";
  }
  // High Clash
  else if (
    normalizedHueDiff >= 60 &&
    normalizedHueDiff < 150 &&
    isVivid1 &&
    isVivid2
  ) {
    tier = "clash";
    score = 35;
    advice =
      "You're fighting for the spotlight! One of you should switch to a neutral to let the other's color shine.";
  }
  // Default medium
  else {
    tier = "analogous";
    score = 72;
    advice =
      "Decent coordination — a subtle tonal adjustment would elevate this look.";
  }

  let fixItSuggestion: string | null = null;
  if (score < 70) {
    // Suggest a 2026 trend color for Person 2 that would complement Person 1
    const name1 = hexToColorName(hex1);
    // Find a color from 2026 trends that has a high harmony score with hex1
    let bestTrend = TREND_COLORS_2026[1]; // Cloud Dancer as safe default
    let bestScore = 0;
    for (const trend of TREND_COLORS_2026) {
      const s = getColorHarmonyScore(hex1, trend.hex);
      if (s > bestScore) {
        bestScore = s;
        bestTrend = trend;
      }
    }
    fixItSuggestion = `Partner 2 should try ${bestTrend.name} (${bestTrend.hex}) to balance Partner 1's ${name1} outfit.`;
  }

  return { score, tier, advice, fixItSuggestion };
}

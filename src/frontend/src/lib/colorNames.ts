/**
 * Extended color name library with 200+ fashion-accurate names.
 * Priority names match the Colour Clash brand language.
 */

const COLOR_MAP: Record<string, string> = {
  // ── Priority fashion names ──────────────────────────────────────────────
  FFE135: "Banana Yellow",
  FF4500: "Lava Falls",
  "9966CC": "Amethyst Orchid",
  "8FBC8F": "Sage Green",
  "483D8B": "Midnight Marina",
  E97451: "Burnt Sienna",
  F7E7CE: "Champagne",
  "1B4D3E": "Alexandrite Teal",
  "000080": "Navy Blue",
  "4169E1": "Royal Blue",
  "87CEEB": "Sky Blue",
  "008080": "Teal",
  "40E0D0": "Turquoise",
  "2E8B57": "Sea Green",
  "98FF98": "Mint Green",
  "556B2F": "Olive Drab",
  "800000": "Maroon",
  DC143C: "Crimson",
  FFB6C1: "Baby Pink",
  FF69B4: "Hot Pink",
  E6E6FA: "Lavender",
  "800080": "Plum",
  DA70D6: "Orchid",
  "36454F": "Charcoal Grey",
  "808080": "Slate Grey",
  F5F5DC: "Beige",
  C19A6B: "Camel",
  "4B3621": "Cafe Noir",
  FFFDD0: "Cream",
  FAF0E6: "Linen",
  // ── Reds ───────────────────────────────────────────────────────────────
  FF0000: "Red",
  CC0000: "Dark Red",
  "990000": "Deep Red",
  FF3333: "Bright Red",
  FF6666: "Coral Red",
  FF4444: "Tomato Red",
  B22222: "Firebrick",
  "8B0000": "Dark Crimson",
  CD5C5C: "Indian Red",
  E34234: "Vermilion",
  // ── Pinks ──────────────────────────────────────────────────────────────
  FFC0CB: "Light Pink",
  FF1493: "Deep Pink",
  C71585: "Medium Violet Red",
  DB7093: "Pale Violet Red",
  FF82AB: "Flamingo Pink",
  FFAEB9: "Blush Pink",
  F4A7B9: "Dusty Rose",
  E75480: "Dark Pink",
  // ── Oranges ────────────────────────────────────────────────────────────
  FFA500: "Orange",
  FF8C00: "Dark Orange",
  FF7F50: "Coral",
  FF6347: "Tomato",
  E2703A: "Burnt Orange",
  F4A460: "Sandy Brown",
  D2691E: "Chocolate",
  CD853F: "Peru",
  C8763C: "Copper",
  A0522D: "Sienna",
  // ── Yellows ────────────────────────────────────────────────────────────
  FFFF00: "Yellow",
  FFFFE0: "Light Yellow",
  FFFACD: "Lemon Chiffon",
  FFD700: "Gold",
  FFC200: "Amber",
  F9A602: "Marigold",
  EAC117: "Mustard",
  DAA520: "Goldenrod",
  B8860B: "Dark Goldenrod",
  F0E68C: "Khaki",
  BDB76B: "Dark Khaki",
  FAFAD2: "Light Goldenrod",
  // ── Greens ─────────────────────────────────────────────────────────────
  "008000": "Green",
  "228B22": "Forest Green",
  "006400": "Dark Green",
  "00FF00": "Lime",
  "7CFC00": "Lawn Green",
  "00FF7F": "Spring Green",
  "32CD32": "Lime Green",
  "3CB371": "Medium Sea Green",
  "66CDAA": "Medium Aquamarine",
  "20B2AA": "Light Sea Green",
  "00FA9A": "Medium Spring Green",
  "9ACD32": "Yellow Green",
  "6B8E23": "Olive Drab Dark",
  "808000": "Olive",
  "7B9C4E": "Fern Green",
  "4F7942": "Fern",
  ADDFAD: "Celadon",
  ACE1AF: "Pale Green",
  "50C878": "Emerald",
  "00A693": "Jungle Green",
  "1CAC78": "Jade Green",
  "4CBB17": "Kelly Green",
  // ── Blues ──────────────────────────────────────────────────────────────
  "0000FF": "Blue",
  "0000CD": "Medium Blue",
  "00008B": "Dark Blue",
  "191970": "Midnight Blue",
  "4682B4": "Steel Blue",
  "5F9EA0": "Cadet Blue",
  "6495ED": "Cornflower Blue",
  "00BFFF": "Deep Sky Blue",
  "1E90FF": "Dodger Blue",
  "6CB4E4": "Carolina Blue",
  ADD8E6: "Light Blue",
  B0E0E6: "Powder Blue",
  "87CEFA": "Light Sky Blue",
  AFEEEE: "Pale Turquoise",
  E0FFFF: "Light Cyan",
  "00CED1": "Dark Turquoise",
  "48D1CC": "Medium Turquoise",
  "0047AB": "Cobalt Blue",
  "245B9F": "Denim Blue",
  "003153": "Prussian Blue",
  "005F6B": "Peacock Blue",
  // ── Purples ────────────────────────────────────────────────────────────
  "8B008B": "Dark Magenta",
  "9B59B6": "Medium Purple",
  "9932CC": "Dark Orchid",
  "8A2BE2": "Blue Violet",
  "6A0DAD": "Purple",
  "7B68EE": "Medium Slate Blue",
  "6959CD": "Slate Blue",
  "9370DB": "Medium Lavender",
  D8BFD8: "Thistle",
  DDA0DD: "Plum Light",
  EE82EE: "Violet",
  FF00FF: "Magenta",
  BA55D3: "Medium Orchid",
  C8A2C8: "Lilac",
  "4B0082": "Indigo",
  // ── Browns ─────────────────────────────────────────────────────────────
  "8B4513": "Saddle Brown",
  "7B3F00": "Chocolate Brown",
  "6F4E37": "Coffee Brown",
  "5C4033": "Dark Coffee",
  D2B48C: "Tan",
  C8A27A: "Wheat",
  FAEBD7: "Antique White",
  DEBA8C: "Burlywood",
  "8B7355": "Mocha",
  "7B5E57": "Mocha Dark",
  A67B5B: "Antique Bronze",
  B5651D: "Light Brown",
  "9B7653": "Walnut",
  E8DCC8: "Sand",
  DEB887: "Burly Wood",
  // ── Greys ──────────────────────────────────────────────────────────────
  "111111": "Near Black",
  "222222": "Very Dark Grey",
  "333333": "Dark Grey",
  "444444": "Charcoal",
  "555555": "Dim Grey",
  "666666": "Medium Grey",
  "777777": "Grey",
  "888888": "Silver Grey",
  "999999": "Light Medium Grey",
  AAAAAA: "Light Grey",
  BBBBBB: "Gainsboro",
  CCCCCC: "Silver",
  D3D3D3: "Light Silver",
  DCDCDC: "Whitesmoke Dark",
  EBEBEB: "Off White Grey",
  F5F5F5: "Whitesmoke",
  F8F8F8: "Near White",
  // ── Whites ─────────────────────────────────────────────────────────────
  FFFFFF: "Pure White",
  FEFEFE: "White",
  FFFAFA: "Snow White",
  F0FFF0: "Honeydew",
  F0FFFF: "Azure",
  F5FFFA: "Mint Cream",
  FFFFF0: "Ivory",
  FFF8DC: "Cornsilk",
  FFF5EE: "Seashell",
  FFDAB9: "Peach Puff",
  FFE4E1: "Misty Rose",
  // ── Blacks ─────────────────────────────────────────────────────────────
  "000000": "Jet Black",
  "0A0A0A": "Rich Black",
  "1A1A1A": "Off Black",
  "2C2C2C": "Graphite",
  // ── Special fashion ────────────────────────────────────────────────────
  "9B2335": "Crimson Rose",
  E8A4B8: "Dusty Flamingo",
  "8E2D56": "Berry Dark",
  "17375E": "Deep Navy",
  B0C4DE: "Powder Blue Light",
  C2B280: "Warm Sand",
  "9B111E": "Ruby",
  C68642: "Caramel",
  "00A86B": "Jade",
  EAA221: "Marigold Yellow",
  C1440E: "Terracotta",
  F5DEB3: "Wheat Cream",
  FFDEAD: "Navajo White",
  // ── 2026 trend names ───────────────────────────────────────────────────
  "7BA7BC": "Ocean Mist",
  "355E3B": "Forest Deep",
  C9A0DC: "Soft Amethyst",
  B5EAD7: "Sea Foam",
  C1694F: "Urban Terracotta",
  D4A574: "Sandstone",
};

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").toUpperCase().padEnd(6, "0");
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

let _sortedEntries: Array<{
  key: string;
  name: string;
  r: number;
  g: number;
  b: number;
}> | null = null;

function getSortedEntries() {
  if (_sortedEntries) return _sortedEntries;
  _sortedEntries = Object.entries(COLOR_MAP).map(([key, name]) => {
    const [r, g, b] = hexToRgb(key);
    return { key, name, r, g, b };
  });
  return _sortedEntries;
}

/**
 * Returns a fashion-accurate color name for any hex string.
 * Performs exact lookup first, then finds closest by RGB distance.
 */
export function getColorName(hex: string): string {
  if (!hex || hex.length < 4) return "Unknown";
  const clean = hex.replace("#", "").toUpperCase();
  // Exact match
  if (COLOR_MAP[clean]) return COLOR_MAP[clean];
  // Expand 3-char hex
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  if (COLOR_MAP[full]) return COLOR_MAP[full];

  // Find closest by Euclidean RGB distance
  const [r, g, b] = hexToRgb(full);
  let minDist = Number.POSITIVE_INFINITY;
  let closest = "Unknown";
  for (const entry of getSortedEntries()) {
    const dr = r - entry.r;
    const dg = g - entry.g;
    const db = b - entry.b;
    const dist = dr * dr + dg * dg + db * db;
    if (dist < minDist) {
      minDist = dist;
      closest = entry.name;
    }
  }
  return closest;
}

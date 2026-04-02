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
  // ── Extended fashion library ─────────────────────────────────────────────
  // Additional Reds & Pinks
  FF2400: "Scarlet",
  E0115F: "Ruby Red",
  C41E3A: "Cardinal Red",
  FC5A8D: "Strawberry Pink",
  F08080: "Salmon Pink",
  E88387: "Blush Red",
  FC8EAC: "Tickle Pink",
  FF7F7F: "Candy Pink",
  C875C4: "Fuchsia Pink",
  FD3A4A: "Neon Red",
  // Additional Oranges & Yellows
  FF7518: "Pumpkin Orange",
  FA5B3D: "Flame Orange",
  F28500: "Tangerine",
  FFCBA4: "Peach Blossom",
  FBCEB1: "Apricot",
  FFD1DC: "Pastel Pink",
  FDE8D8: "Powder Peach",
  F5C842: "Saffron Yellow",
  FADA5E: "Pastel Yellow",
  FFF44F: "Lemon Yellow",
  FDEE00: "Aureolin",
  E4D00A: "Citrine",
  // Additional Greens
  "93C572": "Pistachio",
  "80C080": "Laurel Green",
  B2D8B2: "Pastel Green",
  C5E8B0: "Tea Green",
  "5DBB63": "Meadow Green",
  "009473": "Persian Green",
  "4A7C59": "Hunter Green",
  "2D6A4F": "Bottle Green",
  "52B2BF": "Cerulean",
  "00827F": "Dark Teal",
  "3D9970": "Olive Green",
  "6DBF67": "Mantis Green",
  "1F8B1F": "Forest Fern",
  "556832": "Dark Moss",
  "8A9A5B": "Moss Green",
  // Additional Blues
  "002366": "Royal Navy",
  "0F52BA": "Sapphire Blue",
  "73C2FB": "Maya Blue",
  A2B5CD: "Light Steel Blue",
  B2DFEE: "Columbia Blue",
  "99C5C4": "Pale Teal",
  "7EB0D5": "Denim Light",
  "4F97A3": "Cyan Blue",
  "007791": "Deep Cerulean",
  "003366": "Dark Navy",
  "5B92E5": "Cornflower",
  "4E5D78": "Dark Slate",
  B9D9EB: "Pale Cornflower",
  // Additional Purples & Violets
  CF9FFF: "Pastel Purple",
  D8B4FE: "Lavender Mist",
  B57EDC: "Wisteria",
  "9678B6": "Soft Purple",
  "7851A9": "Royal Purple",
  "5A0FC8": "Electric Purple",
  C3B1E1: "Pastel Violet",
  CEB6E2: "Thistle Purple",
  AA98A9: "Lilac Grey",
  "614051": "Eggplant",
  "301934": "Dark Berry",
  // Additional Browns & Earth Tones
  E3963E: "Desert Sand",
  D4AC0D: "Antique Gold",
  C08040: "Autumn Brown",
  A07850: "Warm Toffee",
  "8B6914": "Dark Caramel",
  "7C4B00": "Sepia Brown",
  "5C3317": "Rustic Brown",
  D2955E: "Pastel Brown",
  F0C38E: "Sahara Sand",
  EBC880: "Golden Sand",
  BFA46F: "Warm Khaki",
  A08050: "Olive Brown",
  "704214": "Dark Umber",
  "4E2728": "Auburn",
  // Additional Neutrals & Fashion
  F5F0EB: "Warm Linen",
  EDE8E3: "Oatmeal",
  E8E0D5: "Parchment",
  D4CFC8: "Greige",
  C9C0B0: "Warm Taupe",
  B0A898: "Taupe",
  A09080: "Mushroom",
  "907060": "Warm Mocha",
  "786450": "Driftwood",
  "686050": "Earthen",
  F2EFE9: "Cream White",
  E8E3DA: "Warm Pearl",
  D6CFC5: "Antique Linen",
  C4BDB5: "Pastel Greige",
  // 2026 Extended Trend Names
  E8B4BE: "Dusty Mauve",
  C9AFA8: "Rose Ash",
  B5A8A0: "Warm Nude",
  "8FA89C": "Sage Mist",
  "7B9EA6": "Morning Fog",
  D4BFA0: "Desert Rose",
  E2C9B4: "Almond Cream",
  BED3C3: "Mint Whisper",
  A8C5B5: "Eucalyptus",
  "89AAA0": "Jade Mist",
  F0D9C8: "Blush Sand",
  E8C8A8: "Warm Apricot",
  D8B890: "Spiced Wheat",
  C8A878: "Cinnamon Latte",
  "4A4E5A": "Charcoal Blue",
  "3D4550": "Slate Indigo",
  "6B6F7E": "Steel Lavender",
  "2F4F4F": "Dark Slate Green",
  "556B73": "Smoky Teal",
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

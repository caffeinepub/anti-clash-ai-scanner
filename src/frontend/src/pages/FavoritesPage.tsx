import { Button } from "@/components/ui/button";
import { Copy, Download, Loader2, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { FavoriteColor } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddFavorite,
  useDeleteFavorite,
  useGetFavorites,
} from "../hooks/useQueries";

// ── Color helpers ────────────────────────────────────────────────────────────
function hexToHsl(hex: string): [number, number, number] {
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
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
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  const hNorm = ((h % 360) + 360) % 360;
  const sNorm = s / 100;
  const lNorm = l / 100;
  const a = sNorm * Math.min(lNorm, 1 - lNorm);
  const f = (n: number) => {
    const k = (n + hNorm / 30) % 12;
    const color = lNorm - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function colorName(hex: string): string {
  const [h, s, l] = hexToHsl(hex);
  if (s < 10) return l > 70 ? "Light Grey" : l < 30 ? "Charcoal" : "Grey";
  if (l > 90) return "Near White";
  if (l < 15) return "Near Black";
  const hue =
    h < 30
      ? "Red"
      : h < 60
        ? "Orange"
        : h < 90
          ? "Yellow"
          : h < 150
            ? "Green"
            : h < 210
              ? "Cyan"
              : h < 270
                ? "Blue"
                : h < 330
                  ? "Purple"
                  : "Pink";
  const light = l > 70 ? "Light " : l < 35 ? "Dark " : "";
  return `${light}${hue}`;
}

function generate10Colors(hex: string): Array<{ hex: string; name: string }> {
  const [h, s, l] = hexToHsl(hex);
  const safeS = Math.max(40, Math.min(80, s));
  const safeL = Math.max(35, Math.min(65, l));
  const offsets = [30, 60, 90, 120, 150, 180, 210, 240, 270, 300];
  return offsets.map((offset) => {
    const newH = (h + offset) % 360;
    const newHex = hslToHex(newH, safeS, safeL);
    return { hex: newHex, name: colorName(newHex) };
  });
}

// ── Style tips ────────────────────────────────────────────────────────────
const STYLE_TIPS = [
  "Earth tones pair beautifully with camel and rust — perfect for autumn layers.",
  "A monochromatic look in navy or slate feels effortlessly polished.",
  "White sneakers elevate any casual outfit by two notches.",
  "Tuck in your shirt on one side for an asymmetric, editorial touch.",
  "Accessorize with warm gold tones if your outfit leans cool.",
  "Never underestimate the power of a well-fitted white tee.",
  "Pair bold prints with solid neutrals to let one piece shine.",
  "Dark denim is your most versatile wardrobe friend.",
  "When mixing patterns, keep one scale large and one small.",
  "A structured bag instantly makes any outfit look more intentional.",
  "Olive green pairs with almost every skin tone and season.",
  "Colour-block with confidence: pick 2–3 complementary hues max.",
  "Wide-leg trousers balance an oversized top for a modern silhouette.",
  "Layer a longline cardigan over a slip dress for effortless chic.",
  "Terracotta is the new neutral — wear it head to toe.",
  "Invest in one statement jacket. It changes every outfit.",
  "Ankle boots work in every season — the true fashion constant.",
  "A silk scarf worn as a headband adds instant retro glam.",
  "Contrast stitching and tonal dressing both elevate basics equally.",
  "Your most-worn colour is your signature — own it completely.",
];

// ── Mood tags ────────────────────────────────────────────────────────────
const MOODS = ["Casual", "Formal", "Party", "Travel", "Sport"] as const;
type Mood = (typeof MOODS)[number];

// ── LocalStorage helpers ──────────────────────────────────────────────────
interface LocalPalette {
  id: string;
  hex: string;
  name: string;
  harmonyPalette: string;
  timestamp: number;
}

function loadLocalPalettes(key: string): LocalPalette[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function saveLocalPalettes(key: string, palettes: LocalPalette[]) {
  localStorage.setItem(key, JSON.stringify(palettes));
}

// ── Couple Combination Presets ────────────────────────────────────────────
const COUPLE_COMBINATIONS = [
  {
    id: 1,
    label: "Classic Romance",
    his: { hex: "#1a1a2e", name: "Midnight Navy" },
    hers: { hex: "#c9a0dc", name: "Lavender Mist" },
    occasions: ["date night", "anniversary", "dinner", "evening"],
  },
  {
    id: 2,
    label: "Beach Bliss",
    his: { hex: "#0077b6", name: "Ocean Blue" },
    hers: { hex: "#f4d58d", name: "Sandy Beige" },
    occasions: ["beach", "vacation", "outdoor", "travel", "holiday"],
  },
  {
    id: 3,
    label: "Wedding Harmony",
    his: { hex: "#2c3e50", name: "Charcoal" },
    hers: { hex: "#f5e6d3", name: "Champagne" },
    occasions: ["wedding", "formal", "reception", "ceremony"],
  },
  {
    id: 4,
    label: "Festival Glow",
    his: { hex: "#e63946", name: "Vibrant Red" },
    hers: { hex: "#f9c74f", name: "Golden Yellow" },
    occasions: [
      "festival",
      "celebration",
      "party",
      "cultural",
      "diwali",
      "holi",
    ],
  },
  {
    id: 5,
    label: "Earthy Harmony",
    his: { hex: "#6b4226", name: "Warm Brown" },
    hers: { hex: "#a8d5ba", name: "Sage Green" },
    occasions: ["outdoor", "picnic", "brunch", "casual", "travel"],
  },
  {
    id: 6,
    label: "Monochrome Elite",
    his: { hex: "#2d2d2d", name: "Jet Black" },
    hers: { hex: "#e8e8e8", name: "Soft White" },
    occasions: ["office", "corporate", "formal", "business", "gala"],
  },
  {
    id: 7,
    label: "Pastel Dreams",
    his: { hex: "#aec6cf", name: "Baby Blue" },
    hers: { hex: "#ffb7c5", name: "Blush Pink" },
    occasions: ["brunch", "spring", "garden", "birthday", "casual"],
  },
  {
    id: 8,
    label: "Jewel Tones",
    his: { hex: "#2e4057", name: "Deep Teal" },
    hers: { hex: "#9b2226", name: "Burgundy" },
    occasions: ["gala", "wedding", "anniversary", "formal", "theatre"],
  },
  {
    id: 9,
    label: "Sunset Vibes",
    his: { hex: "#e76f51", name: "Terracotta" },
    hers: { hex: "#ffd166", name: "Warm Amber" },
    occasions: ["sunset", "rooftop", "dinner", "date", "summer"],
  },
  {
    id: 10,
    label: "Ethnic Festive",
    his: { hex: "#800020", name: "Deep Maroon" },
    hers: { hex: "#d4af37", name: "Royal Gold" },
    occasions: ["wedding", "puja", "ethnic", "diwali", "sangeet", "reception"],
  },
];

// ── Notebook theme styles ──────────────────────────────────────────────────
const notebook = {
  page: {
    background: "#fdf8f0",
    backgroundImage:
      "repeating-linear-gradient(transparent, transparent 31px, #d4b896 31px, #d4b896 32px)",
    minHeight: "100vh",
  } as React.CSSProperties,
  marginLine: {
    borderLeft: "3px solid #e07070",
    paddingLeft: 14,
  } as React.CSSProperties,
  heading: {
    fontFamily: "Georgia, serif",
    color: "#5c3d1e",
    fontStyle: "italic",
  } as React.CSSProperties,
  card: {
    background: "#fffdf7",
    border: "1px solid #d4b896",
    borderRadius: 12,
    boxShadow: "2px 3px 8px rgba(140,100,40,0.10)",
  } as React.CSSProperties,
  accent: "#c47a2e",
};

// ── Saved palette card ────────────────────────────────────────────────────
function SavedCard({
  item,
  index,
  onDelete,
  isDeleting,
}: {
  item: FavoriteColor | LocalPalette;
  index: number;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  let palette: {
    complementary?: Array<{ hex: string; name: string }>;
    mood?: string;
  } | null = null;
  try {
    palette = JSON.parse(item.harmonyPalette);
  } catch (_) {}

  const ts =
    "timestamp" in item
      ? typeof item.timestamp === "bigint"
        ? Number(item.timestamp) / 1_000_000
        : (item.timestamp as number)
      : Date.now();
  const date = new Date(ts);
  const dateStr = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const complementary = palette?.complementary ?? [];
  // Normalize hex/name between FavoriteColor (item.color.*) and LocalPalette (item.*)
  const itemHex =
    "color" in item && typeof (item as any).color === "object"
      ? (item as any).color.hex
      : (item as any).hex;
  const itemName =
    "color" in item && typeof (item as any).color === "object"
      ? (item as any).color.name
      : (item as any).name;

  const shareColors = async () => {
    const count = complementary.length;
    const extra =
      count > 0 ? ` + ${count} matching shade${count !== 1 ? "s" : ""}` : "";
    const text = `🎨 My Colour Clash palette: ${itemName}${extra}. Discover yours at Colour Clash! #ColourClash #FashionPalette`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "My Colour Clash Palette", text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Palette link copied!");
      }
    } catch (_) {}
  };

  return (
    <motion.div
      style={notebook.card}
      className="overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      data-ocid={`favorites.item.${index + 1}`}
    >
      <div className="p-3">
        {/* Scanned colour — prominent */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-16 h-16 rounded-2xl flex-shrink-0"
            style={{
              backgroundColor: itemHex,
              boxShadow: `0 3px 10px ${itemHex}66`,
              border: "2px solid #d4b896",
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p
                className="font-semibold text-sm"
                style={{ color: "#5c3d1e", fontFamily: "Georgia, serif" }}
              >
                {itemName}
              </p>
              {palette?.mood && (
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: "#f0e8d8", color: notebook.accent }}
                >
                  {palette.mood}
                </span>
              )}
            </div>
            <p className="text-xs font-mono" style={{ color: notebook.accent }}>
              {itemHex}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#9c7a58" }}>
              {dateStr}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={shareColors}
              className="text-xs px-2 py-1 rounded-lg"
              style={{
                background: notebook.accent,
                color: "#fff",
                fontFamily: "Georgia, serif",
              }}
              title="Share palette"
              data-ocid={`favorites.secondary_button.${index + 1}`}
            >
              Share
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(item.id)}
              disabled={isDeleting}
              className="flex-shrink-0"
              style={{ color: "#b05a5a" }}
              data-ocid={`favorites.delete_button.${index + 1}`}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Complementary colours — full visibility */}
        {complementary.length > 0 && (
          <div>
            <p
              className="text-[10px] mb-2"
              style={{ color: "#9c7a58", fontStyle: "italic" }}
            >
              Saved combinations:
            </p>
            <div className="flex flex-wrap gap-2">
              {complementary.map((c) => (
                <div key={c.hex} className="flex flex-col items-center gap-0.5">
                  <div
                    className="w-10 h-10 rounded-xl"
                    style={{
                      backgroundColor: c.hex,
                      border: "1.5px solid #d4b896",
                      boxShadow: `0 1px 4px ${c.hex}44`,
                    }}
                    title={c.name}
                  />
                  <span
                    className="text-[8px] font-mono text-center leading-tight"
                    style={{ color: "#9c7a58", maxWidth: 40 }}
                  >
                    {c.hex.toUpperCase()}
                  </span>
                  <span
                    className="text-[7px] text-center leading-tight"
                    style={{ color: "#b89a6a", maxWidth: 40 }}
                  >
                    {c.name.split(" ").slice(-1)[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

// ── Saved Looks Tab ──────────────────────────────────────────────────────────
interface SavedLook {
  id: number;
  savedAt: string;
  title: string;
  hairstyle: string;
  top: { label: string; color: string; hex: string };
  bottom: { label: string; color: string; hex: string };
  shoes: { label: string; color: string; hex: string };
  accessory: { label: string; color: string; hex: string };
  bag?: { label: string; color: string; hex: string };
}

function SavedLooksTab() {
  const [looks, setLooks] = useState<SavedLook[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("cc_saved_looks") || "[]");
    } catch {
      return [];
    }
  });

  const handleDelete = (id: number) => {
    const updated = looks.filter((l) => l.id !== id);
    localStorage.setItem("cc_saved_looks", JSON.stringify(updated));
    setLooks(updated);
    toast.success("Look removed from Favourites");
  };

  if (looks.length === 0) {
    return (
      <div
        className="text-center py-12"
        style={{ color: "#9c7a58" }}
        data-ocid="favorites.empty_state"
      >
        <p className="text-4xl mb-3">💅</p>
        <p
          className="text-sm"
          style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}
        >
          No saved looks yet.
        </p>
        <p className="text-xs mt-1">
          Scan a colour on the Home tab and save a complete look!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-ocid="favorites.list">
      {looks.map((look, index) => {
        const items = [
          {
            emoji: "👕",
            label: look.top.label,
            color: look.top.color,
            hex: look.top.hex,
          },
          {
            emoji: "👖",
            label: look.bottom.label,
            color: look.bottom.color,
            hex: look.bottom.hex,
          },
          {
            emoji: "👟",
            label: look.shoes.label,
            color: look.shoes.color,
            hex: look.shoes.hex,
          },
          {
            emoji: "⌚",
            label: look.accessory.label,
            color: look.accessory.color,
            hex: look.accessory.hex,
          },
          ...(look.bag
            ? [
                {
                  emoji: "👜",
                  label: look.bag.label,
                  color: look.bag.color,
                  hex: look.bag.hex,
                },
              ]
            : []),
        ];
        return (
          <motion.div
            key={look.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ delay: index * 0.06 }}
            style={{
              ...notebook.card,
              borderLeft: `4px solid ${notebook.accent}`,
            }}
            className="relative"
            data-ocid={`favorites.item.${index + 1}`}
          >
            <button
              type="button"
              onClick={() => handleDelete(look.id)}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-red-100"
              aria-label="Delete look"
              data-ocid={`favorites.delete_button.${index + 1}`}
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
            <p
              className="font-bold text-sm mb-1"
              style={{ color: notebook.accent }}
            >
              {look.title}
            </p>
            <p
              className="text-xs mb-2"
              style={{ color: "#9c7a58", fontStyle: "italic" }}
            >
              💇 {look.hairstyle}
            </p>
            <div className="flex flex-col gap-1.5">
              {items.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 text-xs"
                >
                  <span>{item.emoji}</span>
                  <span style={{ color: "#9c7a58" }} className="flex-1">
                    {item.label}
                  </span>
                  <span
                    className="font-medium"
                    style={{ color: notebook.accent }}
                  >
                    {item.color}
                  </span>
                  {item.hex && (
                    <div
                      className="w-4 h-4 rounded-full border border-white/30 flex-shrink-0"
                      style={{ background: item.hex }}
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs mt-2" style={{ color: "#bca88a" }}>
              Saved {new Date(look.savedAt).toLocaleDateString()}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Style DNA Report ─────────────────────────────────────────────────────
interface StyleDNAProfile {
  type: string;
  emoji: string;
  tagline: string;
  gradientFrom: string;
  gradientTo: string;
  dimensions: { label: string; pct: number; color: string }[];
}

function analyzeStyleDNA(allHexes: string[]): StyleDNAProfile {
  if (allHexes.length === 0) {
    return {
      type: "Style Explorer",
      emoji: "🌟",
      tagline: "Scan more outfits to reveal your style DNA!",
      gradientFrom: "#9966cc",
      gradientTo: "#483d8b",
      dimensions: [],
    };
  }
  const counts = { earthy: 0, bold: 0, cool: 0, green: 0, purple: 0, mono: 0 };
  for (const hex of allHexes) {
    const [h, s, _l] = hexToHsl(hex);
    if (s < 10) {
      counts.mono++;
      continue;
    }
    if ((h >= 20 && h < 60) || s < 20) {
      counts.earthy++;
      continue;
    }
    if ((h < 20 || h >= 340) && s > 40) {
      counts.bold++;
      continue;
    }
    if (h >= 180 && h < 260) {
      counts.cool++;
      continue;
    }
    if (h >= 80 && h < 160) {
      counts.green++;
      continue;
    }
    if (h >= 280 && h < 340) {
      counts.purple++;
      continue;
    }
    counts.earthy++;
  }

  const total = allHexes.length || 1;
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];

  const profiles: Record<string, StyleDNAProfile> = {
    earthy: {
      type: "Warm Earth Toner",
      emoji: "🌾",
      tagline:
        "Grounded, timeless, and effortlessly natural — earth tones are your signature.",
      gradientFrom: "#C68642",
      gradientTo: "#6b4226",
      dimensions: [
        {
          label: "Earthy",
          pct: Math.round((counts.earthy / total) * 100),
          color: "#C68642",
        },
        {
          label: "Bold",
          pct: Math.round((counts.bold / total) * 100),
          color: "#DC143C",
        },
        {
          label: "Cool",
          pct: Math.round((counts.cool / total) * 100),
          color: "#0047AB",
        },
      ],
    },
    bold: {
      type: "Bold Statement Maker",
      emoji: "🔥",
      tagline:
        "Fearless and vibrant — your style speaks before you say a word.",
      gradientFrom: "#DC143C",
      gradientTo: "#8B0000",
      dimensions: [
        {
          label: "Bold",
          pct: Math.round((counts.bold / total) * 100),
          color: "#DC143C",
        },
        {
          label: "Earthy",
          pct: Math.round((counts.earthy / total) * 100),
          color: "#C68642",
        },
        {
          label: "Cool",
          pct: Math.round((counts.cool / total) * 100),
          color: "#0047AB",
        },
      ],
    },
    cool: {
      type: "Cool Minimalist",
      emoji: "❄️",
      tagline:
        "Clean, calm, and perfectly composed — blue tones radiate quiet confidence.",
      gradientFrom: "#0047AB",
      gradientTo: "#000080",
      dimensions: [
        {
          label: "Cool",
          pct: Math.round((counts.cool / total) * 100),
          color: "#0047AB",
        },
        {
          label: "Neutral",
          pct: Math.round((counts.mono / total) * 100),
          color: "#808080",
        },
        {
          label: "Bold",
          pct: Math.round((counts.bold / total) * 100),
          color: "#DC143C",
        },
      ],
    },
    green: {
      type: "Nature Forward",
      emoji: "🌿",
      tagline:
        "Organic, fresh, and ahead of the curve — nature is your palette.",
      gradientFrom: "#228B22",
      gradientTo: "#355E3B",
      dimensions: [
        {
          label: "Nature",
          pct: Math.round((counts.green / total) * 100),
          color: "#228B22",
        },
        {
          label: "Earthy",
          pct: Math.round((counts.earthy / total) * 100),
          color: "#C68642",
        },
        {
          label: "Bold",
          pct: Math.round((counts.bold / total) * 100),
          color: "#DC143C",
        },
      ],
    },
    purple: {
      type: "Pastel Dreamer",
      emoji: "💜",
      tagline:
        "Soft, dreamy, and romantically expressive — pastels and purples are your world.",
      gradientFrom: "#9B2335",
      gradientTo: "#C8A2C8",
      dimensions: [
        {
          label: "Purple/Pink",
          pct: Math.round((counts.purple / total) * 100),
          color: "#DDA0DD",
        },
        {
          label: "Soft",
          pct: Math.round((counts.earthy / total) * 100),
          color: "#DCAE96",
        },
        {
          label: "Cool",
          pct: Math.round((counts.cool / total) * 100),
          color: "#0047AB",
        },
      ],
    },
    mono: {
      type: "Monochrome Master",
      emoji: "🖤",
      tagline: "Effortlessly sleek — you know that less is always more.",
      gradientFrom: "#2d2d2d",
      gradientTo: "#6b6b6b",
      dimensions: [
        {
          label: "Neutral",
          pct: Math.round((counts.mono / total) * 100),
          color: "#808080",
        },
        {
          label: "Earthy",
          pct: Math.round((counts.earthy / total) * 100),
          color: "#C68642",
        },
        {
          label: "Bold",
          pct: Math.round((counts.bold / total) * 100),
          color: "#DC143C",
        },
      ],
    },
  };

  return (
    profiles[dominant] ?? {
      type: "Eclectic Trendsetter",
      emoji: "🎨",
      tagline: "Unpredictable and exciting — your style defies every category.",
      gradientFrom: "#9966cc",
      gradientTo: "#DC143C",
      dimensions: [
        { label: "Bold", pct: 35, color: "#DC143C" },
        { label: "Cool", pct: 30, color: "#0047AB" },
        { label: "Earthy", pct: 35, color: "#C68642" },
      ],
    }
  );
}

function StyleDNACard() {
  const [dna, setDna] = useState<StyleDNAProfile | null>(null);
  const [topColors, setTopColors] = useState<string[]>([]);
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    const lookbook = (() => {
      try {
        return JSON.parse(localStorage.getItem("cc_lookbook") || "[]");
      } catch {
        return [];
      }
    })();
    const palettes = (() => {
      try {
        return JSON.parse(localStorage.getItem("cc_favourites") || "[]");
      } catch {
        return [];
      }
    })();

    const allHexes: string[] = [];
    for (const e of lookbook) {
      if (e.result?.primaryColor) allHexes.push(e.result.primaryColor);
    }
    for (const p of palettes) {
      if (p.hex) allHexes.push(p.hex);
    }

    const has = allHexes.length >= 1;
    setHasHistory(has);
    if (has) {
      setTopColors(allHexes.slice(0, 5));
      setDna(analyzeStyleDNA(allHexes));
    }
  }, []);

  const handleShare = async () => {
    if (!dna) return;
    const profileName = (() => {
      try {
        const p = JSON.parse(localStorage.getItem("cc_profile") || "{}");
        return p.name || "";
      } catch {
        return "";
      }
    })();

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 500;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const grad = ctx.createLinearGradient(0, 0, 800, 500);
      grad.addColorStop(0, dna.gradientFrom);
      grad.addColorStop(1, dna.gradientTo);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 500);

      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(0, 0, 800, 500);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "center";
      ctx.fillText("MY STYLE DNA", 400, 50);

      ctx.font = "64px Arial";
      ctx.fillText(dna.emoji, 400, 120);

      ctx.font = "bold 36px Arial";
      ctx.fillText(dna.type, 400, 165);

      if (profileName) {
        ctx.font = "18px Arial";
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fillText(`${profileName}'s Style`, 400, 195);
      }

      // Top colors
      const startX = 400 - (topColors.length * 35) / 2;
      for (let i = 0; i < topColors.length; i++) {
        ctx.beginPath();
        ctx.arc(startX + i * 35 + 17, 250, 16, 0, Math.PI * 2);
        ctx.fillStyle = topColors[i];
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "16px Arial";
      ctx.fillText(dna.tagline, 400, 310);

      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 20px Arial";
      ctx.fillText("COLOUR CLASH", 400, 380);
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "14px Arial";
      ctx.fillText("colourclash-emb.caffeine.xyz", 400, 405);

      const caption = `I'm a ${dna.type} ${dna.emoji} according to Colour Clash AI! What's your style DNA? Scan to find out! #ColourClash #StyleDNA`;

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "style-dna.png";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Style DNA card downloaded!");
        navigator.clipboard.writeText(caption).catch(() => {});
      }, "image/png");
    } catch {
      toast.error("Could not generate DNA card");
    }
  };

  if (!hasHistory) {
    return (
      <div
        style={{
          background: "linear-gradient(135deg, #9966cc22, #483d8b11)",
          border: "1px dashed #9966cc44",
          borderRadius: 16,
          padding: "16px",
          marginBottom: 20,
          textAlign: "center",
        }}
      >
        <p className="text-2xl mb-2">🧬</p>
        <p className="text-sm font-semibold" style={{ color: "#9966cc" }}>
          Unlock Your Style DNA
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Scan 3+ outfits and save palettes to reveal your personal style
          archetype
        </p>
      </div>
    );
  }

  if (!dna) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 340, damping: 28 }}
      style={{
        background: `linear-gradient(135deg, ${dna.gradientFrom}dd, ${dna.gradientTo}cc)`,
        borderRadius: 20,
        padding: "16px",
        marginBottom: 20,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow */}
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
          pointerEvents: "none",
        }}
      />
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-white/60 mb-0.5">
            🧬 Your Style DNA
          </p>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{dna.emoji}</span>
            <p className="text-xl font-black text-white">{dna.type}</p>
          </div>
          <p className="text-xs text-white/70 mt-1 leading-relaxed max-w-[220px]">
            {dna.tagline}
          </p>
        </div>
        <button
          type="button"
          onClick={handleShare}
          className="flex flex-col items-center gap-1 mt-1"
          data-ocid="favorites.secondary_button"
        >
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
            <span className="text-base">📤</span>
          </div>
          <span className="text-[9px] text-white/60 font-bold">Share DNA</span>
        </button>
      </div>

      {/* Top colors */}
      {topColors.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] text-white/60 font-bold uppercase tracking-wider">
            Your colours
          </span>
          <div className="flex gap-1.5">
            {topColors.map((hex, _i) => (
              <div
                key={hex}
                className="w-6 h-6 rounded-full border-2 border-white/30 shadow-sm"
                style={{ backgroundColor: hex }}
                title={hex}
              />
            ))}
          </div>
        </div>
      )}

      {/* Dimension bars */}
      {dna.dimensions.length > 0 && (
        <div className="space-y-1.5">
          {dna.dimensions.map((dim) => (
            <div key={dim.label} className="flex items-center gap-2">
              <span className="text-[10px] text-white/70 w-20 flex-shrink-0">
                {dim.label}
              </span>
              <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${dim.pct}%` }}
                  transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
                  style={{
                    height: "100%",
                    borderRadius: 99,
                    backgroundColor: dim.color,
                  }}
                />
              </div>
              <span className="text-[10px] text-white/60 w-8 text-right">
                {dim.pct}%
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Creamy card style helper ──────────────────────────────────────────────
const creamyCard = {
  background: "rgba(255,255,255,0.40)",
  backdropFilter: "blur(25px) saturate(180%)",
  WebkitBackdropFilter: "blur(25px) saturate(180%)",
  borderRadius: "28px",
  border: "1.5px solid rgba(255,255,255,0.15)",
  boxShadow: "0 10px 40px rgba(180,160,140,0.12)",
};

// ─── Color Personality Quiz ───────────────────────────────────────────────
const QUIZ_ROUNDS = [
  {
    round: 1,
    q: "Which colour speaks to you?",
    a: { color: "#F5C842", name: "Golden", label: "Warm & Golden" },
    b: { color: "#4A90D9", name: "Ocean Blue", label: "Cool & Ocean" },
  },
  {
    round: 2,
    q: "Pick your vibe:",
    a: { color: "#C8B9A2", name: "Linen", label: "Soft Linen" },
    b: { color: "#E8472A", name: "Coral", label: "Vivid Coral" },
  },
  {
    round: 3,
    q: "Your signature shade:",
    a: { color: "#1A1A2E", name: "Midnight", label: "Deep Midnight" },
    b: { color: "#F0EEE4", name: "Ivory", label: "Pure Ivory" },
  },
];

const PERSONALITY_MAP: Record<
  string,
  { name: string; emoji: string; desc: string; colors: string[] }
> = {
  WWW: {
    name: "Classic Minimalist",
    emoji: "🤍",
    desc: "You love clean, timeless elegance. Every piece you wear is intentional and refined.",
    colors: ["#F5C842", "#C8B9A2", "#1A1A2E"],
  },
  WWC: {
    name: "Soft Romantic",
    emoji: "🌸",
    desc: "Warm and approachable, you choose comfort over chaos. Softness is your superpower.",
    colors: ["#F5C842", "#C8B9A2", "#F0EEE4"],
  },
  WCW: {
    name: "Urban Explorer",
    emoji: "🏙️",
    desc: "You balance neutrals with unexpected pops. City streets are your runway.",
    colors: ["#F5C842", "#E8472A", "#1A1A2E"],
  },
  WCC: {
    name: "Boho Spirit",
    emoji: "🌻",
    desc: "Free-flowing, earthy, naturally stylish. You dress like you have somewhere magical to be.",
    colors: ["#F5C842", "#E8472A", "#F0EEE4"],
  },
  CWW: {
    name: "Bold Visionary",
    emoji: "🔥",
    desc: "You lead with colour and command attention. No muted tones allowed.",
    colors: ["#4A90D9", "#C8B9A2", "#1A1A2E"],
  },
  CWC: {
    name: "Dark Romantic",
    emoji: "🖤",
    desc: "Mysterious, intense, deeply expressive. You find beauty in the shadows.",
    colors: ["#4A90D9", "#C8B9A2", "#F0EEE4"],
  },
  CCW: {
    name: "Street Icon",
    emoji: "🧢",
    desc: "Edgy, trend-forward, you set the rules. Others follow your style.",
    colors: ["#4A90D9", "#E8472A", "#1A1A2E"],
  },
  CCC: {
    name: "Maximalist",
    emoji: "💥",
    desc: "More is more. You are the look. Every outfit is a statement.",
    colors: ["#4A90D9", "#E8472A", "#F0EEE4"],
  },
};

function ColorPersonalityQuiz() {
  const stored = (() => {
    try {
      return JSON.parse(localStorage.getItem("cc_color_personality") || "null");
    } catch {
      return null;
    }
  })();
  const [picks, setPicks] = useState<string[]>([]);
  const [result, setResult] = useState<(typeof PERSONALITY_MAP)[string] | null>(
    stored,
  );
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [sharing, setSharing] = useState(false);

  const currentRound = picks.length;
  const done = picks.length === 3;

  const pick = (choice: "W" | "C") => {
    const newPicks = [...picks, choice];
    setPicks(newPicks);
    if (newPicks.length === 3) {
      const key = newPicks.join("");
      const p = PERSONALITY_MAP[key] ?? PERSONALITY_MAP.CCC;
      setResult(p);
      localStorage.setItem("cc_color_personality", JSON.stringify(p));
    }
  };

  const reset = () => {
    setPicks([]);
    setResult(null);
    setShareImageUrl(null);
    localStorage.removeItem("cc_color_personality");
  };

  const buildShareCard = async () => {
    if (!result) return;
    setSharing(true);
    try {
      const W = 800;
      const H = 900;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Background
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, "#0d0d1a");
      bg.addColorStop(1, "#1a0d2e");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Top label
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = "bold 20px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("YOUR COLOUR PERSONALITY", W / 2, 60);

      // Emoji
      ctx.font = "80px system-ui";
      ctx.fillText(result.emoji, W / 2, 170);

      // Personality name
      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 52px system-ui";
      ctx.fillText(result.name, W / 2, 260);

      // Description (wrapped)
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "22px system-ui";
      const words = result.desc.split(" ");
      const lines: string[] = [];
      let line = "";
      for (const w of words) {
        const t = line ? `${line} ${w}` : w;
        if (ctx.measureText(t).width > 680 && line) {
          lines.push(line);
          line = w;
        } else line = t;
      }
      if (line) lines.push(line);
      lines.forEach((l, i) => ctx.fillText(l, W / 2, 330 + i * 34));

      // Color swatches
      const swatchY = 500;
      result.colors.forEach((c, i) => {
        const sx = W / 2 - 120 + i * 120;
        ctx.beginPath();
        ctx.arc(sx, swatchY, 44, 0, Math.PI * 2);
        ctx.fillStyle = c;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 3;
        ctx.stroke();
      });

      // Divider
      ctx.fillStyle = "rgba(255,215,0,0.25)";
      ctx.fillRect(60, 580, W - 120, 1);

      // Branding
      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 26px system-ui";
      ctx.fillText("COLOUR CLASH", W / 2, 640);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "16px system-ui";
      ctx.fillText("colourclash-emb.caffeine.xyz", W / 2, 672);

      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "15px system-ui";
      ctx.fillText(
        "What's your colour personality? Scan to find out! 🎨",
        W / 2,
        710,
      );

      const caption = `I'm a ${result.name} ${result.emoji} according to Colour Clash! What's your colour personality? Find out at https://colourclash-emb.caffeine.xyz/ #ColourClash #ColourPersonality`;

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setSharing(false);
          return;
        }
        const url = URL.createObjectURL(blob);
        setShareImageUrl(url);
        const file = new File([blob], "colour-personality.png", {
          type: "image/png",
        });
        if (navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: "My Colour Personality",
              text: caption,
            });
            setSharing(false);
            return;
          } catch {
            /* fallthrough */
          }
        }
        setShowModal(true);
        setSharing(false);
      }, "image/png");
    } catch {
      toast.error("Could not build personality card");
      setSharing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      style={{ ...creamyCard, marginBottom: 20, padding: 20 }}
      data-ocid="favorites.card"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🎨</span>
        <div>
          <p className="text-sm font-bold" style={{ color: "#3d2a0e" }}>
            Colour Personality Quiz
          </p>
          <p className="text-xs" style={{ color: "#9c7a58" }}>
            3 rounds · discover your style type
          </p>
        </div>
      </div>

      {!done ? (
        <div>
          <p
            className="text-xs font-semibold mb-1"
            style={{ color: "#9c7a58" }}
          >
            Round {currentRound + 1} of 3
          </p>
          <div className="w-full bg-amber-100/50 rounded-full h-1.5 mb-4">
            <div
              className="h-1.5 rounded-full transition-all"
              style={{
                width: `${(currentRound / 3) * 100}%`,
                background: "#c47a2e",
              }}
            />
          </div>
          <p
            className="text-sm font-semibold mb-4 text-center"
            style={{ color: "#3d2a0e" }}
          >
            {QUIZ_ROUNDS[currentRound].q}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {(["a", "b"] as const).map((side) => {
              const opt = QUIZ_ROUNDS[currentRound][side];
              return (
                <button
                  key={side}
                  type="button"
                  onClick={() => pick(side === "a" ? "W" : "C")}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all active:scale-95"
                  style={{
                    borderColor: opt.color,
                    background: `${opt.color}22`,
                  }}
                  data-ocid="favorites.toggle"
                >
                  <div
                    className="w-14 h-14 rounded-full shadow-lg"
                    style={{
                      background: opt.color,
                      border: `3px solid ${opt.color}`,
                    }}
                  />
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "#3d2a0e" }}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : result ? (
        <div className="text-center">
          <div className="text-5xl mb-2">{result.emoji}</div>
          <p className="text-xl font-black mb-1" style={{ color: "#3d2a0e" }}>
            {result.name}
          </p>
          <p
            className="text-xs mb-4 leading-relaxed"
            style={{ color: "#9c7a58" }}
          >
            {result.desc}
          </p>
          <div className="flex justify-center gap-3 mb-4">
            {result.colors.map((c) => (
              <div
                key={c}
                className="w-10 h-10 rounded-full shadow-md border-2"
                style={{ background: c, borderColor: "rgba(255,255,255,0.6)" }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={buildShareCard}
              disabled={sharing}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
              style={{ background: "#c47a2e" }}
              data-ocid="favorites.primary_button"
            >
              {sharing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />{" "}
                  Generating...
                </>
              ) : (
                "✨ Share My Personality"
              )}
            </button>
            <button
              type="button"
              onClick={reset}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border"
              style={{ borderColor: "#d4b896", color: "#9c7a58" }}
              data-ocid="favorites.secondary_button"
            >
              Retake
            </button>
          </div>
          {shareImageUrl && (
            <div className="mt-3 rounded-xl overflow-hidden border border-amber-200/40">
              <img
                src={shareImageUrl}
                alt="Personality card"
                className="w-full object-contain"
              />
            </div>
          )}
        </div>
      ) : null}

      {/* Share modal */}
      <AnimatePresence>
        {showModal && shareImageUrl && result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setShowModal(false)}
            data-ocid="favorites.modal"
          >
            <div
              className="w-full max-w-sm bg-background rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <div
                className="w-full bg-black flex items-center justify-center"
                style={{ maxHeight: "50vh", overflow: "hidden" }}
              >
                <img
                  src={shareImageUrl}
                  alt="Personality card"
                  className="w-full object-contain"
                  style={{ maxHeight: "50vh" }}
                />
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = shareImageUrl;
                      a.download = "colour-personality.png";
                      a.click();
                      toast.success("Downloaded!");
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
                    data-ocid="favorites.secondary_button"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const caption = `I'm a ${result.name} ${result.emoji} according to Colour Clash! What's your colour personality? https://colourclash-emb.caffeine.xyz/ #ColourClash`;
                      navigator.clipboard
                        .writeText(caption)
                        .then(() => toast.success("Copied!"))
                        .catch(() => {});
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-muted text-foreground text-sm font-semibold"
                    data-ocid="favorites.secondary_button"
                  >
                    <Copy className="w-4 h-4" /> Copy Caption
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full py-2 rounded-xl bg-muted text-sm font-medium text-muted-foreground"
                  data-ocid="favorites.close_button"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Outfit Repeat Tracker ────────────────────────────────────────────────
interface LBEntry {
  score: number;
  date: string;
  result?: { dominantColor?: string } | null;
}
function getLookbookFav(): LBEntry[] {
  try {
    const raw = localStorage.getItem("cc_lookbook");
    return raw ? (JSON.parse(raw) as LBEntry[]) : [];
  } catch {
    return [];
  }
}

function OutfitRepeatTracker() {
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [sharing, setSharing] = useState(false);

  const entries = getLookbookFav();

  if (entries.length < 2) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ ...creamyCard, marginBottom: 20, padding: 20 }}
        data-ocid="favorites.card"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🔄</span>
          <div>
            <p className="text-sm font-bold" style={{ color: "#3d2a0e" }}>
              Outfit Repeat Tracker
            </p>
            <p className="text-xs" style={{ color: "#9c7a58" }}>
              Track your go-to colours
            </p>
          </div>
        </div>
        <p
          className="text-xs text-center py-6"
          style={{ color: "#9c7a58", fontStyle: "italic" }}
        >
          Scan more outfits to unlock your Repeat Tracker! 🎨
        </p>
      </motion.div>
    );
  }

  // Gather color names from entries
  const colorCounts: Record<string, number> = {};
  for (const e of entries) {
    const c = e.result?.dominantColor ?? "Unknown";
    colorCounts[c] = (colorCounts[c] ?? 0) + 1;
  }
  const sorted = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
  const topColors = sorted.slice(0, 3);
  const mostWorn = topColors[0]?.[0] ?? "Unknown";
  const mostWornCount = topColors[0]?.[1] ?? 0;
  const uniqueCount = Object.keys(colorCounts).length;
  const hasRepeat = mostWornCount >= 3;
  const badge = hasRepeat
    ? "Repeat Offender 🔄"
    : "Fresh Look ✨ — You never repeat!";

  // Helper: color hex from name (rough)
  const nameToHex = (name: string) => {
    const map: Record<string, string> = {
      "Sky Blue": "#87CEEB",
      "Navy Blue": "#000080",
      White: "#FFFFFF",
      Black: "#0d0d1a",
      Crimson: "#DC143C",
      Maroon: "#800000",
      "Sage Green": "#8FBC8F",
      Olive: "#808000",
      Unknown: "#C8B9A2",
    };
    return (
      map[name] ??
      `#${Math.abs(
        name.split("").reduce((a, c) => a * 31 + c.charCodeAt(0), 0) % 0xffffff,
      )
        .toString(16)
        .padStart(6, "8")}`
    );
  };

  const buildShareCard = async () => {
    setSharing(true);
    try {
      const W = 800;
      const H = 600;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, "#0a0a1a");
      bg.addColorStop(1, "#1a120a");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#FFD700";
      ctx.fillRect(0, 0, W, 5);

      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = "bold 22px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("MY OUTFIT TRACKER", W / 2, 56);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 42px system-ui";
      ctx.fillText(`${uniqueCount} unique colour combos`, W / 2, 120);

      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "22px system-ui";
      ctx.fillText(`Most worn: ${mostWorn}`, W / 2, 165);

      // 3 color circles
      topColors.forEach(([name], i) => {
        const cx = W / 2 - 120 + i * 120;
        const cy = 260;
        ctx.beginPath();
        ctx.arc(cx, cy, 44, 0, Math.PI * 2);
        ctx.fillStyle = nameToHex(name);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "13px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(name.slice(0, 12), cx, cy + 62);
      });

      // Badge
      ctx.fillStyle = hasRepeat ? "#E8472A" : "#22c55e";
      const bw = ctx.measureText(badge).width + 40;
      ctx.beginPath();
      ctx.roundRect(W / 2 - bw / 2, 360, bw, 44, 22);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 18px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(badge, W / 2, 387);

      // Branding
      ctx.fillStyle = "rgba(0,0,0,0.75)";
      ctx.fillRect(0, H - 50, W, 50);
      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 18px system-ui";
      ctx.textAlign = "left";
      ctx.fillText("COLOUR CLASH", 24, H - 18);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = "13px system-ui";
      ctx.textAlign = "right";
      ctx.fillText("colourclash-emb.caffeine.xyz", W - 24, H - 18);

      const caption = `I've worn ${uniqueCount} unique colour combos! My go-to is ${mostWorn}. ${badge} — Check my style report on Colour Clash! #ColourClash

https://colourclash-emb.caffeine.xyz/`;

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setSharing(false);
          return;
        }
        const url = URL.createObjectURL(blob);
        setShareImageUrl(url);
        const file = new File([blob], "outfit-tracker.png", {
          type: "image/png",
        });
        if (navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: "My Outfit Tracker",
              text: caption,
            });
            setSharing(false);
            return;
          } catch {
            /* fallthrough */
          }
        }
        setShowModal(true);
        setSharing(false);
      }, "image/png");
    } catch {
      toast.error("Could not build tracker card");
      setSharing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ ...creamyCard, marginBottom: 20, padding: 20 }}
      data-ocid="favorites.card"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🔄</span>
        <div>
          <p className="text-sm font-bold" style={{ color: "#3d2a0e" }}>
            Outfit Repeat Tracker
          </p>
          <p className="text-xs" style={{ color: "#9c7a58" }}>
            Your colour wearing patterns
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div
          className="rounded-2xl p-3 text-center"
          style={{ background: "rgba(196,122,46,0.12)" }}
        >
          <p className="text-2xl font-black" style={{ color: "#c47a2e" }}>
            {uniqueCount}
          </p>
          <p className="text-[10px]" style={{ color: "#9c7a58" }}>
            Unique Combos
          </p>
        </div>
        <div
          className="rounded-2xl p-3 text-center"
          style={{ background: "rgba(196,122,46,0.12)" }}
        >
          <p
            className="text-sm font-bold truncate"
            style={{ color: "#c47a2e" }}
          >
            {mostWorn}
          </p>
          <p className="text-[10px]" style={{ color: "#9c7a58" }}>
            Most Worn Color
          </p>
        </div>
      </div>

      {topColors.length > 0 && (
        <div className="flex justify-center gap-4 mb-4">
          {topColors.map(([name]) => (
            <div key={name} className="flex flex-col items-center gap-1">
              <div
                className="w-10 h-10 rounded-full shadow border-2"
                style={{
                  background: nameToHex(name),
                  borderColor: "rgba(255,255,255,0.5)",
                }}
              />
              <span
                className="text-[9px] text-center max-w-[52px] truncate"
                style={{ color: "#9c7a58" }}
              >
                {name}
              </span>
            </div>
          ))}
        </div>
      )}

      <div
        className="text-center rounded-xl py-2 mb-4 text-xs font-bold"
        style={{
          background: hasRepeat
            ? "rgba(232,71,42,0.15)"
            : "rgba(34,197,94,0.15)",
          color: hasRepeat ? "#E8472A" : "#16a34a",
        }}
      >
        {badge}
      </div>

      <button
        type="button"
        onClick={buildShareCard}
        disabled={sharing}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
        style={{ background: "#c47a2e" }}
        data-ocid="favorites.primary_button"
      >
        {sharing ? (
          <>
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />{" "}
            Generating...
          </>
        ) : (
          "📊 Share My Style Report"
        )}
      </button>

      {shareImageUrl && (
        <div className="mt-3 rounded-xl overflow-hidden border border-amber-200/40">
          <img
            src={shareImageUrl}
            alt="Tracker report"
            className="w-full object-contain"
          />
        </div>
      )}

      {/* Share modal */}
      <AnimatePresence>
        {showModal && shareImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setShowModal(false)}
            data-ocid="favorites.modal"
          >
            <div
              className="w-full max-w-sm bg-background rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <div
                className="w-full bg-black flex items-center justify-center"
                style={{ maxHeight: "45vh", overflow: "hidden" }}
              >
                <img
                  src={shareImageUrl}
                  alt="Tracker"
                  className="w-full object-contain"
                  style={{ maxHeight: "45vh" }}
                />
              </div>
              <div className="p-4 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = shareImageUrl!;
                      a.download = "outfit-tracker.png";
                      a.click();
                      toast.success("Downloaded!");
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
                    data-ocid="favorites.secondary_button"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard
                        .writeText(
                          `I've worn ${uniqueCount} unique colour combos! My go-to is ${mostWorn}. #ColourClash https://colourclash-emb.caffeine.xyz/`,
                        )
                        .then(() => toast.success("Copied!"))
                        .catch(() => {});
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-muted text-foreground text-sm font-semibold"
                    data-ocid="favorites.secondary_button"
                  >
                    <Copy className="w-4 h-4" /> Copy Caption
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full py-2 rounded-xl bg-muted text-sm font-medium text-muted-foreground"
                  data-ocid="favorites.close_button"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Weekly Style Report ──────────────────────────────────────────────────
function WeeklyStyleReport() {
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [sharing, setSharing] = useState(false);

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);

  const allEntries = getLookbookFav();
  const weekEntries = allEntries.filter((e) => {
    try {
      return new Date(e.date) >= weekStart;
    } catch {
      return false;
    }
  });

  if (weekEntries.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ ...creamyCard, marginBottom: 20, padding: 20 }}
        data-ocid="favorites.card"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">📅</span>
          <div>
            <p className="text-sm font-bold" style={{ color: "#3d2a0e" }}>
              Weekly Style Report
            </p>
            <p className="text-xs" style={{ color: "#9c7a58" }}>
              Your 7-day style journey
            </p>
          </div>
        </div>
        <p
          className="text-xs text-center py-6"
          style={{ color: "#9c7a58", fontStyle: "italic" }}
        >
          No outfits scored this week yet. Start your style journey! 🚀
        </p>
      </motion.div>
    );
  }

  const scores = weekEntries.map((e) => e.score);
  const avgScore = Math.round(
    scores.reduce((a, b) => a + b, 0) / scores.length,
  );
  const highScore = Math.max(...scores);
  const highEntry = weekEntries.find((e) => e.score === highScore);
  const highDay = highEntry
    ? new Date(highEntry.date).toLocaleDateString("en-US", { weekday: "short" })
    : "-";

  const colorCounts: Record<string, number> = {};
  for (const e of weekEntries) {
    const c = e.result?.dominantColor ?? "Unknown";
    colorCounts[c] = (colorCounts[c] ?? 0) + 1;
  }
  const mostCommon =
    Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "Unknown";

  const trend =
    avgScore > 75
      ? "Style Master Week 🏆"
      : avgScore >= 60
        ? "Strong Style Week 💪"
        : "Keep Experimenting Week 🌱";
  const quote =
    avgScore > 75
      ? "You're on fire this week! Keep setting the bar high."
      : avgScore >= 60
        ? "Solid week of style choices — you're levelling up!"
        : "Every outfit is a learning. Keep experimenting boldly!";

  const nameToHex = (name: string) => {
    const map: Record<string, string> = {
      "Sky Blue": "#87CEEB",
      "Navy Blue": "#000080",
      White: "#FFFFFF",
      Black: "#0d0d1a",
      Crimson: "#DC143C",
      Maroon: "#800000",
      "Sage Green": "#8FBC8F",
      Olive: "#808000",
      Unknown: "#C8B9A2",
    };
    return (
      map[name] ??
      `#${Math.abs(
        name.split("").reduce((a, c) => a * 31 + c.charCodeAt(0), 0) % 0xffffff,
      )
        .toString(16)
        .padStart(6, "8")}`
    );
  };

  const buildShareCard = async () => {
    setSharing(true);
    try {
      const W = 800;
      const H = 1000;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#0a0d1a");
      bg.addColorStop(1, "#0a1a0d");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#FFD700";
      ctx.fillRect(0, 0, W, 5);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 30px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("MY WEEKLY STYLE REPORT", W / 2, 60);

      const dateRange = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "16px system-ui";
      ctx.fillText(dateRange, W / 2, 88);

      // Stats grid
      const stats = [
        { label: "Outfits Scored", value: String(weekEntries.length) },
        { label: "Highest Score", value: `${highScore} (${highDay})` },
        { label: "Average Score", value: String(avgScore) },
        { label: "Top Colour", value: mostCommon },
      ];
      stats.forEach((s, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const bx = col === 0 ? 50 : W / 2 + 20;
        const by = 130 + row * 130;
        const bw = W / 2 - 70;
        const bh = 110;
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 16);
        ctx.fill();
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 32px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(s.value.slice(0, 16), bx + bw / 2, by + 52);
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.font = "14px system-ui";
        ctx.fillText(s.label, bx + bw / 2, by + 80);
      });

      // Most worn color swatch
      const swatchCy = 520;
      ctx.beginPath();
      ctx.arc(W / 2, swatchCy, 50, 0, Math.PI * 2);
      ctx.fillStyle = nameToHex(mostCommon);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "16px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(mostCommon, W / 2, swatchCy + 72);

      // Trend badge
      ctx.fillStyle =
        avgScore > 75 ? "#FFD700" : avgScore >= 60 ? "#22c55e" : "#60a5fa";
      ctx.font = "bold 26px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(trend, W / 2, 650);

      // Quote
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.font = "italic 18px system-ui";
      ctx.fillText(quote, W / 2, 690);

      // Bottom branding
      ctx.fillStyle = "rgba(0,0,0,0.78)";
      ctx.fillRect(0, H - 50, W, 50);
      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 18px system-ui";
      ctx.textAlign = "left";
      ctx.fillText("COLOUR CLASH", 24, H - 18);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = "13px system-ui";
      ctx.textAlign = "right";
      ctx.fillText("colourclash-emb.caffeine.xyz", W - 24, H - 18);

      const caption = `My weekly style report: ${weekEntries.length} outfits, avg score ${avgScore}/100! ${trend} 🎨 #ColourClash

https://colourclash-emb.caffeine.xyz/`;

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setSharing(false);
          return;
        }
        const url = URL.createObjectURL(blob);
        setShareImageUrl(url);
        const file = new File([blob], "weekly-style-report.png", {
          type: "image/png",
        });
        if (navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: "My Weekly Style Report",
              text: caption,
            });
            setSharing(false);
            return;
          } catch {
            /* fallthrough */
          }
        }
        setShowModal(true);
        setSharing(false);
      }, "image/png");
    } catch {
      toast.error("Could not build weekly report");
      setSharing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ ...creamyCard, marginBottom: 20, padding: 20 }}
      data-ocid="favorites.card"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">📅</span>
        <div>
          <p className="text-sm font-bold" style={{ color: "#3d2a0e" }}>
            Weekly Style Report
          </p>
          <p className="text-xs" style={{ color: "#9c7a58" }}>
            {weekStart.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}{" "}
            – Today
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "Outfits", value: weekEntries.length },
          { label: "Best Score", value: highScore },
          { label: "Avg Score", value: avgScore },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-2.5 text-center"
            style={{ background: "rgba(196,122,46,0.10)" }}
          >
            <p className="text-xl font-black" style={{ color: "#c47a2e" }}>
              {s.value}
            </p>
            <p className="text-[9px]" style={{ color: "#9c7a58" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div
        className="flex items-center gap-3 rounded-xl p-3 mb-4"
        style={{ background: "rgba(196,122,46,0.10)" }}
      >
        <div
          className="w-10 h-10 rounded-full flex-shrink-0 border-2"
          style={{
            background: nameToHex(mostCommon),
            borderColor: "rgba(255,255,255,0.4)",
          }}
        />
        <div>
          <p className="text-xs font-bold" style={{ color: "#3d2a0e" }}>
            Top Colour This Week
          </p>
          <p className="text-sm font-black" style={{ color: "#c47a2e" }}>
            {mostCommon}
          </p>
        </div>
      </div>

      <div
        className="text-center rounded-xl py-2 mb-4 text-xs font-bold"
        style={{ background: "rgba(196,122,46,0.12)", color: "#c47a2e" }}
      >
        {trend}
      </div>

      <button
        type="button"
        onClick={buildShareCard}
        disabled={sharing}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
        style={{ background: "#c47a2e" }}
        data-ocid="favorites.primary_button"
      >
        {sharing ? (
          <>
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />{" "}
            Generating...
          </>
        ) : (
          "📤 Share My Weekly Report"
        )}
      </button>

      {shareImageUrl && (
        <div className="mt-3 rounded-xl overflow-hidden border border-amber-200/40">
          <img
            src={shareImageUrl}
            alt="Weekly report"
            className="w-full object-contain"
          />
        </div>
      )}

      {/* Share modal */}
      <AnimatePresence>
        {showModal && shareImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setShowModal(false)}
            data-ocid="favorites.modal"
          >
            <div
              className="w-full max-w-sm bg-background rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <div
                className="w-full bg-black flex items-center justify-center"
                style={{ maxHeight: "50vh", overflow: "hidden" }}
              >
                <img
                  src={shareImageUrl}
                  alt="Weekly report"
                  className="w-full object-contain"
                  style={{ maxHeight: "50vh" }}
                />
              </div>
              <div className="p-4 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = shareImageUrl!;
                      a.download = "weekly-style-report.png";
                      a.click();
                      toast.success("Downloaded!");
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
                    data-ocid="favorites.secondary_button"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard
                        .writeText(
                          `My weekly style report: ${weekEntries.length} outfits, avg ${avgScore}/100! ${trend} #ColourClash https://colourclash-emb.caffeine.xyz/`,
                        )
                        .then(() => toast.success("Copied!"))
                        .catch(() => {});
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-muted text-foreground text-sm font-semibold"
                    data-ocid="favorites.secondary_button"
                  >
                    <Copy className="w-4 h-4" /> Copy Caption
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full py-2 rounded-xl bg-muted text-sm font-medium text-muted-foreground"
                  data-ocid="favorites.close_button"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FavoritesPage(_props?: {
  onNavigate?: (tab: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"palettes" | "looks">("palettes");
  const { identity } = useInternetIdentity();
  const principalText = identity?.getPrincipal().isAnonymous()
    ? "anon"
    : (identity?.getPrincipal().toText() ?? "anon");
  const storageKey = `favPalettes_${principalText}`;

  const { data: backendFavorites, isLoading } = useGetFavorites();
  const deleteFavorite = useDeleteFavorite();
  const addFavorite = useAddFavorite();

  // Merged favorites (backend + localStorage)
  const [localPalettes, setLocalPalettes] = useState<LocalPalette[]>(() =>
    loadLocalPalettes(storageKey),
  );

  // Sync localStorage key when principal changes
  useEffect(() => {
    setLocalPalettes(loadLocalPalettes(storageKey));
  }, [storageKey]);

  // Merge: backend + local, deduplicated by id
  const mergedFavorites: (FavoriteColor | LocalPalette)[] = (() => {
    const backendItems: (FavoriteColor | LocalPalette)[] =
      backendFavorites ?? [];
    const backendIds = new Set(backendItems.map((i) => i.id));
    const localOnly = localPalettes.filter((p) => !backendIds.has(p.id));
    return [...backendItems, ...localOnly].sort((a, b) => {
      const tsA =
        "timestamp" in a
          ? typeof a.timestamp === "bigint"
            ? Number(a.timestamp)
            : (a.timestamp as number)
          : 0;
      const tsB =
        "timestamp" in b
          ? typeof b.timestamp === "bigint"
            ? Number(b.timestamp)
            : (b.timestamp as number)
          : 0;
      return tsB - tsA;
    });
  })();

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const [detectedColor, setDetectedColor] = useState<{
    hex: string;
    name: string;
  } | null>(null);
  const [locked, setLocked] = useState(false);
  const [combos, setCombos] = useState<Array<{ hex: string; name: string }>>(
    [],
  );
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [coupleOccasion, setCoupleOccasion] = useState("");

  const todayTip = STYLE_TIPS[new Date().getDate() % STYLE_TIPS.length];

  // Start camera
  const startCamera = async () => {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setStream(ms);
      setCameraActive(true);
      setDetectedColor(null);
      setLocked(false);
      setCombos([]);
      setSelected(new Set());
      setSelectedMood(null);
    } catch {
      toast.error("Camera access denied. Please allow camera in your browser.");
    }
  };

  useEffect(() => {
    if (cameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [cameraActive, stream]);

  const stopCamera = () => {
    if (stream) {
      for (const t of stream.getTracks()) {
        t.stop();
      }
    }
    setStream(null);
    setCameraActive(false);
  };

  const captureColor = () => {
    const video = videoRef.current;
    if (!video) return;
    setIsCapturing(true);
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsCapturing(false);
      return;
    }
    ctx.drawImage(video, 0, 0);
    const cx = Math.floor(canvas.width / 2);
    const cy = Math.floor(canvas.height / 2);
    const size = 30;
    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;
    for (let dy = -size; dy <= size; dy += 3) {
      for (let dx = -size; dx <= size; dx += 3) {
        const px = cx + dx;
        const py = cy + dy;
        if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height)
          continue;
        const data = ctx.getImageData(px, py, 1, 1).data;
        r += data[0];
        g += data[1];
        b += data[2];
        count++;
      }
    }
    if (count > 0) {
      const toHex = (v: number) =>
        Math.round(v / count)
          .toString(16)
          .padStart(2, "0");
      const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      setDetectedColor({ hex, name: colorName(hex) });
    }
    stopCamera();
    setIsCapturing(false);
  };

  const handleLock = () => {
    if (!detectedColor) return;
    const colors = generate10Colors(detectedColor.hex);
    setCombos(colors);
    setLocked(true);
    setSelected(new Set());
    setSelectedMood(null);
  };

  const toggleSelect = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const handleSaveSelected = useCallback(async () => {
    if (!detectedColor || selected.size === 0) {
      toast.error("Select at least one color to save.");
      return;
    }
    setIsSaving(true);
    try {
      const selectedColors = [...selected].map((i) => combos[i]);
      const harmonyPalette = JSON.stringify({
        complementary: selectedColors,
        mood: selectedMood ?? undefined,
      });

      // Always save to localStorage first (reliable)
      const newEntry: LocalPalette = {
        id: `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        hex: detectedColor.hex,
        name: detectedColor.name,
        harmonyPalette,
        timestamp: Date.now(),
      };
      const updated = [newEntry, ...localPalettes].slice(0, 50);
      saveLocalPalettes(storageKey, updated);
      setLocalPalettes(updated);

      // Also try backend (best-effort)
      try {
        await addFavorite.mutateAsync({
          hex: detectedColor.hex,
          name: detectedColor.name,
          harmonyPalette,
        });
      } catch {
        // silently ignore — localStorage is the source of truth
      }

      toast.success(
        `Saved ${selected.size} colour${selected.size > 1 ? "s" : ""} to favourites!`,
      );
      setLocked(false);
      setDetectedColor(null);
      setCombos([]);
      setSelected(new Set());
      setSelectedMood(null);
    } catch {
      toast.error("Failed to save.");
    } finally {
      setIsSaving(false);
    }
  }, [
    detectedColor,
    selected,
    combos,
    addFavorite,
    localPalettes,
    storageKey,
    selectedMood,
  ]);

  const handleSharePalette = async () => {
    if (!detectedColor || combos.length === 0) return;
    const selectedCombos =
      selected.size > 0
        ? [...selected].map((i) => combos[i])
        : combos.slice(0, 5);
    const text = `🎨 ${detectedColor.name} palette from Colour Clash:\n${selectedCombos.map((c) => `${c.name} ${c.hex}`).join("\n")}\n\nColour Clash — just fly with it...`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "My Colour Palette", text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Palette copied!");
      }
    } catch (_) {}
  };

  const handleDelete = useCallback(
    async (id: string) => {
      // Remove from localStorage
      const updatedLocal = localPalettes.filter((p) => p.id !== id);
      saveLocalPalettes(storageKey, updatedLocal);
      setLocalPalettes(updatedLocal);

      // Try backend delete
      try {
        await deleteFavorite.mutateAsync(id);
      } catch {
        // ignore — local delete already done
      }
    },
    [deleteFavorite, localPalettes, storageKey],
  );

  return (
    <div style={notebook.page} className="min-h-full pb-8">
      {/* Torn-paper top edge */}
      <div
        style={{
          height: 18,
          background: "#fdf8f0",
          clipPath:
            "polygon(0 100%, 3% 40%, 7% 80%, 12% 30%, 17% 70%, 22% 20%, 27% 60%, 33% 15%, 38% 55%, 44% 10%, 50% 50%, 56% 5%, 62% 45%, 68% 10%, 73% 50%, 79% 20%, 85% 65%, 91% 25%, 96% 60%, 100% 30%, 100% 100%)",
          boxShadow: "0 -2px 8px rgba(140,100,40,0.12)",
        }}
      />

      <div className="px-4 pt-4 pb-4">
        {/* Notebook heading */}
        <div style={notebook.marginLine} className="mb-4">
          <h1
            className="text-2xl font-bold"
            style={notebook.heading}
            data-ocid="favorites.section"
          >
            My Colour Diary
          </h1>
          <p
            className="text-sm"
            style={{ color: "#9c7a58", fontStyle: "italic" }}
          >
            scan · save · share
          </p>
        </div>

        {/* ── Today's Style Tip ── */}
        <div
          style={{
            ...notebook.card,
            marginBottom: 20,
            padding: "12px 14px",
            borderLeft: `4px solid ${notebook.accent}`,
          }}
        >
          <div className="flex items-start gap-2">
            <span className="text-lg flex-shrink-0">💡</span>
            <div>
              <p
                className="text-xs font-semibold mb-1"
                style={{ color: notebook.accent, fontFamily: "Georgia, serif" }}
              >
                Today's Style Tip
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{
                  color: "#5c3d1e",
                  fontFamily: "Georgia, serif",
                  fontStyle: "italic",
                }}
              >
                &ldquo;{todayTip}&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* ── Style DNA Report ── */}
        <StyleDNACard />

        {/* ── Color Personality Quiz ── */}
        <ColorPersonalityQuiz />

        {/* ── Outfit Repeat Tracker ── */}
        <OutfitRepeatTracker />

        {/* ── Weekly Style Report ── */}
        <WeeklyStyleReport />

        {/* ── Camera scanner section ── */}
        <div
          style={{
            ...notebook.card,
            marginBottom: 20,
            padding: 16,
          }}
        >
          <p
            className="text-sm font-semibold mb-3"
            style={{ ...notebook.heading, fontSize: 15 }}
          >
            ✏️ Scan a Colour
          </p>

          {/* Start Scan button */}
          {!cameraActive && !detectedColor && (
            <button
              type="button"
              onClick={startCamera}
              className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{
                background: notebook.accent,
                color: "#fff",
                boxShadow: "0 2px 6px rgba(196,122,46,0.3)",
              }}
              data-ocid="favorites.primary_button"
            >
              📷 Start Scan
            </button>
          )}

          {/* Live camera viewfinder */}
          {cameraActive && (
            <div className="mb-4">
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{ border: "2px solid #d4b896" }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full"
                  style={{
                    maxHeight: 280,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                {/* Center crosshair */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className="w-16 h-16 rounded-full"
                    style={{
                      border: "2px solid rgba(255,255,255,0.8)",
                      boxShadow: "0 0 0 2px rgba(0,0,0,0.3)",
                    }}
                  />
                </div>
              </div>
              <p
                className="text-xs text-center mt-1 mb-3"
                style={{ color: "#9c7a58", fontStyle: "italic" }}
              >
                Point at a garment — center circle samples colour
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={captureColor}
                  disabled={isCapturing}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                  style={{
                    background: "#c0392b",
                    color: "#fff",
                    boxShadow: "0 2px 6px rgba(192,57,43,0.35)",
                  }}
                  data-ocid="favorites.primary_button"
                >
                  {isCapturing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "🔴 Capture"
                  )}
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                  style={{
                    background: "transparent",
                    border: `2px solid ${notebook.accent}`,
                    color: notebook.accent,
                  }}
                  data-ocid="favorites.secondary_button"
                >
                  ⏹ Stop
                </button>
              </div>
            </div>
          )}

          {detectedColor && (
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-14 h-14 rounded-full"
                style={{
                  backgroundColor: detectedColor.hex,
                  border: "3px solid #d4b896",
                  boxShadow: `0 2px 8px ${detectedColor.hex}55`,
                }}
              />
              <div className="flex-1">
                <p
                  className="font-semibold text-sm"
                  style={{ color: "#5c3d1e" }}
                >
                  {detectedColor.name}
                </p>
                <p
                  className="text-xs font-mono"
                  style={{ color: notebook.accent }}
                >
                  {detectedColor.hex}
                </p>
              </div>
              {!locked && (
                <button
                  type="button"
                  onClick={handleLock}
                  className="py-2 px-4 rounded-xl text-sm font-semibold"
                  style={{
                    background: detectedColor.hex,
                    color: "#fff",
                    boxShadow: `0 2px 6px ${detectedColor.hex}66`,
                  }}
                  data-ocid="favorites.primary_button"
                >
                  🔒 Lock
                </button>
              )}
            </div>
          )}

          {/* Mood selector */}
          <AnimatePresence>
            {locked && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-3"
              >
                <p
                  className="text-xs mb-2"
                  style={{ color: "#9c7a58", fontStyle: "italic" }}
                >
                  Mood (optional):
                </p>
                <div className="flex gap-2 flex-wrap">
                  {MOODS.map((mood) => (
                    <button
                      key={mood}
                      type="button"
                      onClick={() =>
                        setSelectedMood((prev) => (prev === mood ? null : mood))
                      }
                      className="text-xs px-3 py-1 rounded-full transition-all"
                      style={{
                        background:
                          selectedMood === mood ? notebook.accent : "#f0e8d8",
                        color: selectedMood === mood ? "#fff" : "#8a6040",
                        border: `1.5px solid ${selectedMood === mood ? notebook.accent : "#d4b896"}`,
                      }}
                      data-ocid={`favorites.toggle.${MOODS.indexOf(mood) + 1}`}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Color combinations grid */}
          <AnimatePresence>
            {locked && combos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <p
                  className="text-xs mb-3"
                  style={{ color: "#9c7a58", fontStyle: "italic" }}
                >
                  Tap to select combinations to save:
                </p>
                <div className="grid grid-cols-5 gap-3 mb-4">
                  {combos.map((c, i) => {
                    const isSel = selected.has(i);
                    return (
                      <motion.button
                        key={c.hex}
                        type="button"
                        onClick={() => toggleSelect(i)}
                        whileTap={{ scale: 0.9 }}
                        className="flex flex-col items-center gap-1 focus:outline-none"
                        data-ocid={`favorites.toggle.${i + 1}`}
                      >
                        <div
                          className="relative w-11 h-11 rounded-full"
                          style={{
                            backgroundColor: c.hex,
                            border: isSel
                              ? `3px solid ${notebook.accent}`
                              : "2px solid #d4b896",
                            boxShadow: isSel
                              ? `0 0 0 2px #fdf8f0, 0 0 0 4px ${notebook.accent}`
                              : "none",
                          }}
                        >
                          {isSel && (
                            <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold">
                              ✓
                            </span>
                          )}
                        </div>
                        <span
                          className="text-[8px] leading-tight text-center"
                          style={{ color: "#9c7a58" }}
                        >
                          {c.name.split(" ").slice(-1)[0]}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveSelected}
                    disabled={isSaving || selected.size === 0}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity"
                    style={{
                      background: selected.size > 0 ? "#5c3d1e" : "#c9a98a",
                      color: "#fff",
                    }}
                    data-ocid="favorites.save_button"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      `💾 Save ${selected.size > 0 ? selected.size : ""} Selected`
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleSharePalette}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                    style={{
                      background: "transparent",
                      border: `2px solid ${notebook.accent}`,
                      color: notebook.accent,
                    }}
                    data-ocid="favorites.secondary_button"
                  >
                    📤 Share
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Couple Match ── */}
        <div style={notebook.marginLine} className="mb-4 mt-2">
          <h2 className="text-base font-semibold mb-3" style={notebook.heading}>
            💑 Couple Match
          </h2>
          <div
            className="mb-3 flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: "#f0e8d8", border: "1.5px solid #d4b896" }}
          >
            <span className="text-sm">🔍</span>
            <input
              type="text"
              value={coupleOccasion}
              onChange={(e) => setCoupleOccasion(e.target.value)}
              placeholder="Type an occasion (e.g. wedding, beach, party)..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "#5c3d1e", fontFamily: "Georgia, serif" }}
              data-ocid="favorites.input"
            />
            {coupleOccasion && (
              <button
                type="button"
                onClick={() => setCoupleOccasion("")}
                className="text-xs text-muted-foreground hover:text-foreground"
                data-ocid="favorites.close_button"
              >
                ✕
              </button>
            )}
          </div>
          {(() => {
            const filtered = coupleOccasion.trim()
              ? COUPLE_COMBINATIONS.filter((c) =>
                  c.occasions.some((o) =>
                    o.toLowerCase().includes(coupleOccasion.toLowerCase()),
                  ),
                )
              : COUPLE_COMBINATIONS;
            if (filtered.length === 0) {
              return (
                <p
                  className="text-sm text-center py-4"
                  style={{
                    color: "#9c7a58",
                    fontFamily: "Georgia, serif",
                    fontStyle: "italic",
                  }}
                >
                  No combinations found for this occasion. Try: wedding, beach,
                  party, office...
                </p>
              );
            }
            return (
              <div className="flex flex-col gap-3">
                {filtered.map((combo) => (
                  <motion.div
                    key={combo.id}
                    whileTap={{ scale: 0.97 }}
                    className="rounded-xl p-3"
                    style={{
                      background: "#fef9f0",
                      border: "1.5px solid #d4b896",
                      boxShadow: "0 2px 8px rgba(160,100,60,0.08)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="text-sm font-semibold"
                        style={{
                          fontFamily: "Georgia, serif",
                          color: "#5c3d1e",
                        }}
                      >
                        {combo.label}
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await addFavorite.mutateAsync({
                              hex: combo.his.hex,
                              name: combo.his.name,
                              harmonyPalette: combo.his.hex,
                            });
                            await addFavorite.mutateAsync({
                              hex: combo.hers.hex,
                              name: combo.hers.name,
                              harmonyPalette: combo.hers.hex,
                            });
                            toast.success(
                              `💑 "${combo.label}" saved to favourites!`,
                            );
                          } catch {
                            // Save to localStorage as fallback
                            const key = `favPalettes_${principalText}`;
                            const existing = JSON.parse(
                              localStorage.getItem(key) || "[]",
                            );
                            existing.push({
                              id: Date.now(),
                              colorHex: combo.his.hex,
                              colorName: combo.his.name,
                            });
                            existing.push({
                              id: Date.now() + 1,
                              colorHex: combo.hers.hex,
                              colorName: combo.hers.name,
                            });
                            localStorage.setItem(key, JSON.stringify(existing));
                            toast.success(`💑 "${combo.label}" saved!`);
                          }
                        }}
                        className="text-[11px] font-semibold px-3 py-1 rounded-full transition-all"
                        style={{ background: notebook.accent, color: "#fff" }}
                        data-ocid="favorites.save_button"
                      >
                        Save Pair
                      </button>
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className="w-12 h-12 rounded-full border-2 shadow-md"
                          style={{
                            background: combo.his.hex,
                            borderColor: "#d4b896",
                          }}
                        />
                        <span
                          className="text-[10px] font-semibold"
                          style={{ color: "#5c3d1e" }}
                        >
                          His
                        </span>
                        <span
                          className="text-[9px]"
                          style={{ color: "#9c7a58" }}
                        >
                          {combo.his.name}
                        </span>
                      </div>
                      <span className="text-xl">💑</span>
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className="w-12 h-12 rounded-full border-2 shadow-md"
                          style={{
                            background: combo.hers.hex,
                            borderColor: "#d4b896",
                          }}
                        />
                        <span
                          className="text-[10px] font-semibold"
                          style={{ color: "#5c3d1e" }}
                        >
                          Hers
                        </span>
                        <span
                          className="text-[9px]"
                          style={{ color: "#9c7a58" }}
                        >
                          {combo.hers.name}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {combo.occasions.map((o) => (
                        <span
                          key={o}
                          className="text-[9px] px-2 py-0.5 rounded-full capitalize"
                          style={{
                            background: "#f0e8d8",
                            color: "#8a6040",
                            border: "1px solid #d4b896",
                          }}
                        >
                          {o}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* ── Tab Toggle ── */}
        <div className="flex gap-2 mb-4" style={notebook.marginLine}>
          <button
            type="button"
            onClick={() => setActiveTab("palettes")}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{
              background:
                activeTab === "palettes" ? notebook.accent : "#f0e8d8",
              color: activeTab === "palettes" ? "#fff" : notebook.accent,
              border: `1.5px solid ${notebook.accent}`,
            }}
            data-ocid="favorites.tab"
          >
            🎨 Saved Palettes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("looks")}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{
              background: activeTab === "looks" ? notebook.accent : "#f0e8d8",
              color: activeTab === "looks" ? "#fff" : notebook.accent,
              border: `1.5px solid ${notebook.accent}`,
            }}
            data-ocid="favorites.tab"
          >
            💅 Saved Looks
          </button>
        </div>

        {activeTab === "looks" ? (
          <SavedLooksTab />
        ) : (
          <>
            <div style={notebook.marginLine} className="mb-3">
              <h2
                className="text-base font-semibold"
                style={{ ...notebook.heading, fontStyle: "normal" }}
                data-ocid="favorites.list"
              >
                Saved Palettes
                {mergedFavorites.length > 0 && (
                  <span
                    className="ml-2 text-xs"
                    style={{
                      background: notebook.accent,
                      color: "#fff",
                      padding: "1px 7px",
                      borderRadius: 99,
                    }}
                  >
                    {mergedFavorites.length}
                  </span>
                )}
              </h2>
            </div>

            {isLoading ? (
              <div
                className="flex items-center justify-center py-10"
                data-ocid="favorites.loading_state"
              >
                <Loader2
                  className="w-6 h-6 animate-spin"
                  style={{ color: notebook.accent }}
                />
              </div>
            ) : mergedFavorites.length === 0 ? (
              <div
                className="text-center py-12"
                style={{ color: "#9c7a58" }}
                data-ocid="favorites.empty_state"
              >
                <p className="text-4xl mb-3">🎨</p>
                <p
                  className="text-sm"
                  style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}
                >
                  No saved palettes yet.
                </p>
                <p className="text-xs mt-1">
                  Scan a colour above to get started.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <AnimatePresence>
                  {mergedFavorites.map((item, index) => (
                    <SavedCard
                      key={item.id}
                      item={item}
                      index={index}
                      onDelete={handleDelete}
                      isDeleting={deleteFavorite.isPending}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

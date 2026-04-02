import { useCamera } from "@/camera/useCamera";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Heart,
  Layers,
  LayoutGrid,
  Loader2,
  Lock,
  RefreshCw,
  Share2,
  Shirt,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { HarmonyPalette } from "../backend.d";
import { useFilters } from "../context/FilterContext";
import { useUserProfile } from "../context/UserProfileContext";
import { useAddFavorite, useGetHarmonyAdvice } from "../hooks/useQueries";
import { getColorName } from "../lib/colorNames";
import {
  generateMatchingColors,
  getColorFamily,
  hexToColorName,
  hexToHsl,
  sampleVideoColor,
} from "../utils/colorUtils";

// ── Garment detection ──────────────────────────────────────────────────────
const GARMENT_TYPES = [
  { label: "Top", emoji: "👕" },
  { label: "Shirt", emoji: "👔" },
  { label: "Blouse", emoji: "👚" },
  { label: "Pant", emoji: "👖" },
  { label: "Bottom", emoji: "👖" },
  { label: "Jeans", emoji: "👖" },
  { label: "Shorts", emoji: "🩳" },
  { label: "Skirt", emoji: "👗" },
  { label: "Dress", emoji: "👗" },
  { label: "Jacket", emoji: "🧥" },
  { label: "Suit", emoji: "🤵" },
  { label: "Hoodie", emoji: "🧥" },
  { label: "Shoes", emoji: "👟" },
  { label: "Sneakers", emoji: "👟" },
  { label: "Watch", emoji: "⌚" },
  { label: "Bag", emoji: "👜" },
  { label: "Saree", emoji: "🥻" },
  { label: "Kurta", emoji: "🩱" },
  { label: "Scarf", emoji: "🧣" },
  { label: "Dupatta", emoji: "🧣" },
  { label: "Turban", emoji: "🎩" },
  { label: "Stole", emoji: "🧣" },
  { label: "Ethnic Wear", emoji: "🥻" },
];

const GARMENT_KEYWORD_MAP: Record<string, string> = {
  Top: "top",
  Shirt: "shirt",
  Blouse: "blouse",
  Pant: "pant",
  Bottom: "bottom",
  Jeans: "jeans",
  Shorts: "shorts",
  Skirt: "skirt",
  Dress: "dress",
  Jacket: "jacket",
  Suit: "suit",
  Hoodie: "hoodie",
  Shoes: "shoes",
  Sneakers: "sneakers",
  Watch: "watch",
  Bag: "bag",
  Saree: "saree",
  Kurta: "kurta",
  Scarf: "scarf",
  Dupatta: "dupatta",
  Turban: "turban",
  Stole: "stole",
  "Ethnic Wear": "ethnic wear",
};

const COMPLEMENTARY_GARMENT_MAP: Record<string, string[]> = {
  Top: ["Pant", "Jeans", "Bottom", "Shoes", "Watch", "Bag"],
  Shirt: ["Pant", "Jeans", "Bottom", "Shoes", "Watch", "Bag"],
  Blouse: ["Saree", "Skirt", "Shoes", "Watch", "Bag"],
  Pant: ["Shirt", "Top", "Shoes", "Watch", "Bag"],
  Bottom: ["Shirt", "Top", "Shoes", "Watch", "Bag"],
  Jeans: ["Shirt", "Top", "Shoes", "Watch", "Bag"],
  Shorts: ["Shirt", "Top", "Shoes", "Watch", "Bag"],
  Skirt: ["Top", "Blouse", "Shirt", "Shoes", "Bag"],
  Dress: ["Shoes", "Bag", "Watch", "Jacket"],
  Jacket: ["Shirt", "Top", "Pant", "Jeans", "Shoes"],
  Suit: ["Shirt", "Top", "Pant", "Jeans", "Shoes"],
  Hoodie: ["Shirt", "Top", "Pant", "Jeans", "Shoes"],
  Shoes: ["Top", "Shirt", "Pant", "Jeans"],
  Sneakers: ["Top", "Shirt", "Pant", "Jeans"],
  Watch: ["Shirt", "Top", "Dress", "Shoes"],
  Bag: ["Top", "Shirt", "Dress", "Shoes"],
  Saree: ["Shoes", "Bag", "Watch", "Blouse"],
  Kurta: ["Pant", "Jeans", "Shoes", "Watch", "Bag"],
  Scarf: ["Top", "Blouse", "Dress", "Kurta", "Shoes"],
  Dupatta: ["Top", "Blouse", "Dress", "Kurta", "Shoes"],
  Stole: ["Top", "Blouse", "Dress", "Kurta", "Shoes"],
  Turban: ["Shirt", "Kurta", "Shoes"],
  "Ethnic Wear": ["Shoes", "Bag", "Watch", "Blouse"],
};

// Gender-aware complementary label resolver
function getComplementaryLabels(
  garmentLabel: string,
  gender: string,
): string[] {
  const isFemale = gender === "female" || gender === "women";
  if (["Pant", "Bottom", "Jeans", "Shorts"].includes(garmentLabel)) {
    return isFemale
      ? ["Shirt", "Top", "Blouse", "Shoes", "Watch", "Bag"]
      : ["Shirt", "Top", "Shoes", "Watch", "Bag"];
  }
  if (["Scarf", "Dupatta", "Stole"].includes(garmentLabel)) {
    return ["Top", "Blouse", "Dress", "Kurta", "Shoes"];
  }
  return COMPLEMENTARY_GARMENT_MAP[garmentLabel] ?? ["Top", "Shoes"];
}

// ── Product catalog ────────────────────────────────────────────────────────
interface ProductItem {
  garmentLabel: string;
  name: string;
  image: string;
  gender: "men" | "women" | "all";
}

const PRODUCT_CATALOG: ProductItem[] = [
  // ── Men: Tops ──
  {
    garmentLabel: "Top",
    name: "Classic White Shirt",
    image: "/assets/generated/product-mens-shirt.dim_400x500.jpg",
    gender: "men",
  },
  {
    garmentLabel: "Top",
    name: "Casual Grey T-Shirt",
    image: "/assets/generated/product-mens-tshirt.dim_400x500.jpg",
    gender: "men",
  },
  // ── Men: Bottoms ──
  {
    garmentLabel: "Pant",
    name: "Chino Trousers",
    image: "/assets/generated/product-mens-trousers.dim_400x500.jpg",
    gender: "men",
  },
  {
    garmentLabel: "Dress",
    name: "Formal Trousers",
    image: "/assets/generated/product-mens-trousers.dim_400x500.jpg",
    gender: "men",
  },
  // ── Men: Shoes ──
  {
    garmentLabel: "Shoes",
    name: "White Sneakers",
    image: "/assets/generated/product-mens-shoes.dim_400x500.jpg",
    gender: "men",
  },
  {
    garmentLabel: "Shoes",
    name: "Tan Loafers",
    image: "/assets/generated/product-mens-loafers.dim_400x500.jpg",
    gender: "men",
  },
  // ── Men: Accessories ──
  {
    garmentLabel: "Watch",
    name: "Classic Watch",
    image: "/assets/generated/product-mens-watch.dim_400x500.jpg",
    gender: "men",
  },
  {
    garmentLabel: "Bag",
    name: "Messenger Bag",
    image: "/assets/generated/product-mens-jacket.dim_400x500.jpg",
    gender: "men",
  },
  // ── Women: Tops ──
  {
    garmentLabel: "Top",
    name: "Floral Top",
    image: "/assets/generated/product-womens-top.dim_400x500.jpg",
    gender: "women",
  },
  {
    garmentLabel: "Kurta",
    name: "Embroidered Kurti",
    image: "/assets/generated/product-womens-kurta.dim_400x500.jpg",
    gender: "women",
  },
  // ── Women: Bottoms ──
  {
    garmentLabel: "Pant",
    name: "Palazzo Pants",
    image: "/assets/generated/product-womens-pants.dim_400x500.jpg",
    gender: "women",
  },
  {
    garmentLabel: "Dress",
    name: "Silk Saree",
    image: "/assets/generated/product-womens-saree.dim_400x500.jpg",
    gender: "women",
  },
  {
    garmentLabel: "Saree",
    name: "Silk Saree",
    image: "/assets/generated/product-womens-saree.dim_400x500.jpg",
    gender: "women",
  },
  // ── Women: Shoes ──
  {
    garmentLabel: "Shoes",
    name: "Stiletto Heels",
    image: "/assets/generated/product-womens-heels.dim_400x500.jpg",
    gender: "women",
  },
  {
    garmentLabel: "Shoes",
    name: "White Sneakers",
    image: "/assets/generated/product-womens-sneakers.dim_400x500.jpg",
    gender: "women",
  },
  // ── Women: Accessories ──
  {
    garmentLabel: "Watch",
    name: "Gold Necklace Set",
    image: "/assets/generated/product-womens-jewelry.dim_400x500.jpg",
    gender: "women",
  },
  {
    garmentLabel: "Bag",
    name: "Leather Handbag",
    image: "/assets/generated/product-womens-bag.dim_400x500.jpg",
    gender: "women",
  },
  // ── Unisex: Jackets ──
  {
    garmentLabel: "Jacket",
    name: "Navy Blazer",
    image: "/assets/generated/product-mens-jacket.dim_400x500.jpg",
    gender: "men",
  },
  {
    garmentLabel: "Jacket",
    name: "Denim Jacket",
    image: "/assets/generated/product-unisex-jacket.dim_400x500.jpg",
    gender: "all",
  },
  // ── Ethnic ──
  {
    garmentLabel: "Scarf",
    name: "Silk Dupatta",
    image: "/assets/generated/product-womens-saree.dim_400x500.jpg",
    gender: "women",
  },
  {
    garmentLabel: "Scarf",
    name: "Cotton Scarf",
    image: "/assets/generated/product-mens-jacket.dim_400x500.jpg",
    gender: "men",
  },
];

function getProductsForGarment(
  garmentLabel: string,
  userGender: string,
): ProductItem[] {
  const gender = userGender as "men" | "women" | "all";
  return PRODUCT_CATALOG.filter(
    (p) =>
      p.garmentLabel === garmentLabel &&
      (gender === "all" || p.gender === gender || p.gender === "all"),
  );
}

// ── Retailer config ────────────────────────────────────────────────────────
const RETAILERS = [
  {
    key: "indya" as const,
    label: "House of Indya",
    badge: "House of Indya",
    badgeClass: "bg-rose-800 text-white",
    color: "#9B2335",
  },
  {
    key: "amazon" as const,
    label: "Amazon",
    badge: "AMZ",
    badgeClass: "bg-orange-500 text-white",
    color: "#FF9900",
  },
  {
    key: "flipkart" as const,
    label: "Flipkart",
    badge: "Flipkart",
    badgeClass: "bg-blue-500 text-white",
    color: "#2874F0",
  },
  {
    key: "myntra" as const,
    label: "Myntra",
    badge: "Myntra",
    badgeClass: "bg-pink-500 text-white",
    color: "#FF3F6C",
  },
  {
    key: "ajio" as const,
    label: "Ajio",
    badge: "Ajio",
    badgeClass: "bg-red-600 text-white",
    color: "#DC2626",
  },
  {
    key: "meesho" as const,
    label: "Meesho",
    badge: "Meesho",
    badgeClass: "bg-teal-500 text-white",
    color: "#0D9488",
  },
  {
    key: "nykaa" as const,
    label: "Nykaa Fashion",
    badge: "Nykaa",
    badgeClass: "bg-pink-600 text-white",
    color: "#FC2779",
  },
  {
    key: "offduty" as const,
    label: "Offduty India",
    badge: "Offduty",
    badgeClass: "bg-yellow-800 text-white",
    color: "#8B6914",
  },
];

// Always return all 5 retailers
function getAvailableRetailers(): typeof RETAILERS {
  return RETAILERS;
}

function buildRetailerUrl(
  retailer: string,
  garmentKeyword: string,
  colorName: string,
  moodKeyword?: string,
  gender?: string,
): string {
  const moodSuffix = moodKeyword ? ` ${moodKeyword}` : "";
  const genderPrefix =
    gender === "female" ? "women" : gender === "male" ? "men" : "";
  const gPrefix = genderPrefix ? `${genderPrefix} ` : "";
  const g = encodeURIComponent(garmentKeyword);
  const cn = encodeURIComponent(colorName);
  const q = encodeURIComponent(
    `${gPrefix}${garmentKeyword} ${colorName}${moodSuffix}`,
  );
  const gk = encodeURIComponent(`${gPrefix}${garmentKeyword}`);
  switch (retailer) {
    case "amazon":
      return `https://www.amazon.in/s?k=${gk}+${cn}${genderPrefix ? "&rh=n%3A1571271031" : ""}`;
    case "flipkart":
      return `https://www.flipkart.com/search?q=${gk}+${cn}`;
    case "myntra":
      if (genderPrefix) {
        return `https://www.myntra.com/${genderPrefix}-${g}?rawQuery=${q}`;
      }
      return `https://www.myntra.com/${g}?rawQuery=${q}`;
    case "ajio":
      return `https://www.ajio.com/search/?text=${q}`;
    case "meesho":
      return `https://www.meesho.com/search?q=${q}`;
    case "nykaa":
      return `https://www.nykaa.com/search/result/?q=${q}`;
    case "indya":
      return `https://www.houseofindya.com/Colourclash?q=${q}`;
    case "offduty":
      return `https://offduty.in/search?type=product&q=${q}`;
    default:
      return `https://www.amazon.in/s?k=${q}`;
  }
}

function detectGarmentFromHex(hex: string): (typeof GARMENT_TYPES)[0] {
  let hash = 0;
  for (let i = 0; i < hex.length; i++) {
    hash = (hash * 31 + hex.charCodeAt(i)) & 0xffffffff;
  }
  return GARMENT_TYPES[Math.abs(hash) % GARMENT_TYPES.length];
}

// ── Color math ─────────────────────────────────────────────────────────────
function hslToHex(h: number, s: number, l: number): string {
  const hNorm = ((h % 360) + 360) % 360;
  const sC = Math.max(0, Math.min(1, s));
  const lC = Math.max(0.08, Math.min(0.92, l));
  const c = (1 - Math.abs(2 * lC - 1)) * sC;
  const x = c * (1 - Math.abs(((hNorm / 60) % 2) - 1));
  const m = lC - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hNorm < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (hNorm < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (hNorm < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (hNorm < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (hNorm < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// generateMatchingColors imported from colorUtils

// ── Outfit generation ──────────────────────────────────────────────────────
interface OutfitSuggestion {
  id: number;
  title: string;
  hairstyle: string;
  top: { label: string; color: string; hex: string };
  bottom: { label: string; color: string; hex: string };
  shoes: { label: string; color: string; hex: string };
  accessory: { label: string; color: string; hex: string };
  bag?: { label: string; color: string; hex: string };
}

const LOOK_TITLES = [
  "The Sharp Contrast",
  "The Tonal Stack",
  "The Street Edit",
  "The Boardroom Look",
  "The Weekend Vibe",
];

const HAIR_STYLES = ["short", "medium", "long", "curly"] as const;

const MEN_TOPS = [
  "Slim-fit shirt",
  "Graphic tee",
  "Oxford shirt",
  "Polo shirt",
  "Linen shirt",
];
const MEN_BOTTOMS = [
  "Chino trousers",
  "Slim jeans",
  "Tailored trousers",
  "Cargo pants",
  "Joggers",
];
const MEN_SHOES = [
  "White sneakers",
  "Chelsea boots",
  "Loafers",
  "Derby shoes",
  "Sports runners",
];
const MEN_ACC = [
  "Silver watch",
  "Leather belt",
  "Gold watch",
  "Bracelet stack",
  "Sunglasses",
];

const WOMEN_TOPS = [
  "Silk blouse",
  "Cropped tee",
  "Oversized blazer",
  "Fitted kurta",
  "Wrap top",
];
const WOMEN_BOTTOMS = [
  "Wide-leg trousers",
  "Midi skirt",
  "Straight jeans",
  "Palazzo pants",
  "Pleated skirt",
];
const WOMEN_SHOES = [
  "Block heels",
  "White sneakers",
  "Strappy sandals",
  "Ballet flats",
  "Ankle boots",
];
const WOMEN_ACC = [
  "Gold necklace",
  "Stud earrings",
  "Bangle set",
  "Pendant necklace",
  "Layered chains",
];
const WOMEN_BAGS = [
  "Tote bag",
  "Clutch purse",
  "Crossbody bag",
  "Mini bag",
  "Sling bag",
];

function generateOutfits(
  baseHex: string,
  garmentLabel: string,
  gender: string,
): OutfitSuggestion[] {
  const [h, s, l] = hexToHsl(baseHex);
  const sBase = Math.max(s, 0.25);
  const isWomen = gender === "women";

  // Derive distinct palettes for 5 looks
  const palettes = [
    { topH: h + 180, bottomH: h + 200, shoeH: h + 30, accH: h + 60 }, // sharp contrast
    { topH: h + 10, bottomH: h - 10, shoeH: h + 5, accH: h + 15 }, // tonal stack
    { topH: h + 150, bottomH: h + 10, shoeH: h + 300, accH: h + 120 }, // street edit
    { topH: h + 0, bottomH: h + 195, shoeH: h + 210, accH: h + 45 }, // boardroom
    { topH: h + 120, bottomH: h + 135, shoeH: h + 50, accH: h + 200 }, // weekend
  ];

  return palettes.map((p, i) => {
    const topHex = hslToHex(
      p.topH,
      sBase * 0.85,
      Math.max(0.35, Math.min(0.7, l + (i % 2 === 0 ? 0.1 : -0.1))),
    );
    const bottomHex = hslToHex(
      p.bottomH,
      sBase * 0.7,
      Math.max(0.25, Math.min(0.65, l - 0.05)),
    );
    const shoeHex = hslToHex(
      p.shoeH,
      sBase * 0.6,
      Math.max(0.2, Math.min(0.55, l - 0.1)),
    );
    const accHex = hslToHex(
      p.accH,
      sBase * 0.9,
      Math.max(0.4, Math.min(0.75, l + 0.15)),
    );
    const bagHex = hslToHex(
      p.bottomH + 20,
      sBase * 0.65,
      Math.max(0.35, Math.min(0.6, l)),
    );

    const tops = isWomen ? WOMEN_TOPS : MEN_TOPS;
    const bottoms = isWomen ? WOMEN_BOTTOMS : MEN_BOTTOMS;
    const shoes = isWomen ? WOMEN_SHOES : MEN_SHOES;
    const accs = isWomen ? WOMEN_ACC : MEN_ACC;
    const bags = WOMEN_BAGS;

    const hairStyleKey = HAIR_STYLES[i % HAIR_STYLES.length];
    const hairLabels: Record<string, string> = {
      short: "Clean short cut",
      medium: "Textured medium length",
      long: "Loose waves, long",
      curly: "Natural curls",
    };

    const outfit: OutfitSuggestion = {
      id: i + 1,
      title: `Look ${i + 1}: ${LOOK_TITLES[i]}`,
      hairstyle: hairLabels[hairStyleKey],
      top: { label: tops[i], color: hexToColorName(topHex), hex: topHex },
      bottom: {
        label: bottoms[i],
        color: hexToColorName(bottomHex),
        hex: bottomHex,
      },
      shoes: { label: shoes[i], color: hexToColorName(shoeHex), hex: shoeHex },
      accessory: { label: accs[i], color: hexToColorName(accHex), hex: accHex },
    };

    if (isWomen || i % 2 === 1) {
      outfit.bag = {
        label: bags[i % bags.length],
        color: hexToColorName(bagHex),
        hex: bagHex,
      };
    }

    // Override one item with the scanned garment
    const keyword = GARMENT_KEYWORD_MAP[garmentLabel];
    if (keyword === "pants" || keyword === "dress") {
      outfit.bottom = {
        label: garmentLabel,
        color: hexToColorName(baseHex),
        hex: baseHex,
      };
    } else if (keyword === "shoes") {
      outfit.shoes = {
        label: garmentLabel,
        color: hexToColorName(baseHex),
        hex: baseHex,
      };
    } else {
      outfit.top = {
        label: garmentLabel,
        color: hexToColorName(baseHex),
        hex: baseHex,
      };
    }

    return outfit;
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────
interface ColorChipProps {
  hex: string;
  label?: string;
}
function ColorChip({ hex, label }: ColorChipProps) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-6 h-6 rounded-full flex-shrink-0 swatch-shadow"
        style={{ backgroundColor: hex }}
      />
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <p className="ios-section-header">{children}</p>;
}

// ── Product Card ──────────────────────────────────────────────────────────
// ── PaletteIconCard ──────────────────────────────────────────────────────
interface PaletteIconCardProps {
  garmentType: string;
  hexColor: string;
}

function PaletteIconIcon({ cat }: { cat: string }) {
  const style: React.CSSProperties = {
    width: "60%",
    height: "60%",
    opacity: 0.9,
  };
  if (
    cat.includes("top") ||
    cat.includes("shirt") ||
    cat.includes("tee") ||
    cat.includes("blouse")
  ) {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={style}
        aria-hidden="true"
      >
        <path
          d="M30 15 L15 35 L28 38 L28 82 L72 82 L72 38 L85 35 L70 15 C65 22 58 25 50 25 C42 25 35 22 30 15Z"
          stroke="white"
          strokeWidth="3"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  }
  if (
    cat.includes("bottom") ||
    cat.includes("pant") ||
    cat.includes("trouser") ||
    cat.includes("jean")
  ) {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={style}
        aria-hidden="true"
      >
        <path
          d="M20 20 L80 20 L72 55 L62 85 L50 70 L38 85 L28 55Z"
          stroke="white"
          strokeWidth="3"
          strokeLinejoin="round"
          fill="none"
        />
        <line x1="50" y1="20" x2="50" y2="70" stroke="white" strokeWidth="3" />
      </svg>
    );
  }
  if (cat.includes("skirt")) {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={style}
        aria-hidden="true"
      >
        <path
          d="M30 20 L70 20 L85 82 L15 82Z"
          stroke="white"
          strokeWidth="3"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  }
  if (
    cat.includes("shoe") ||
    cat.includes("footwear") ||
    cat.includes("sneaker") ||
    cat.includes("heel") ||
    cat.includes("sandal")
  ) {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={style}
        aria-hidden="true"
      >
        <path
          d="M15 65 C15 65 20 40 35 38 L55 38 C65 38 80 45 85 60 L85 70 C85 75 80 78 75 78 L20 78 C16 78 13 74 15 65Z"
          stroke="white"
          strokeWidth="3"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M35 38 L35 28 C35 24 38 20 42 20 L50 20"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    );
  }
  if (
    cat.includes("bag") ||
    cat.includes("purse") ||
    cat.includes("handbag") ||
    cat.includes("clutch")
  ) {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={style}
        aria-hidden="true"
      >
        <rect
          x="20"
          y="38"
          width="60"
          height="48"
          rx="6"
          stroke="white"
          strokeWidth="3"
          fill="none"
        />
        <path
          d="M35 38 C35 28 40 20 50 20 C60 20 65 28 65 38"
          stroke="white"
          strokeWidth="3"
          fill="none"
        />
      </svg>
    );
  }
  if (
    cat.includes("jacket") ||
    cat.includes("coat") ||
    cat.includes("blazer") ||
    cat.includes("suit")
  ) {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={style}
        aria-hidden="true"
      >
        <path
          d="M35 12 L15 30 L28 34 L28 85 L72 85 L72 34 L85 30 L65 12"
          stroke="white"
          strokeWidth="3"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M35 12 L42 30 L50 28 L58 30 L65 12"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
        <line
          x1="50"
          y1="30"
          x2="50"
          y2="60"
          stroke="white"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
      </svg>
    );
  }
  if (
    cat.includes("saree") ||
    cat.includes("sari") ||
    cat.includes("ethnic") ||
    cat.includes("kurta") ||
    cat.includes("dupatta") ||
    cat.includes("stole") ||
    cat.includes("scarf")
  ) {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={style}
        aria-hidden="true"
      >
        <path
          d="M50 10 C50 10 42 18 38 28 L35 85 L50 75 L65 85 L62 28 C58 18 50 10 50 10Z"
          stroke="white"
          strokeWidth="3"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M38 28 C38 28 28 32 20 55 L35 85"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
        <path
          d="M62 28 C62 28 72 32 80 55 L65 85"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
        <line x1="38" y1="42" x2="62" y2="42" stroke="white" strokeWidth="2" />
      </svg>
    );
  }
  if (
    cat.includes("access") ||
    cat.includes("watch") ||
    cat.includes("jewel") ||
    cat.includes("necklace") ||
    cat.includes("ring")
  ) {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={style}
        aria-hidden="true"
      >
        <rect
          x="8"
          y="38"
          width="35"
          height="24"
          rx="10"
          stroke="white"
          strokeWidth="3"
          fill="none"
        />
        <rect
          x="57"
          y="38"
          width="35"
          height="24"
          rx="10"
          stroke="white"
          strokeWidth="3"
          fill="none"
        />
        <line x1="43" y1="50" x2="57" y2="50" stroke="white" strokeWidth="3" />
      </svg>
    );
  }
  if (cat.includes("dress")) {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={style}
        aria-hidden="true"
      >
        <path
          d="M38 12 L28 30 L18 82 L82 82 L72 30 L62 12 C58 18 52 20 50 20 C48 20 42 18 38 12Z"
          stroke="white"
          strokeWidth="3"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  }
  if (cat.includes("turban")) {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={style}
        aria-hidden="true"
      >
        <path
          d="M50 15 C30 15 15 30 15 45 C15 58 28 70 50 70 C72 70 85 58 85 45 C85 30 70 15 50 15Z"
          stroke="white"
          strokeWidth="3"
          fill="none"
        />
        <path
          d="M15 45 Q20 35 50 38 Q80 35 85 45"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
      </svg>
    );
  }
  // Default: generic garment
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      aria-hidden="true"
    >
      <path
        d="M30 15 L15 35 L28 38 L28 82 L72 82 L72 38 L85 35 L70 15 C65 22 58 25 50 25 C42 25 35 22 30 15Z"
        stroke="white"
        strokeWidth="3"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function PaletteIconCard({ garmentType, hexColor }: PaletteIconCardProps) {
  const cat = garmentType.toLowerCase();
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ background: hexColor }}
    >
      <PaletteIconIcon cat={cat} />
    </div>
  );
}

interface ProductCardProps {
  product: ProductItem;
  colorHex: string;
  colorName: string;
  index: number;
}

function ProductCard({
  product,
  colorHex,
  colorName,
  index,
}: ProductCardProps) {
  const keyword = GARMENT_KEYWORD_MAP[product.garmentLabel] ?? "clothing";
  const availableRetailers = getAvailableRetailers();

  return (
    <motion.div
      className="ios-card creamy-card overflow-hidden flex-shrink-0"
      style={{ width: 160 }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: index * 0.06,
        type: "spring",
        stiffness: 350,
        damping: 28,
      }}
      data-ocid={`scanner.item.${index + 1}`}
    >
      <div className="relative" style={{ aspectRatio: "4/5" }}>
        <PaletteIconCard
          garmentType={product.garmentLabel}
          hexColor={colorHex}
        />
        {/* Color chip — shows selected palette color reliably on mobile */}
        <div
          className="absolute top-1.5 right-1.5 flex items-center gap-1 rounded-full px-1.5 py-0.5"
          style={{
            backgroundColor: colorHex,
            boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
          }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-white/50" />
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-8"
          style={{ background: `linear-gradient(transparent, ${colorHex}60)` }}
        />
      </div>
      <div className="p-2.5">
        <p className="text-xs font-semibold text-foreground leading-tight mb-2 line-clamp-2">
          {colorName} {product.garmentLabel}
        </p>
        <div className="flex flex-wrap gap-1">
          {availableRetailers.map((retailer) => (
            <a
              key={retailer.key}
              href={buildRetailerUrl(retailer.key, keyword, colorName)}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-[8px] font-bold rounded-full px-1.5 py-0.5 transition-opacity hover:opacity-80 ${retailer.badgeClass}`}
              data-ocid="scanner.link"
            >
              {retailer.badge}
            </a>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── ShopMatchingStyles ─────────────────────────────────────────────────────
interface ShopMatchingStylesProps {
  garment: (typeof GARMENT_TYPES)[0];
  colorHex: string;
  colorName: string;
  userGender: string;
  selectedMatchingColor: { hex: string; name: string } | null;
  allowedGarments?: string[];
  sizeHint?: string;
  moodKeyword?: string;
}

function ShopMatchingStyles({
  garment,
  colorHex,
  colorName,
  userGender,
  selectedMatchingColor,
  allowedGarments,
  sizeHint,
  moodKeyword,
}: ShopMatchingStylesProps) {
  const [layoutMode, setLayoutMode] = useState<"accordion" | "tabs">("tabs");
  const [activeRetailerTab, setActiveRetailerTab] = useState(0);

  const shopColor = selectedMatchingColor ?? { hex: colorHex, name: colorName };
  const complementaryLabels = getComplementaryLabels(garment.label, userGender);

  const sections = complementaryLabels
    .map((label) => ({
      label,
      garment: GARMENT_TYPES.find((g) => g.label === label),
      products: getProductsForGarment(label, userGender),
    }))
    .filter((s) => s.garment && s.products.length > 0)
    .filter((s) => !allowedGarments || allowedGarments.includes(s.label));

  const allRetailers = RETAILERS;

  if (sections.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No suggestions available for this selection.
        </p>
      </div>
    );
  }

  const renderProductSections = () => (
    <AnimatePresence mode="wait">
      <motion.div
        key={shopColor.hex}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="space-y-3"
      >
        {sections.map((section, si) => (
          <motion.div
            key={section.label}
            className="space-y-2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: si * 0.07,
              type: "spring",
              stiffness: 350,
              damping: 28,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{section.garment!.emoji}</span>
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                {section.label}
              </span>
              <div className="flex-1 h-px bg-border/40" />
            </div>
            <div
              className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1"
              style={{ scrollbarWidth: "none" }}
            >
              {section.products.map((product, pi) => (
                <ProductCard
                  key={`${product.garmentLabel}-${pi}-${shopColor.hex}`}
                  product={product}
                  colorHex={shopColor.hex}
                  colorName={shopColor.name}
                  index={si * 4 + pi}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );

  return (
    <div className="space-y-3 p-4">
      {/* Header row: color context + layout toggle */}
      <div className="flex items-center gap-2">
        <div
          className="w-4 h-4 rounded-full swatch-shadow flex-shrink-0"
          style={{ backgroundColor: shopColor.hex }}
        />
        <span className="text-xs text-muted-foreground flex-1">
          Showing products for:{" "}
          <span className="font-semibold text-foreground">
            {shopColor.name}
          </span>
        </span>
        {/* Layout toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-xl p-0.5">
          <button
            type="button"
            onClick={() => setLayoutMode("accordion")}
            className={`p-1.5 rounded-lg transition-all ${
              layoutMode === "accordion"
                ? "bg-background shadow text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="By garment type"
            data-ocid="scanner.toggle"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setLayoutMode("tabs")}
            className={`p-1.5 rounded-lg transition-all ${
              layoutMode === "tabs"
                ? "bg-background shadow text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="By retailer"
            data-ocid="scanner.toggle"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {layoutMode === "accordion" ? (
          <motion.div
            key="accordion"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            {renderProductSections()}
          </motion.div>
        ) : (
          <motion.div
            key="tabs"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="space-y-3"
          >
            {/* Retailer tabs */}
            <div
              className="flex gap-2 overflow-x-auto pb-1"
              style={{ scrollbarWidth: "none" }}
            >
              {allRetailers.map((retailer, ri) => (
                <button
                  key={retailer.key}
                  type="button"
                  onClick={() => setActiveRetailerTab(ri)}
                  className={`flex-shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all border ${
                    activeRetailerTab === ri
                      ? "text-white border-transparent shadow-sm"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                  style={
                    activeRetailerTab === ri
                      ? {
                          backgroundColor: retailer.color,
                          borderColor: retailer.color,
                        }
                      : {}
                  }
                  data-ocid="scanner.tab"
                >
                  {retailer.badge}
                </button>
              ))}
            </div>

            {/* Active retailer content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeRetailerTab + shopColor.hex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="space-y-3"
              >
                {(() => {
                  const retailer = allRetailers[activeRetailerTab];
                  const firstKeyword =
                    GARMENT_KEYWORD_MAP[sections[0]?.label ?? ""] ?? "clothing";
                  return (
                    <>
                      {sections.map((section, si) => (
                        <div key={section.label} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-base">
                              {section.garment!.emoji}
                            </span>
                            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                              {section.label}
                            </span>
                            <div className="flex-1 h-px bg-border/40" />
                          </div>
                          <div
                            className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1"
                            style={{ scrollbarWidth: "none" }}
                          >
                            {section.products.slice(0, 3).map((product, pi) => (
                              <motion.div
                                key={`${product.garmentLabel}-${pi}`}
                                className="ios-card creamy-card overflow-hidden flex-shrink-0"
                                style={{ width: 120 }}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  delay: (si * 3 + pi) * 0.05,
                                  type: "spring",
                                  stiffness: 350,
                                  damping: 28,
                                }}
                                data-ocid={`scanner.item.${si * 3 + pi + 1}`}
                              >
                                <div
                                  className="relative"
                                  style={{ aspectRatio: "4/5" }}
                                >
                                  <PaletteIconCard
                                    garmentType={product.garmentLabel}
                                    hexColor={shopColor.hex}
                                  />
                                  <div
                                    className="absolute top-1.5 right-1.5 flex items-center gap-1 rounded-full px-1.5 py-0.5"
                                    style={{
                                      backgroundColor: shopColor.hex,
                                      boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
                                    }}
                                  >
                                    <div className="w-2.5 h-2.5 rounded-full bg-white/50" />
                                  </div>
                                </div>
                                <div className="p-2">
                                  <p className="text-[10px] font-semibold text-foreground leading-tight line-clamp-2">
                                    {shopColor.name} {product.garmentLabel}
                                  </p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      ))}
                      {/* ONE consolidated shop link per retailer tab */}
                      <a
                        href={buildRetailerUrl(
                          retailer.key,
                          firstKeyword,
                          shopColor.name,
                          moodKeyword,
                          userGender,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-center gap-1.5 w-full text-[11px] font-bold rounded-xl py-2.5 text-white transition-opacity hover:opacity-80 ${retailer.badgeClass}`}
                        data-ocid="scanner.link"
                      >
                        Shop {shopColor.name} on {retailer.badge} →
                      </a>
                      {sizeHint && (
                        <span className="block text-center text-[9px] text-muted-foreground">
                          Suggested size: {sizeHint}
                        </span>
                      )}
                    </>
                  );
                })()}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Outfit Card ────────────────────────────────────────────────────────────
interface OutfitCardProps {
  outfit: OutfitSuggestion;
  index: number;
  gender: string;
}

function OutfitCard({ outfit, index, gender: _gender }: OutfitCardProps) {
  const _hairStyleKey = (["short", "medium", "long", "curly"] as const)[
    index % 4
  ];

  const handleSave = () => {
    const key = "cc_saved_looks";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    const entry = {
      ...outfit,
      id: Date.now(),
      savedAt: new Date().toISOString(),
    };
    existing.unshift(entry);
    localStorage.setItem(key, JSON.stringify(existing.slice(0, 50)));
    toast.success(`"${outfit.title}" saved to Favourites!`, { icon: "❤️" });
  };

  const handleShare = async () => {
    const text = `${outfit.title}
💇 ${outfit.hairstyle}
👕 ${outfit.top.label} (${outfit.top.color})
👖 ${outfit.bottom.label} (${outfit.bottom.color})
👟 ${outfit.shoes.label} (${outfit.shoes.color})
⌚ ${outfit.accessory.label} (${outfit.accessory.color})${
      outfit.bag
        ? `
👜 ${outfit.bag.label} (${outfit.bag.color})`
        : ""
    }`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: outfit.title, text });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Look copied to clipboard!");
    }
  };

  const items = [
    { emoji: "💇", label: "Hairstyle", value: outfit.hairstyle, hex: null },
    {
      emoji: "👕",
      label: outfit.top.label,
      value: outfit.top.color,
      hex: outfit.top.hex,
    },
    {
      emoji: "👖",
      label: outfit.bottom.label,
      value: outfit.bottom.color,
      hex: outfit.bottom.hex,
    },
    {
      emoji: "👟",
      label: outfit.shoes.label,
      value: outfit.shoes.color,
      hex: outfit.shoes.hex,
    },
    {
      emoji: "⌚",
      label: outfit.accessory.label,
      value: outfit.accessory.color,
      hex: outfit.accessory.hex,
    },
    ...(outfit.bag
      ? [
          {
            emoji: "👜",
            label: outfit.bag.label,
            value: outfit.bag.color,
            hex: outfit.bag.hex,
          },
        ]
      : []),
  ];

  return (
    <motion.div
      className="ios-card overflow-hidden flex-shrink-0 flex flex-col"
      style={{ width: 240 }}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: index * 0.08,
        type: "spring",
        stiffness: 340,
        damping: 28,
      }}
      data-ocid={`scanner.item.${index + 1}`}
    >
      {/* Card header */}
      <div className="px-3 pt-3 pb-1">
        <p className="font-display font-bold text-xs text-primary leading-tight">
          {outfit.title}
        </p>
      </div>

      {/* Item list */}
      <div className="px-3 py-2 space-y-1.5 flex-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="text-sm w-5 flex-shrink-0">{item.emoji}</span>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-foreground font-medium truncate block">
                {item.label}
              </span>
              <span className="text-[9px] text-muted-foreground">
                {item.value}
              </span>
            </div>
            {item.hex && (
              <div
                className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: item.hex,
                  boxShadow: "0 0 0 1px oklch(var(--border))",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div
        className="flex gap-2 px-3 pb-3 pt-2"
        style={{ borderTop: "0.5px solid oklch(var(--border))" }}
      >
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          data-ocid={`scanner.secondary_button.${index + 1}`}
        >
          <Heart className="w-3.5 h-3.5" />
          Save
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
          data-ocid={`scanner.button.${index + 1}`}
        >
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>
      </div>
    </motion.div>
  );
}

// ── Local harmony palette generator ───────────────────────────────────────
function generateLocalHarmonyPalette(hex: string): HarmonyPalette {
  const [h, s, l] = hexToHsl(hex);
  const sBase = Math.max(s, 0.25);
  const mkColor = (hue: number, sat: number, lit: number) => {
    const h2 = hslToHex(hue, sat, lit);
    return { hex: h2, name: hexToColorName(h2) };
  };
  const complementary = [
    mkColor(h + 180, sBase, l),
    mkColor(h + 180, sBase * 0.75, l + (l < 0.5 ? 0.15 : -0.15)),
  ];
  const analogous = [
    mkColor(h + 30, sBase, l),
    mkColor(h - 30, sBase, l),
    mkColor(h + 15, sBase * 0.9, l + 0.05),
  ];
  const triadic = [mkColor(h + 120, sBase, l), mkColor(h + 240, sBase, l)];
  const cn = hexToColorName(hex).toLowerCase();
  let styleTip = `${hexToColorName(hex)} is versatile — it pairs well with neutrals and earthy tones for a cohesive, stylish outfit.`;
  if (cn.includes("blue"))
    styleTip = `${hexToColorName(hex)} pairs beautifully with neutral whites, creams, and sandy tones. Ideal for polished or relaxed looks.`;
  else if (cn.includes("red") || cn.includes("rose"))
    styleTip = `${hexToColorName(hex)} is bold — balance it with neutral or monochrome pieces for maximum impact.`;
  else if (cn.includes("green"))
    styleTip = `${hexToColorName(hex)} works best with earthy neutrals and warm brown accessories.`;
  else if (cn.includes("yellow") || cn.includes("gold"))
    styleTip = `${hexToColorName(hex)} pops against deep navies or crisp whites. Keep accessories minimal.`;
  else if (cn.includes("purple") || cn.includes("indigo"))
    styleTip = `${hexToColorName(hex)} is rich and luxurious — pair with soft greys or ivory for sophisticated balance.`;
  return { complementary, analogous, triadic, styleTip };
}

// ── Page ───────────────────────────────────────────────────────────────────

// ── Color of the Day Banner ────────────────────────────────────────────────
const COLOR_OF_DAY_PALETTE = [
  { name: "Crimson Red", hex: "#DC143C" },
  { name: "Cobalt Blue", hex: "#0047AB" },
  { name: "Sage Green", hex: "#87AE73" },
  { name: "Dusty Rose", hex: "#DCAE96" },
  { name: "Mustard Yellow", hex: "#FFDB58" },
  { name: "Burnt Orange", hex: "#CC5500" },
  { name: "Lavender", hex: "#967BB6" },
  { name: "Teal", hex: "#008080" },
  { name: "Champagne", hex: "#F7E7CE" },
  { name: "Slate Blue", hex: "#6A5ACD" },
  { name: "Terracotta", hex: "#E2725B" },
  { name: "Forest Green", hex: "#228B22" },
  { name: "Blush Pink", hex: "#FF6EB4" },
  { name: "Ivory White", hex: "#FFFFF0" },
  { name: "Charcoal", hex: "#36454F" },
  { name: "Coral", hex: "#FF7F50" },
  { name: "Peacock Blue", hex: "#005F6B" },
  { name: "Marigold", hex: "#EAA221" },
  { name: "Plum", hex: "#DDA0DD" },
  { name: "Caramel", hex: "#C68642" },
  { name: "Jade", hex: "#00A86B" },
  { name: "Berry", hex: "#8E2D56" },
  { name: "Powder Blue", hex: "#B0C4DE" },
  { name: "Warm Sand", hex: "#C2B280" },
  { name: "Lilac", hex: "#C8A2C8" },
  { name: "Deep Navy", hex: "#17375E" },
  { name: "Olive", hex: "#808000" },
  { name: "Peach", hex: "#FFCBA4" },
  { name: "Ruby", hex: "#9B111E" },
  { name: "Emerald", hex: "#50C878" },
];

const COLOR_OF_DAY_TIPS: Record<string, string> = {
  "Crimson Red": "Bold and passionate — pair with navy or ivory for impact.",
  "Cobalt Blue": "Timeless confidence — great with white, grey, or camel.",
  "Sage Green": "Earthy and calming — works beautifully with tan and cream.",
  "Dusty Rose": "Soft romance — complement with beige, ivory, or mauve.",
  "Mustard Yellow": "Cheerful warmth — pair with deep brown or forest green.",
  "Burnt Orange": "Autumnal energy — stunning with navy, cream, or olive.",
  Lavender: "Dreamy softness — pair with white, lilac, or silver.",
  Teal: "Sophisticated cool — combine with gold, coral, or white.",
  Champagne: "Understated luxury — works with any neutral or pastels.",
  "Slate Blue": "Moody elegance — great with burgundy or soft grey.",
  Terracotta: "Earthy warmth — stunning with turquoise or sand tones.",
  "Forest Green": "Rich nature — pair with cognac, cream, or gold.",
  "Blush Pink": "Feminine freshness — beautiful with white or nude tones.",
  "Ivory White": "Clean clarity — pairs with anything, especially jewel tones.",
  Charcoal: "Understated power — accent with any pop color.",
  Coral: "Vibrant warmth — pairs with teal, navy, or light gold.",
  "Peacock Blue": "Jewel-toned depth — great with copper or white.",
  Marigold: "Sun-kissed energy — pair with deep purple or navy.",
  Plum: "Rich drama — combine with dusty pink or champagne.",
  Caramel: "Warm luxe — stunning with ivory, rust, or deep teal.",
  Jade: "Vibrant elegance — pair with cream, gold, or navy.",
  Berry: "Bold femininity — works with lavender or soft gold.",
  "Powder Blue": "Serene softness — pair with white, silver, or blush.",
  "Warm Sand": "Desert neutrality — goes with everything earthy.",
  Lilac: "Soft ethereal — pairs with dusty rose or dove grey.",
  "Deep Navy": "Classic authority — accent with white, gold, or red.",
  Olive: "Cool utilitarian — great with tan, rust, or mustard.",
  Peach: "Sweet warmth — beautiful with coral, cream, or mint.",
  Ruby: "Passionate drama — pair with black, ivory, or gold.",
  Emerald: "Regal vibrancy — stunning with gold, cream, or black.",
};

function getColorOfDay() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86400000,
  );
  return COLOR_OF_DAY_PALETTE[dayOfYear % COLOR_OF_DAY_PALETTE.length];
}

function ColorOfDayBanner() {
  const [dismissed, setDismissed] = useState(() => {
    const key = "colourClash_colorOfDay_date";
    return localStorage.getItem(key) === new Date().toDateString();
  });
  const color = getColorOfDay();
  const tip =
    COLOR_OF_DAY_TIPS[color.name] ?? "A stunning choice for today's look!";

  const handleDismiss = () => {
    localStorage.setItem(
      "colourClash_colorOfDay_date",
      new Date().toDateString(),
    );
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <motion.div
      className="ios-card overflow-hidden"
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      data-ocid="scanner.card"
    >
      <div className="h-1" style={{ backgroundColor: color.hex }} />
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="w-10 h-10 rounded-2xl flex-shrink-0 swatch-shadow border-2 border-white/20"
          style={{ backgroundColor: color.hex }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              Colour of the Day
            </span>
          </div>
          <p className="text-sm font-black text-foreground">{color.name}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">
            {tip}
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          data-ocid="scanner.close_button"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div style={{ borderTop: "0.5px solid oklch(var(--border))" }} />
      <div className="px-4 py-2.5">
        <p className="text-[10px] text-muted-foreground mb-2">
          Quick shop in {color.name}:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {RETAILERS.slice(0, 5).map((retailer) => (
            <a
              key={retailer.key}
              href={buildRetailerUrl(retailer.key, "clothing", color.name)}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-[9px] font-bold rounded-full px-2 py-1 transition-opacity hover:opacity-80 ${retailer.badgeClass}`}
              data-ocid="scanner.link"
            >
              {retailer.badge}
            </a>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── Color Psychology ──────────────────────────────────────────────────────
function getColorPsychology(hex: string): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  if (delta !== 0) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue = Math.round(hue * 60);
    if (hue < 0) hue += 360;
  }
  const saturation = max === 0 ? 0 : delta / max;
  if (saturation < 0.15)
    return "Neutrals convey elegance and versatility — they pair with everything and let your accessories do the talking.";
  if (hue < 20 || hue >= 345)
    return "Red signals confidence and passion — a bold statement that commands attention and makes powerful first impressions.";
  if (hue < 45)
    return "Orange radiates warmth and creativity — it sparks conversation and shows an adventurous, energetic personality.";
  if (hue < 70)
    return "Yellow exudes optimism and positivity — it brightens any look and reflects an approachable, cheerful spirit.";
  if (hue < 150)
    return "Green evokes freshness and balance — grounding yet stylish, perfect for casual days and nature-inspired looks.";
  if (hue < 195)
    return "Teal blends calm with sophistication — a refined choice that feels both modern and effortlessly put-together.";
  if (hue < 255)
    return "Blue projects calm authority and trust — ideal for interviews, meetings, or any day you want to feel in control.";
  if (hue < 290)
    return "Purple carries an air of creativity and luxury — it signals originality and a flair for the finer things.";
  return "Pink brings warmth and playfulness — it softens a look beautifully and radiates approachable confidence.";
}

// ── Age profile helper ───────────────────────────────────────────────────
type AgeCategory = "kid" | "teenage" | "young" | "adult" | "senior";

function getAgeProfile(age: AgeCategory) {
  switch (age) {
    case "kid":
      return {
        allowedGarments: [
          "Top",
          "Pant",
          "Shoes",
          "Bag",
          "Hoodie",
          "Shorts",
          "Jeans",
          "Sneakers",
        ],
        sizeHint: "XS/S",
        excludeCategories: ["formal", "ethnic-adult", "saree"],
      };
    case "teenage":
      return {
        allowedGarments: [
          "Top",
          "Pant",
          "Jacket",
          "Shoes",
          "Watch",
          "Bag",
          "Hoodie",
          "Shorts",
          "Jeans",
          "Sneakers",
          "Dress",
        ],
        sizeHint: "S/M",
        excludeCategories: ["saree", "ethnic-adult"],
      };
    case "young":
      return {
        allowedGarments: GARMENT_TYPES.map((g) => g.label),
        sizeHint: "M/L",
        excludeCategories: [],
      };
    case "adult":
      return {
        allowedGarments: GARMENT_TYPES.map((g) => g.label),
        sizeHint: "M/L/XL",
        excludeCategories: [],
      };
    case "senior":
      return {
        allowedGarments: [
          "Top",
          "Pant",
          "Kurta",
          "Saree",
          "Shoes",
          "Stole",
          "Ethnic Wear",
          "Suit",
          "Watch",
        ],
        sizeHint: "L/XL/XXL",
        excludeCategories: ["streetwear", "crop", "mini"],
      };
  }
}

function getMoodKeyword(mood: string, occasion: string): string {
  const moodMap: Record<string, string> = {
    formal: "formal",
    party: "party wear",
    "date night": "date night",
    festive: "festive",
    casual: "",
  };
  const occasionMap: Record<string, string> = {
    office: "office wear",
    wedding: "wedding",
    outdoor: "outdoor casual",
    travel: "travel",
  };
  const parts = [moodMap[mood] ?? "", occasionMap[occasion] ?? ""].filter(
    Boolean,
  );
  return parts.join(" ");
}

export default function ScannerPage() {
  const [lockedColor, setLockedColor] = useState<string | null>(null);
  const [detectedColor, setDetectedColor] = useState<string>("#808080");
  const [adviceHex, setAdviceHex] = useState<string>("#808080");
  const [localAdvice, setLocalAdvice] = useState<HarmonyPalette | null>(() =>
    generateLocalHarmonyPalette("#808080"),
  );
  const [selectedGarment, setSelectedGarment] = useState<
    (typeof GARMENT_TYPES)[0] | null
  >(null);
  const [selectedMatchingColor, setSelectedMatchingColor] = useState<{
    hex: string;
    name: string;
  } | null>(null);
  const [colorHistory, setColorHistory] = useState<string[]>([]);
  const {
    gender: selectedGender,
    age: selectedAge,
    size: selectedSize,
    aiPlatform: selectedAI,
    setGender: setSelectedGender,
    setAge: setSelectedAge,
    setSize: setSelectedSize,
    setAiPlatform: setSelectedAI,
  } = useFilters();
  const [selectedMood, _setSelectedMood] = useState<string>("casual");
  const [selectedOccasion, _setSelectedOccasion] = useState<string>("");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [aiConnected, setAiConnected] = useState<boolean>(false);

  const detectedColorRef = useRef<string>("#808080");
  const samplingCanvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { userProfile } = useUserProfile();
  const userGender = userProfile?.gender ?? "all";
  const ageProfile = getAgeProfile(selectedAge);
  const moodKeyword = getMoodKeyword(selectedMood, selectedOccasion);

  // Gender/age auto-filled by FilterContext from profile

  const {
    videoRef,
    canvasRef,
    isActive,
    isLoading,
    error,
    startCamera,
    retry,
    isSupported,
  } = useCamera({ facingMode: "environment" });

  const addFavorite = useAddFavorite();
  const { data: harmonyData, isFetching: isLoadingAdvice } =
    useGetHarmonyAdvice(adviceHex);

  const activeColor = lockedColor ?? detectedColor;
  const colorName = getColorName(activeColor);
  const _colorFamily = getColorFamily(activeColor);
  const advice = localAdvice ?? harmonyData;
  const garment = selectedGarment ?? detectGarmentFromHex(activeColor);
  const _garmentKeyword = GARMENT_KEYWORD_MAP[garment.label] ?? "clothing";
  const matchingColors = generateMatchingColors(activeColor);
  const showShoppingSection = lockedColor !== null;
  const outfits = showShoppingSection
    ? generateOutfits(activeColor, garment.label, userGender)
    : [];

  const [cameraStarted, setCameraStarted] = useState(false);

  useEffect(() => {
    detectedColorRef.current = detectedColor;
  }, [detectedColor]);

  useEffect(() => {
    if (lockedColor) return;
    setAdviceHex(detectedColor);
    setLocalAdvice(generateLocalHarmonyPalette(detectedColor));
  }, [detectedColor, lockedColor]);

  useEffect(() => {
    if (!isActive) return;
    intervalRef.current = setInterval(() => {
      const video = videoRef.current;
      const canvas = samplingCanvasRef.current;
      if (!video || !canvas || lockedColor) return;
      const color = sampleVideoColor(video, canvas);
      if (color) setDetectedColor(color);
    }, 500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, lockedColor, videoRef]);

  useEffect(() => {
    if (harmonyData) setLocalAdvice(harmonyData);
  }, [harmonyData]);

  // Restore aiConnected from localStorage when selectedAI changes
  useEffect(() => {
    if (selectedAI) {
      setAiConnected(
        localStorage.getItem(`cc_ai_connected_${selectedAI}`) === "1",
      );
    } else {
      setAiConnected(false);
    }
  }, [selectedAI]);

  const handleLockColor = useCallback(() => {
    if (lockedColor) {
      setLockedColor(null);
      setSelectedGarment(null);
      setSelectedMatchingColor(null);
      setAdviceHex(detectedColorRef.current);
      setLocalAdvice(generateLocalHarmonyPalette(detectedColorRef.current));
    } else {
      const hex = detectedColorRef.current;
      setLockedColor(hex);
      setColorHistory((prev) => {
        const filtered = prev.filter((c) => c !== hex);
        return [hex, ...filtered].slice(0, 5);
      });
      setAdviceHex(hex);
      setLocalAdvice(generateLocalHarmonyPalette(hex));
      toast.success(`Color locked: ${hexToColorName(hex)}`);
    }
  }, [lockedColor]);

  const handleGetAdvice = useCallback(() => {
    setAdviceHex(activeColor);
    setLocalAdvice(generateLocalHarmonyPalette(activeColor));
    toast.success("Style advice ready!");
  }, [activeColor]);

  const handleSaveFavorite = useCallback(async () => {
    if (!advice) {
      toast.error("Get AI advice first!");
      return;
    }
    await addFavorite.mutateAsync({
      hex: activeColor,
      name: colorName,
      harmonyPalette: JSON.stringify(advice),
    });
    toast.success(`${colorName} saved to favorites!`);
  }, [activeColor, colorName, advice, addFavorite]);

  const handleHistorySwatch = useCallback((hex: string) => {
    setDetectedColor(hex);
    setLockedColor(hex);
    setSelectedMatchingColor(null);
    toast.info(`Loaded: ${hexToColorName(hex)}`);
  }, []);

  const getHarmonyStatus = (): {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  } => {
    if (!advice) return { label: "SCAN TO DETECT", variant: "outline" };
    const comp = advice.complementary[0]?.hex ?? "#000000";
    const r1 = Number.parseInt(activeColor.slice(1, 3), 16);
    const g1 = Number.parseInt(activeColor.slice(3, 5), 16);
    const b1 = Number.parseInt(activeColor.slice(5, 7), 16);
    const lum1 = 0.299 * r1 + 0.587 * g1 + 0.114 * b1;
    if (comp) {
      const r2 = Number.parseInt(comp.slice(1, 3), 16);
      const g2 = Number.parseInt(comp.slice(3, 5), 16);
      const b2 = Number.parseInt(comp.slice(5, 7), 16);
      const lum2 = 0.299 * r2 + 0.587 * g2 + 0.114 * b2;
      const ratio = Math.abs(lum1 - lum2) / 255;
      if (ratio > 0.5) return { label: "EXCELLENT!", variant: "default" };
      if (ratio > 0.25) return { label: "GOOD", variant: "secondary" };
    }
    return { label: "NEUTRAL", variant: "outline" };
  };

  const harmonyStatus = getHarmonyStatus();

  // Auto-generate style tip from colour name
  const getScannedStyleTip = (): string => {
    if (advice?.styleTip) return advice.styleTip;
    const cn = colorName.toLowerCase();
    if (cn.includes("blue"))
      return `${colorName} pairs beautifully with neutral whites, creams, and sandy tones. Ideal for polished or relaxed looks.`;
    if (cn.includes("red") || cn.includes("rose"))
      return `${colorName} is bold — balance it with neutral or monochrome pieces for maximum impact.`;
    if (cn.includes("green"))
      return `${colorName} works best with earthy neutrals and warm brown accessories.`;
    if (cn.includes("yellow") || cn.includes("gold"))
      return `${colorName} pops against deep navies or crisp whites. Keep accessories minimal.`;
    if (cn.includes("purple") || cn.includes("indigo"))
      return `${colorName} is rich and luxurious — pair with soft greys or ivory for sophisticated balance.`;
    return `${colorName} is versatile — it pairs well with neutrals and earthy tones for a cohesive, stylish outfit.`;
  };

  const getMatchedPairingTip = (
    _matchedHex: string,
    matchedName: string,
  ): string => {
    return `${matchedName} creates a harmonious contrast with your ${garment.label.toLowerCase()}. Try it in a complementary piece to complete the look.`;
  };

  const displayMatchedColor =
    selectedMatchingColor ??
    (advice?.complementary?.[0]
      ? {
          hex: advice.complementary[0].hex,
          name:
            advice.complementary[0].name ||
            hexToColorName(advice.complementary[0].hex),
        }
      : null);

  return (
    <div className="flex flex-col gap-5 pb-4">
      {/* ── Colour of the Day ── */}
      <AnimatePresence>
        <ColorOfDayBanner />
      </AnimatePresence>

      {/* ── Filters (Collapsible) ── */}
      <motion.div
        className="ios-card overflow-hidden"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        data-ocid="scanner.panel"
      >
        {/* Toggle header */}
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 pt-3 pb-2.5"
          data-ocid="scanner.toggle"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            🎛 Filters
          </span>
          <div className="flex items-center gap-2">
            {!filtersOpen && (
              <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                {selectedGender === "male" ? "👔 Male" : "👗 Female"} ·{" "}
                {selectedAge}
              </span>
            )}
            <span className="text-muted-foreground text-xs">
              {filtersOpen ? "▲" : "▼"}
            </span>
          </div>
        </button>

        {/* Collapsible content */}
        {filtersOpen && (
          <div className="px-4 pb-3 space-y-2.5">
            {/* Gender toggle */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-14 flex-shrink-0">
                Gender
              </span>
              <div
                className="relative flex bg-muted rounded-full p-0.5"
                style={{ width: 164 }}
              >
                <div
                  className="absolute top-0.5 bottom-0.5 w-1/2 rounded-full bg-primary shadow-sm transition-all duration-200"
                  style={{ left: selectedGender === "male" ? "2px" : "50%" }}
                />
                {(["male", "female"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSelectedGender(g)}
                    className={`relative z-10 flex-1 py-1 text-xs font-semibold transition-colors duration-200 rounded-full ${selectedGender === g ? "text-primary-foreground" : "text-muted-foreground"}`}
                    data-ocid="scanner.toggle"
                  >
                    {g === "male" ? "👔 Male" : "👗 Female"}
                  </button>
                ))}
              </div>
            </div>

            {/* Age chips */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-14 flex-shrink-0">
                Age
              </span>
              <div
                className="flex gap-1.5 overflow-x-auto"
                style={{ scrollbarWidth: "none" }}
              >
                {(["kid", "teenage", "young", "adult", "senior"] as const).map(
                  (a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setSelectedAge(a)}
                      className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all capitalize ${
                        selectedAge === a
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                      data-ocid="scanner.toggle"
                    >
                      {a}
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* Size dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-14 flex-shrink-0">
                Size
              </span>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="bg-muted border border-border/60 rounded-full px-2.5 py-1 text-[11px] font-semibold text-foreground appearance-none cursor-pointer"
                data-ocid="scanner.select"
              >
                {["S", "M", "L", "XL", "XXL", "XXXL"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* AI Platform selector */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-14 flex-shrink-0">
                🤖 AI
              </span>
              <select
                value={selectedAI}
                onChange={(e) => setSelectedAI(e.target.value)}
                className="flex-1 text-[11px] font-semibold bg-muted border border-border/60 rounded-full px-2.5 py-1 text-foreground appearance-none cursor-pointer"
                data-ocid="scanner.select"
                style={{ maxWidth: 200 }}
              >
                <option value="">None (Internal Engine)</option>
                <option value="gemini">Google Gemini</option>
                <option value="chatgpt">ChatGPT</option>
                <option value="metallamа">Meta LLaMA</option>
                <option value="grok">Grok</option>
              </select>
            </div>
            {selectedAI && (
              <p
                className={`text-[10px] pl-16 ${aiConnected ? "text-green-600 dark:text-green-400" : "text-primary/70"}`}
              >
                {aiConnected
                  ? `✅ ${selectedAI === "gemini" ? "Google Gemini" : selectedAI === "chatgpt" ? "ChatGPT" : selectedAI === "metallamа" ? "Meta LLaMA" : "Grok"} connected — enhanced suggestions active`
                  : "Suggestions will appear as per your selected AI platform ✨"}
              </p>
            )}
          </div>
        )}
      </motion.div>

      {/* AI Banner */}
      {selectedAI &&
        (() => {
          const aiNames: Record<string, string> = {
            gemini: "Google Gemini",
            chatgpt: "ChatGPT",
            metallamа: "Meta LLaMA",
            grok: "Grok",
          };
          const aiUrls: Record<string, string> = {
            gemini: "https://gemini.google.com",
            chatgpt: "https://chatgpt.com",
            metallamа: "https://llama.meta.com",
            grok: "https://grok.x.ai",
          };
          const aiName = aiNames[selectedAI] || selectedAI;
          return aiConnected ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="ios-card px-4 py-3 flex items-start gap-3"
              style={{ borderLeft: "3px solid #16a34a" }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-0.5">
                  ✅ Connected to {aiName} — suggestions now powered by {aiName}
                </p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Your selections are being enhanced by {aiName}. Data stays on
                  your phone only.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem(`cc_ai_connected_${selectedAI}`);
                  setAiConnected(false);
                }}
                className="flex-shrink-0 text-[10px] font-semibold text-muted-foreground border border-border/60 rounded-full px-2.5 py-1 hover:bg-muted transition-colors"
                data-ocid="scanner.button"
              >
                Disconnect
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="ios-card px-4 py-3 flex items-start gap-3"
              style={{ borderLeft: "3px solid oklch(var(--primary))" }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground mb-0.5">
                  🔐 Sign in to {aiName} for richer suggestions
                </p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Your data is never stored by this app — everything stays on
                  your phone only.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <a
                  href={aiUrls[selectedAI]}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    localStorage.setItem(`cc_ai_connected_${selectedAI}`, "1");
                    setAiConnected(true);
                  }}
                  className="flex-shrink-0 text-[11px] font-bold text-primary border border-primary/40 rounded-full px-3 py-1 hover:bg-primary/10 transition-colors whitespace-nowrap"
                  data-ocid="scanner.link"
                >
                  Open {aiName} →
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedAI("")}
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors text-center"
                  data-ocid="scanner.close_button"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          );
        })()}

      {/* ── Camera Card ── */}
      <motion.div
        className="ios-card shadow-2xl"
        style={{ boxShadow: "0 20px 60px -10px oklch(0 0 0 / 0.6)" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
      >
        <div className="relative w-full" style={{ aspectRatio: "4/3" }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          <canvas ref={samplingCanvasRef} className="hidden" />

          {isActive && (
            <>
              <div className="camera-corner camera-corner-tl" />
              <div className="camera-corner camera-corner-tr" />
              <div className="camera-corner camera-corner-bl" />
              <div className="camera-corner camera-corner-br" />
              <div className="reticle-ring animate-pulse" />
              <div className="reticle-dot" />
            </>
          )}

          {!cameraStarted && !isLoading && !isActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <p className="text-white/80 text-sm font-medium">
                Tap to start scanning
              </p>
              <button
                type="button"
                data-ocid="scanner.primary_button"
                onClick={() => {
                  setCameraStarted(true);
                  startCamera();
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-lg"
              >
                <Camera className="w-4 h-4" /> Start Scanner
              </button>
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-9 h-9 text-primary animate-spin" />
                <p className="text-sm text-foreground/70 font-medium">
                  Starting camera…
                </p>
              </div>
            </div>
          )}

          {error && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-black/80"
              data-ocid="scanner.error_state"
            >
              <div className="flex flex-col items-center gap-4 p-6 text-center">
                <p className="text-destructive font-semibold">
                  {error.message}
                </p>
                <button
                  type="button"
                  onClick={retry}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
                >
                  <RefreshCw className="w-4 h-4" /> Retry Camera
                </button>
              </div>
            </div>
          )}

          {isSupported === false && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <p className="text-muted-foreground text-sm p-6 text-center">
                Camera not supported in this browser
              </p>
            </div>
          )}

          {isActive && (
            <motion.div
              className="absolute top-3 left-3 flex flex-col gap-2"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 ios-glass-light rounded-2xl px-3 py-2 border border-white/10">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 swatch-shadow"
                  style={{ backgroundColor: activeColor }}
                />
                <span className="text-xs font-mono text-foreground/90 uppercase tracking-tight">
                  {activeColor}
                </span>
                {lockedColor && <Lock className="w-3 h-3 text-primary" />}
              </div>
              <div className="flex items-center gap-2 ios-glass-light rounded-2xl px-3 py-2 border border-primary/20">
                <Shirt className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="text-xs text-primary font-semibold">
                  {garment.emoji} {garment.label}
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Color info bar */}
        <div
          className="flex items-center gap-3 px-4 py-3.5"
          style={{ borderTop: "0.5px solid oklch(var(--border))" }}
        >
          <div
            className="w-11 h-11 rounded-xl flex-shrink-0 swatch-shadow"
            style={{ backgroundColor: activeColor }}
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground">{colorName}</p>
            <p className="text-xs font-mono text-muted-foreground">
              {activeColor}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-semibold text-primary bg-primary/15 rounded-full px-2.5 py-0.5">
              {garment.emoji} {garment.label}
            </span>
            <Badge
              variant={harmonyStatus.variant}
              className={`text-[10px] px-2 py-0.5 ${
                harmonyStatus.label === "EXCELLENT!"
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : ""
              }`}
            >
              {harmonyStatus.label}
            </Badge>
          </div>
        </div>
      </motion.div>
      <AnimatePresence>
        {colorHistory.length > 0 && (
          <motion.div
            className="ios-card px-4 py-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            data-ocid="scanner.panel"
          >
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Recent
              </span>
              <div className="flex gap-2">
                {colorHistory.map((hex, i) => (
                  <motion.button
                    key={hex}
                    type="button"
                    onClick={() => handleHistorySwatch(hex)}
                    className="rounded-xl transition-transform hover:scale-110 active:scale-95"
                    style={{
                      width: 36,
                      height: 36,
                      backgroundColor: hex,
                      boxShadow:
                        hex === activeColor
                          ? "0 0 0 2.5px oklch(var(--primary)), 0 4px 10px -2px oklch(0.42 0.22 255 / 0.35)"
                          : "0 0 0 1.5px oklch(var(--border))",
                    }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    title={hexToColorName(hex)}
                    data-ocid={`scanner.toggle.${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant={lockedColor ? "secondary" : "outline"}
          onClick={handleLockColor}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleLockColor();
          }}
          className="gap-2 rounded-2xl h-12 font-semibold text-sm border-border/60"
          data-ocid="scanner.toggle"
        >
          <Lock className="w-4 h-4" />
          {lockedColor ? "Unlock" : "Lock Color"}
        </Button>
        <Button
          type="button"
          onClick={handleGetAdvice}
          disabled={isLoadingAdvice}
          className="gap-2 rounded-2xl h-12 font-semibold text-sm bg-primary hover:bg-primary/90 shadow-lg"
          style={{ boxShadow: "0 6px 20px -4px oklch(0.60 0.20 250 / 0.5)" }}
          data-ocid="scanner.primary_button"
        >
          {isLoadingAdvice ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {isLoadingAdvice ? "Analyzing…" : "AI Advice"}
        </Button>
      </div>
      <AnimatePresence>
        {(lockedColor !== null || adviceHex !== null) && (
          <motion.div
            className="ios-card overflow-hidden"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            data-ocid="scanner.panel"
          >
            <div className="flex items-center gap-3 px-4 py-3 bg-muted/20">
              <span className="text-lg">🎽</span>
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-foreground">
                  What is this item?
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Select garment type for better results
                </p>
              </div>
              {selectedGarment && (
                <span className="text-[10px] font-semibold text-primary bg-primary/15 rounded-full px-2.5 py-0.5">
                  ✓ Selected
                </span>
              )}
            </div>
            <div style={{ borderTop: "0.5px solid oklch(var(--border))" }} />
            <div className="p-3">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {GARMENT_TYPES.filter((gt) => {
                  // Phase 4: Demographic filtering by gender + age
                  const ap = getAgeProfile(selectedAge);
                  // Age-based filter (always apply)
                  if (ap.allowedGarments.length < GARMENT_TYPES.length) {
                    if (!ap.allowedGarments.includes(gt.label)) return false;
                  }
                  // Gender-based filter
                  if (selectedGender === "male") {
                    const femaleOnly = [
                      "Dress",
                      "Saree",
                      "Bag",
                      "Scarf",
                      "Skirt",
                      "Stole",
                      "Dupatta",
                    ];
                    if (femaleOnly.includes(gt.label)) return false;
                  } else {
                    // female
                    const maleOnly = ["Turban", "Suit"];
                    if (maleOnly.includes(gt.label) && selectedAge !== "young")
                      return false;
                  }
                  return true;
                }).map((gt) => {
                  const isActiveGt = selectedGarment?.label === gt.label;
                  return (
                    <button
                      key={gt.label}
                      type="button"
                      onClick={() => setSelectedGarment(isActiveGt ? null : gt)}
                      className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all ${
                        isActiveGt
                          ? "bg-primary text-primary-foreground font-semibold shadow-md"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                      data-ocid="scanner.toggle"
                    >
                      <span>{gt.emoji}</span>
                      <span>{gt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {adviceHex !== null && (
          <motion.div
            className="ios-card overflow-hidden"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            data-ocid="scanner.panel"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-4 bg-muted/20">
              <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-base text-foreground">
                  AI Stylist
                </h3>
                <p className="text-xs text-muted-foreground">
                  {garment.emoji} {garment.label} · Personalised advice
                </p>
              </div>
              <Badge
                className={`${
                  harmonyStatus.label === "EXCELLENT!"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : ""
                } text-[10px]`}
                variant={harmonyStatus.variant}
              >
                {harmonyStatus.label}
              </Badge>
            </div>

            <div style={{ borderTop: "0.5px solid oklch(var(--border))" }} />

            <div className="p-4 space-y-5">
              {/* Section A — About Your Scanned Colour */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full flex-shrink-0 swatch-shadow"
                    style={{ backgroundColor: activeColor }}
                  />
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">
                    About Your Scanned Colour
                  </p>
                </div>
                <div className="flex items-center gap-2 pl-1">
                  <div
                    className="w-8 h-8 rounded-lg flex-shrink-0 swatch-shadow"
                    style={{ backgroundColor: activeColor }}
                  />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {colorName}
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground">
                      {activeColor}
                    </p>
                  </div>
                </div>
                <div className="bg-primary/5 rounded-2xl p-3.5">
                  <p className="text-sm text-foreground leading-relaxed">
                    {getScannedStyleTip()}
                  </p>
                </div>

                {(advice?.complementary?.length ?? 0) > 0 && (
                  <div>
                    <SectionHeader>Complementary</SectionHeader>
                    <div className="flex flex-wrap gap-3">
                      {advice?.complementary?.map((c) => (
                        <ColorChip
                          key={c.hex}
                          hex={c.hex}
                          label={c.name || c.hex}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {(advice?.analogous?.length ?? 0) > 0 && (
                  <div>
                    <SectionHeader>Analogous</SectionHeader>
                    <div className="flex flex-wrap gap-3">
                      {advice?.analogous?.map((c) => (
                        <ColorChip
                          key={c.hex}
                          hex={c.hex}
                          label={c.name || c.hex}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {(advice?.triadic?.length ?? 0) > 0 && (
                  <div>
                    <SectionHeader>Triadic</SectionHeader>
                    <div className="flex flex-wrap gap-3">
                      {advice?.triadic?.map((c) => (
                        <ColorChip
                          key={c.hex}
                          hex={c.hex}
                          label={c.name || c.hex}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Color Psychology Card */}
              {lockedColor && (
                <div
                  className="rounded-xl px-4 py-3"
                  style={{
                    background: "oklch(var(--muted) / 0.5)",
                    borderLeft: `3px solid ${lockedColor}`,
                  }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    🧠 Color Psychology
                  </p>
                  <p className="text-xs text-foreground/80 italic leading-relaxed">
                    {getColorPsychology(lockedColor)}
                  </p>
                </div>
              )}

              <div style={{ borderTop: "0.5px solid oklch(var(--border))" }} />

              {/* Section B — About the Matched Colour */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-accent">
                    About the Matched Colour
                  </p>
                </div>
                {displayMatchedColor ? (
                  <>
                    <div className="flex items-center gap-2 pl-1">
                      <div
                        className="w-8 h-8 rounded-lg flex-shrink-0 swatch-shadow"
                        style={{ backgroundColor: displayMatchedColor.hex }}
                      />
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {displayMatchedColor.name}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground">
                          {displayMatchedColor.hex}
                        </p>
                      </div>
                      {selectedMatchingColor && (
                        <span className="ml-auto text-[9px] font-bold text-primary bg-primary/15 rounded-full px-2 py-0.5">
                          ✓ Your pick
                        </span>
                      )}
                    </div>
                    <div className="bg-accent/8 rounded-2xl p-3.5">
                      <p className="text-sm text-foreground leading-relaxed">
                        {getMatchedPairingTip(
                          displayMatchedColor.hex,
                          displayMatchedColor.name,
                        )}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground pl-1">
                    Tap a colour from the matching grid below to see pairing
                    advice.
                  </p>
                )}
              </div>

              <div style={{ borderTop: "0.5px solid oklch(var(--border))" }} />

              {/* 5 Complete Looks */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                      ✨ 5 Complete Looks
                    </p>
                    <span className="text-[9px] text-muted-foreground">
                      Tip-to-toe outfits
                    </span>
                  </div>
                </div>
                <div
                  className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4"
                  style={{ scrollbarWidth: "none" }}
                >
                  {outfits.map((outfit, i) => (
                    <OutfitCard
                      key={outfit.id}
                      outfit={outfit}
                      index={i}
                      gender={userGender}
                    />
                  ))}
                </div>
              </div>

              <Button
                onClick={handleSaveFavorite}
                disabled={addFavorite.isPending}
                className="w-full gap-2 rounded-2xl h-12 font-semibold text-sm"
                variant="outline"
                style={{ borderColor: "oklch(var(--border))" }}
                data-ocid="scanner.secondary_button"
              >
                {addFavorite.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Heart className="w-4 h-4" />
                )}
                Save to Favorites
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        className="ios-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.12,
          type: "spring",
          stiffness: 320,
          damping: 28,
        }}
        data-ocid="scanner.card"
      >
        <div className="flex items-center gap-3 px-4 py-3.5 bg-muted/20">
          <div
            className="w-8 h-8 rounded-xl flex-shrink-0 swatch-shadow"
            style={{ backgroundColor: activeColor }}
          />
          <div className="flex-1">
            <h2 className="font-display font-bold text-sm text-foreground">
              10 Matching Colours
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Color harmony palette
            </p>
          </div>
        </div>
        <div style={{ borderTop: "0.5px solid oklch(var(--border))" }} />
        <div className="p-4">
          {/* Selection pill */}
          <div className="mb-3">
            <AnimatePresence mode="wait">
              {selectedMatchingColor ? (
                <motion.div
                  key="selected"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedMatchingColor.hex }}
                  />
                  Shopping: {selectedMatchingColor.name}
                  <button
                    type="button"
                    onClick={() => setSelectedMatchingColor(null)}
                    className="ml-0.5 hover:opacity-70 transition-opacity"
                    data-ocid="scanner.close_button"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ) : (
                <motion.p
                  key="hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[10px] text-muted-foreground"
                >
                  Tap a colour to shop it
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {matchingColors.map((mc, i) => {
              const isSelected = selectedMatchingColor?.hex === mc.hex;
              return (
                <motion.button
                  key={mc.hex}
                  type="button"
                  onClick={() =>
                    setSelectedMatchingColor(isSelected ? null : mc)
                  }
                  className="flex flex-col items-center gap-2 focus:outline-none"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.93 }}
                  transition={{
                    delay: i * 0.05,
                    type: "spring",
                    stiffness: 500,
                    damping: 28,
                  }}
                  data-ocid={`scanner.item.${i + 1}`}
                >
                  <motion.div
                    className="w-12 h-12 rounded-full"
                    style={{
                      backgroundColor: mc.hex,
                      boxShadow: isSelected
                        ? `0 0 0 3px white, 0 0 0 5px ${mc.hex}, 0 4px 14px -2px ${mc.hex}88`
                        : "0 4px 12px -2px oklch(0.42 0.22 255 / 0.25), 0 0 0 1.5px oklch(var(--border))",
                    }}
                    animate={{ scale: isSelected ? 1.15 : 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 28 }}
                  />
                  <div className="text-center">
                    <span className="text-[9px] font-mono text-muted-foreground block leading-tight">
                      {mc.hex}
                    </span>
                    <span className="text-[9px] text-foreground block leading-tight font-medium line-clamp-1">
                      {mc.name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(mc.hex).then(() => {
                          toast.success(`Copied ${mc.hex}`);
                        });
                      }}
                      className="text-[8px] text-primary/60 hover:text-primary transition-colors mt-0.5"
                    >
                      copy
                    </button>
                  </div>
                </motion.button>
              );
            })}
          </div>
          <p className="text-[10px] text-center text-muted-foreground/70 mt-1">
            Tap a color to refresh shop links
          </p>
        </div>
      </motion.div>
      <AnimatePresence>
        {showShoppingSection && (
          <motion.div
            className="ios-card overflow-hidden"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            data-ocid="scanner.card"
          >
            <div className="flex items-center gap-3 px-4 py-3.5 bg-muted/20">
              <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="font-display font-bold text-sm text-foreground">
                  Shop Matching Styles
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Paired with {garment.emoji} {garment.label}
                  {selectedMatchingColor
                    ? ` · ${selectedMatchingColor.name}`
                    : ` · ${colorName}`}
                  {userProfile &&
                    ` · ${
                      userProfile.gender === "men"
                        ? "👔 Men"
                        : userProfile.gender === "women"
                          ? "👗 Women"
                          : "✨ All"
                    }`}
                </p>
              </div>
            </div>
            <div style={{ borderTop: "0.5px solid oklch(var(--border))" }} />
            <ShopMatchingStyles
              garment={garment}
              colorHex={activeColor}
              colorName={colorName}
              userGender={userGender}
              selectedMatchingColor={selectedMatchingColor}
              allowedGarments={ageProfile.allowedGarments}
              sizeHint={ageProfile.sizeHint}
              moodKeyword={moodKeyword}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

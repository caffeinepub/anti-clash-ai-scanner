import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Copy,
  Download,
  Loader2,
  RefreshCw,
  TrendingUp,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { SiWhatsapp } from "react-icons/si";
import { toast } from "sonner";
import { useFilters } from "../context/FilterContext";

const GEMINI_API_KEY = "AIzaSyD3pY6TmTNA17OCAghZJrPfn7zxPYd7cF0";
const CACHE_KEY = "trendRadar";
const CACHE_TTL = 24 * 60 * 60 * 1000;

interface Trend {
  name: string;
  colors: string[];
  description: string;
  garments: string;
}

interface TrendCache {
  timestamp: number;
  trends: Trend[];
}

const FALLBACK_TRENDS: Trend[] = [
  {
    name: "Coastal Grandmother",
    colors: ["#E8DCC8", "#7BA7BC", "#F5F0E8"],
    description:
      "Relaxed linen textures in sandy neutrals with sea-blue accents -- effortlessly chic.",
    garments: "linen shirt + wide trousers",
  },
  {
    name: "Quiet Luxury",
    colors: ["#C8B9A2", "#8B7355", "#F0EBE3"],
    description:
      "Understated rich tones -- camel, ivory, and chocolate. Investment pieces that whisper wealth.",
    garments: "cashmere knit + tailored trousers",
  },
  {
    name: "Dopamine Dressing",
    colors: ["#FF6B6B", "#FFD93D", "#6BCB77"],
    description:
      "Bold, joyful primaries layered together. The louder the better for 2026.",
    garments: "graphic tee + colour-block jacket",
  },
  {
    name: "Cherry Red Moment",
    colors: ["#DC143C", "#1C1C1C", "#F5F5F5"],
    description:
      "Cherry red is the IT colour of 2026 -- pair with black or clean white for maximum punch.",
    garments: "red trench + black jeans",
  },
  {
    name: "Mint & Mocha",
    colors: ["#B5EAD7", "#7B5E57", "#F9F6F0"],
    description:
      "Cool mint balanced with warm mocha -- a fresh, sophisticated contrast for all seasons.",
    garments: "mint blouse + mocha skirt",
  },
  {
    name: "Urban Terracotta",
    colors: ["#C1694F", "#D4A574", "#2C2C2C"],
    description:
      "Earthy terracotta tones channel global travel and artisan craft. Pairs with raw denim.",
    garments: "terracotta jacket + ecru trousers",
  },
  {
    name: "Electric Cobalt",
    colors: ["#0047AB", "#E0E0E0", "#1A1A1A"],
    description:
      "High-voltage cobalt blue makes a bold statement against silver-grey and black.",
    garments: "cobalt blazer + grey turtleneck",
  },
  {
    name: "Soft Minimalism",
    colors: ["#F5F5F0", "#D4D4C8", "#A8A8A0"],
    description:
      "Tonal dressing in the softest stone and chalk shades. Clean lines, no prints.",
    garments: "stone overcoat + ivory knitwear",
  },
  {
    name: "Forest Bathing",
    colors: ["#355E3B", "#8FBC8F", "#D4C5A9"],
    description:
      "Deep forest greens grounded with warm sand -- nature-inspired layers for autumn.",
    garments: "olive cargo + sage shirt",
  },
  {
    name: "Retro Lavender",
    colors: ["#C9A0DC", "#7B68EE", "#FAF0FF"],
    description:
      "Lavender dominated 2025 and is still going strong in 2026 -- now bolder and richer.",
    garments: "lavender suit + lilac top",
  },
];

function loadCache(): Trend[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache: TrendCache = JSON.parse(raw);
    if (Date.now() - cache.timestamp > CACHE_TTL) return null;
    return cache.trends;
  } catch {
    return null;
  }
}

const RETAILER_FILTER = [
  {
    key: "all",
    label: "All",
    url: (q: string) => `https://www.amazon.in/s?k=${q}&tag=colourclash-21`,
  },
  {
    key: "indya",
    label: "House of Indya",
    url: (q: string) =>
      `https://www.houseofindya.com/catalogsearch/result?q=${q}`,
  },
  {
    key: "amazon",
    label: "Amazon",
    url: (q: string) => `https://www.amazon.in/s?k=${q}&tag=colourclash-21`,
  },
  {
    key: "flipkart",
    label: "Flipkart",
    url: (q: string) => `https://www.flipkart.com/search?q=${q}`,
  },
  {
    key: "myntra",
    label: "Myntra",
    url: (q: string) => `https://www.myntra.com/${q}`,
  },
  {
    key: "ajio",
    label: "Ajio",
    url: (q: string) => `https://www.ajio.com/search/?text=${q}`,
  },
  {
    key: "meesho",
    label: "Meesho",
    url: (q: string) => `https://www.meesho.com/search?q=${q}`,
  },
  {
    key: "nykaa",
    label: "Nykaa",
    url: (q: string) => `https://www.nykaa.com/search/result/?q=${q}`,
  },
  {
    key: "offduty",
    label: "Offduty",
    url: (q: string) => `https://offduty.in/search?q=${q}`,
  },
];

// ── Seasonal Palette Forecast ─────────────────────────────────────────────
const SEASON_PALETTES = {
  wedding: {
    name: "Wedding & Festive Season",
    emoji: "💍",
    desc: "Rich, celebratory tones — perfect for shaadi season",
    gradientFrom: "#8B0000",
    gradientTo: "#800020",
    colors: [
      { name: "Royal Red", hex: "#8B0000", garment: "Lehenga/Kurta" },
      { name: "Deep Maroon", hex: "#800000", garment: "Saree/Sherwani" },
      { name: "Champagne Gold", hex: "#F7E7CE", garment: "Blouse/Dupatta" },
      { name: "Midnight Navy", hex: "#000080", garment: "Suit/Dress" },
      { name: "Dusty Rose", hex: "#DCAE96", garment: "Lehenga/Top" },
      { name: "Emerald", hex: "#50C878", garment: "Saree/Kurta" },
    ],
  },
  summer: {
    name: "Summer Vibes",
    emoji: "☀️",
    desc: "Fresh, breezy tones for the Indian summer heat",
    gradientFrom: "#87CEEB",
    gradientTo: "#0047AB",
    colors: [
      { name: "Sky Blue", hex: "#87CEEB", garment: "Cotton Shirt/Top" },
      { name: "Mint Green", hex: "#98FF98", garment: "Casual Dress/Kurta" },
      { name: "Lemon Yellow", hex: "#FFF44F", garment: "Kurti/Shorts" },
      { name: "Coral Pink", hex: "#FF6B6B", garment: "Linen Shirt/Dress" },
      { name: "Ivory White", hex: "#FFFFF0", garment: "Everything" },
      { name: "Powder Blue", hex: "#B0C4DE", garment: "Pants/Salwar" },
    ],
  },
  monsoon: {
    name: "Monsoon & Earthy Tones",
    emoji: "🌧️",
    desc: "Rich earthy tones for the cozy monsoon season",
    gradientFrom: "#C1694F",
    gradientTo: "#355E3B",
    colors: [
      { name: "Terracotta", hex: "#E2725B", garment: "Kurta/Jacket" },
      { name: "Forest Green", hex: "#228B22", garment: "Shirt/Saree" },
      { name: "Mustard", hex: "#FFDB58", garment: "Kurti/Top" },
      { name: "Rust Orange", hex: "#CC5500", garment: "Jacket/Dupatta" },
      { name: "Warm Brown", hex: "#8B4513", garment: "Trousers/Pants" },
      { name: "Olive", hex: "#808000", garment: "Shirt/Coord Set" },
    ],
  },
};

function getCurrentSeason(): keyof typeof SEASON_PALETTES {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 10 || month <= 2) return "wedding";
  if (month >= 3 && month <= 5) return "summer";
  return "monsoon";
}

function SeasonalPaletteForecast({
  gender,
  activeRetailer,
}: { gender: string; activeRetailer: string }) {
  const [selectedColor, setSelectedColor] = useState<{
    name: string;
    hex: string;
    garment: string;
  } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareImgUrl, setShareImgUrl] = useState<string | null>(null);
  const [shareCaption, setShareCaption] = useState("");
  const seasonKey = getCurrentSeason();
  const season = SEASON_PALETTES[seasonKey];

  const getShopUrl = (colorName: string) => {
    const genderKeyword = gender === "male" ? "mens" : "womens";
    const q = encodeURIComponent(`${colorName} ${genderKeyword} fashion`);
    switch (activeRetailer) {
      case "indya":
        return `https://www.houseofindya.com/Colourclash?q=${q}`;
      case "amazon":
        return `https://www.amazon.in/s?k=${q}&tag=colourclash-21`;
      case "flipkart":
        return `https://www.flipkart.com/search?q=${q}`;
      case "myntra":
        return `https://www.myntra.com/${genderKeyword}?rawQuery=${q}`;
      case "ajio":
        return `https://www.ajio.com/search/?text=${q}`;
      case "meesho":
        return `https://www.meesho.com/search?q=${q}`;
      case "nykaa":
        return `https://www.nykaa.com/search/result/?q=${q}`;
      case "offduty":
        return `https://offduty.in/search?q=${q}`;
      default:
        return `https://www.amazon.in/s?k=${q}&tag=colourclash-21`;
    }
  };

  const buildForecastPng = (): Promise<Blob> =>
    new Promise((resolve, reject) => {
      // Larger canvas for readable text
      const W = 900;
      const H = 540;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("no ctx"));
        return;
      }

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, season.gradientFrom);
      grad.addColorStop(1, season.gradientTo);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(0,0,0,0.50)";
      ctx.fillRect(0, 0, W, H);

      // Header
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.fillText("COLOUR CLASH  ✦  TREND FORECAST", W / 2, 48);

      // Season emoji + name
      ctx.font = "48px Arial";
      ctx.fillText(season.emoji, W / 2, 108);
      ctx.font = "bold 32px Arial";
      ctx.fillStyle = "#FFD700";
      ctx.fillText(season.name, W / 2, 152);

      // Season description
      ctx.font = "17px Arial";
      ctx.fillStyle = "rgba(255,255,255,0.82)";
      ctx.fillText(season.desc, W / 2, 182);

      // Color swatches — two rows: circles on top, names clearly below (no overlap)
      const count = season.colors.length;
      const circleR = 32;
      // Guarantee enough horizontal space; each slot = 2*R + padding
      const slotW = Math.max(circleR * 2 + 20, Math.floor((W - 60) / count));
      const totalW = slotW * count;
      const startX = (W - totalW) / 2 + slotW / 2;
      const circleY = 255; // center of circles
      const nameY = circleY + circleR + 22; // name line 1 — always below circle bottom

      for (let i = 0; i < count; i++) {
        const cx = startX + i * slotW;

        // Drop shadow behind circle
        ctx.shadowColor = "rgba(0,0,0,0.45)";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(cx, circleY, circleR, 0, Math.PI * 2);
        ctx.fillStyle = season.colors[i].hex;
        ctx.fill();
        ctx.shadowBlur = 0;

        // White border
        ctx.strokeStyle = "rgba(255,255,255,0.60)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, circleY, circleR, 0, Math.PI * 2);
        ctx.stroke();

        // Palette name — always drawn BELOW circle, font sized to fit slot
        const fullName = season.colors[i].name;
        const maxNameW = slotW - 6;
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";

        // Try single line first at 13px
        ctx.font = "bold 13px Arial";
        if (ctx.measureText(fullName).width <= maxNameW) {
          ctx.fillText(fullName, cx, nameY);
        } else {
          // Split into two lines by word
          const words = fullName.split(" ");
          const mid = Math.ceil(words.length / 2);
          const line1 = words.slice(0, mid).join(" ");
          const line2 = words.slice(mid).join(" ");
          // Shrink font if still too wide
          let fontSize = 12;
          while (
            ctx.measureText(line1).width > maxNameW ||
            ctx.measureText(line2).width > maxNameW
          ) {
            fontSize -= 1;
            if (fontSize < 8) break;
            ctx.font = `bold ${fontSize}px Arial`;
          }
          ctx.fillText(line1, cx, nameY);
          ctx.fillText(line2, cx, nameY + fontSize + 3);
        }
      }

      // Branding footer
      ctx.textAlign = "center";
      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 20px Arial";
      ctx.fillText("COLOUR CLASH", W / 2, H - 52);
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.font = "14px Arial";
      ctx.fillText("colourclash-emb.caffeine.xyz", W / 2, H - 28);

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("toBlob failed"));
      }, "image/png");
    });

  const handleShare = async () => {
    try {
      const blob = await buildForecastPng();
      const caption = `This ${season.name} palette is 🔥 — curated by Colour Clash! Are you ready? #ColourClash #FashionForecast

https://colourclash-emb.caffeine.xyz`;
      const file = new File([blob], `colour-clash-forecast-${seasonKey}.png`, {
        type: "image/png",
      });

      // Mobile: try native share with image file
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            title: "Colour Clash Forecast",
            text: caption,
            files: [file],
          });
          return;
        } catch (_e) {
          // cancelled or not supported — fall through to modal
        }
      }

      // Desktop/fallback: show in-browser share modal
      if (shareImgUrl) URL.revokeObjectURL(shareImgUrl);
      const url = URL.createObjectURL(blob);
      setShareImgUrl(url);
      setShareCaption(caption);
      setShowShareModal(true);
    } catch (err) {
      console.error(err);
      toast.error("Could not build forecast image");
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        className="rounded-3xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${season.gradientFrom}dd, ${season.gradientTo}cc)`,
        }}
        data-ocid="trends.card"
      >
        {/* Glow effect */}
        <div
          style={{
            position: "absolute",
            top: -20,
            right: -20,
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: "rgba(255,225,53,0.15)",
            pointerEvents: "none",
          }}
        />

        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-0.5">
                📅 Seasonal Forecast
              </p>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{season.emoji}</span>
                <p className="text-lg font-black text-white leading-tight">
                  {season.name}
                </p>
              </div>
              <p className="text-xs text-white/70 mt-0.5">{season.desc}</p>
            </div>
            <button
              type="button"
              onClick={handleShare}
              className="flex flex-col items-center gap-1 ml-2"
              data-ocid="trends.secondary_button"
            >
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
                <Download className="w-4 h-4 text-white" />
              </div>
              <span className="text-[9px] text-white/60 font-bold">Share</span>
            </button>
          </div>

          {/* Color circles */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {season.colors.map((color) => (
              <button
                key={color.hex}
                type="button"
                onClick={() =>
                  setSelectedColor(
                    selectedColor?.hex === color.hex ? null : color,
                  )
                }
                className="flex flex-col items-center gap-1 transition-transform active:scale-90"
                data-ocid="trends.button"
              >
                <div
                  className="w-10 h-10 rounded-full border-2 transition-all shadow-md"
                  style={{
                    backgroundColor: color.hex,
                    borderColor:
                      selectedColor?.hex === color.hex
                        ? "#FFD700"
                        : "rgba(255,255,255,0.3)",
                    transform:
                      selectedColor?.hex === color.hex
                        ? "scale(1.15)"
                        : "scale(1)",
                  }}
                />
                <span className="text-[9px] text-white/70 text-center leading-tight max-w-[40px] line-clamp-2">
                  {color.name}
                </span>
              </button>
            ))}
          </div>

          {/* Selected color shop link */}
          <AnimatePresence>
            {selectedColor && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white/10 rounded-2xl p-3 mb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white/40 flex-shrink-0"
                      style={{ backgroundColor: selectedColor.hex }}
                    />
                    <div>
                      <p className="text-xs font-bold text-white">
                        {selectedColor.name}
                      </p>
                      <p className="text-[10px] text-white/60">
                        {selectedColor.garment}
                      </p>
                    </div>
                  </div>
                  <a
                    href={getShopUrl(selectedColor.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-white bg-white/20 hover:bg-white/30 transition-colors"
                    data-ocid="trends.link"
                  >
                    🛍️ Shop {selectedColor.name}
                    {activeRetailer !== "all"
                      ? ` on ${RETAILER_FILTER.find((r) => r.key === activeRetailer)?.label || ""}`
                      : ""}
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Share / Download Forecast */}
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-white text-xs font-bold"
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
            data-ocid="trends.secondary_button"
          >
            <Download className="w-3.5 h-3.5" /> Share / Download Forecast
          </button>
        </div>
      </motion.div>

      {/* In-browser share modal — rendered OUTSIDE overflow-hidden card */}
      {showShareModal && shareImgUrl && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
          role="presentation"
          onClick={() => setShowShareModal(false)}
          onKeyDown={(e) => e.key === "Escape" && setShowShareModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <img
              src={shareImgUrl}
              alt="Forecast card"
              className="w-full object-contain"
              style={{ maxHeight: "55vh" }}
            />
            <div className="p-4 space-y-3">
              <div className="bg-gray-100 rounded-xl p-3 text-xs text-gray-700 leading-relaxed">
                {shareCaption}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = shareImgUrl;
                    a.download = `colour-clash-forecast-${seasonKey}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    toast.success("Forecast downloaded!");
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold"
                  data-ocid="trends.button"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard
                      .writeText(shareCaption)
                      .then(() => toast.success("Caption copied!"))
                      .catch(() => toast.error("Could not copy"));
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-200 text-gray-800 text-sm font-semibold"
                  data-ocid="trends.copy.button"
                >
                  <Copy className="w-4 h-4" /> Copy Caption
                </button>
              </div>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareCaption)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ background: "#25D366" }}
                data-ocid="trends.link"
              >
                <SiWhatsapp className="w-4 h-4" /> Share on WhatsApp
              </a>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="w-full py-2 rounded-xl bg-gray-100 text-sm font-medium text-gray-600 flex items-center justify-center gap-1"
                data-ocid="trends.cancel_button"
              >
                <X className="w-4 h-4" /> Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function TrendRadarPage() {
  const { gender } = useFilters();
  const [trends, setTrends] = useState<Trend[]>(() => loadCache() ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRetailer, setSelectedRetailer] = useState("all");
  const hasFetched = useRef(false);

  const fetchTrends = async (force = false) => {
    if (!force) {
      const cached = loadCache();
      if (cached && cached.length > 0) {
        setTrends(cached);
        return;
      }
    }
    setIsLoading(true);
    try {
      const genderCtx = gender === "male" ? "men's fashion" : "women's fashion";
      const prompt = `List the top 10 trending outfit color combinations for 2026 ${genderCtx}. Return ONLY valid JSON: {"trends": [{"name": "Trend Name", "colors": ["#hex1", "#hex2"], "description": "1 sentence tip", "garments": "e.g. blazer + trousers"}]}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.8, maxOutputTokens: 1500 },
          }),
        },
      );

      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const cleaned = raw
        .replace(/```json?/g, "")
        .replace(/```/g, "")
        .trim();
      const brace = cleaned.indexOf("{");
      const parsed = JSON.parse(
        cleaned.slice(brace, cleaned.lastIndexOf("}") + 1),
      ) as { trends: Trend[] };

      setTrends(parsed.trends);
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ timestamp: Date.now(), trends: parsed.trends }),
      );
    } catch (_err) {
      console.error(_err);
      setTrends(FALLBACK_TRENDS);
      toast.error("Live trends unavailable. Showing curated 2026 picks.");
    } finally {
      setIsLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount, re-run on gender change
  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchTrends();
    }
  }, []);

  // Re-fetch when gender changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (hasFetched.current) {
      localStorage.removeItem(CACHE_KEY);
      fetchTrends(true);
    }
  }, [gender]);

  const buildShopUrl = (trend: Trend) => {
    const query = encodeURIComponent(
      `${trend.name} ${trend.garments} fashion 2026`,
    );
    const retailer =
      RETAILER_FILTER.find((r) => r.key === selectedRetailer) ??
      RETAILER_FILTER[0];
    return retailer.url(query);
  };

  return (
    <div className="flex flex-col gap-5 pb-4">
      {/* ── Seasonal Palette Forecast ── */}
      <SeasonalPaletteForecast
        gender={gender}
        activeRetailer={selectedRetailer}
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-foreground">
            Trend Radar
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            2026 top color combinations
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchTrends(true)}
          disabled={isLoading}
          className="gap-1.5 rounded-xl border border-primary/30 text-primary px-3 py-1.5 flex items-center text-xs font-medium hover:bg-primary/10 transition-colors disabled:opacity-50"
          data-ocid="trends.secondary_button"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          Refresh
        </button>
      </div>

      {isLoading && trends.length === 0 && (
        <div
          className="flex flex-col items-center gap-4 py-16"
          data-ocid="trends.loading_state"
        >
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Analysing with AI...</p>
        </div>
      )}

      {/* Retailer filter chips */}
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {RETAILER_FILTER.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setSelectedRetailer(r.key)}
            className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all border ${
              selectedRetailer === r.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted text-muted-foreground border-border hover:border-primary/40"
            }`}
            data-ocid="trends.tab"
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Gender context note */}
      <p className="text-[11px] text-muted-foreground -mt-2">
        Showing trends for{" "}
        <span className="font-semibold text-foreground capitalize">
          {gender === "male" ? "Men" : "Women"}
        </span>{" "}
        · Change in Home Filters
      </p>

      {!isLoading && trends.length === 0 && (
        <div
          className="flex flex-col items-center gap-4 py-16 text-center"
          data-ocid="trends.empty_state"
        >
          <TrendingUp className="w-10 h-10 text-primary/40" />
          <p className="text-sm text-muted-foreground">No trends loaded yet.</p>
          <button
            type="button"
            onClick={() => fetchTrends(true)}
            className="rounded-2xl bg-primary text-primary-foreground px-6 py-2 text-sm font-medium"
            data-ocid="trends.primary_button"
          >
            Load Trends
          </button>
        </div>
      )}

      <AnimatePresence>
        {trends.map((trend, i) => (
          <motion.div
            key={trend.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            data-ocid={`trends.item.${i + 1}`}
          >
            <Card className="ios-card border-0">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex gap-1.5 flex-shrink-0 mt-0.5">
                    {trend.colors.slice(0, 3).map((hex) => (
                      <div
                        key={hex}
                        className="w-9 h-9 rounded-lg shadow-sm"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-foreground">
                        {trend.name}
                      </h3>
                      <Badge variant="secondary" className="text-[9px]">
                        #{i + 1}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {trend.description}
                    </p>
                    <p className="text-xs font-medium text-primary/70 mt-1">
                      👕 {trend.garments}
                    </p>
                  </div>
                </div>

                <a
                  href={buildShopUrl(trend)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                  data-ocid="trends.link"
                >
                  🛍️ Shop This Trend
                </a>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RefreshCw, TrendingUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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

export default function TrendRadarPage() {
  const [trends, setTrends] = useState<Trend[]>(() => loadCache() ?? []);
  const [isLoading, setIsLoading] = useState(false);
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
      const prompt =
        'List the top 10 trending outfit color combinations for 2026 fashion. Return ONLY valid JSON: {"trends": [{"name": "Trend Name", "colors": ["#hex1", "#hex2"], "description": "1 sentence tip", "garments": "e.g. blazer + trousers"}]}';

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
    } catch (err) {
      console.error(err);
      setTrends(FALLBACK_TRENDS);
      toast.error("Live trends unavailable. Showing curated 2026 picks.");
    } finally {
      setIsLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      if (trends.length === 0) {
        fetchTrends();
      }
    }
  }, []);

  const buildShopUrl = (trend: Trend) => {
    const query = encodeURIComponent(
      `${trend.name} ${trend.garments} fashion 2026`,
    );
    return `https://www.amazon.in/s?k=${query}`;
  };

  return (
    <div className="flex flex-col gap-5 pb-4">
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
                      \ud83d\udc55 {trend.garments}
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
                  \ud83d\udecd\ufe0f Shop This Trend
                </a>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

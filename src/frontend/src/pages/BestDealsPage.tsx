import { Badge } from "@/components/ui/badge";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const RETAILERS = [
  {
    key: "amazon",
    name: "Amazon",
    emoji: "🟠",
    color: "#FF9900",
    deal: "Great Indian Sale",
    discount: "Up to 70% off on fashion",
    url: "https://www.amazon.in/deals",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-800",
  },
  {
    key: "flipkart",
    name: "Flipkart",
    emoji: "🔵",
    color: "#2874F0",
    deal: "Big Fashion Sale",
    discount: "Flat 50–80% off",
    url: "https://www.flipkart.com/offers-store",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
  },
  {
    key: "myntra",
    name: "Myntra",
    emoji: "🩷",
    color: "#FF3F6C",
    deal: "End of Reason Sale",
    discount: "Min 50% off on top brands",
    url: "https://www.myntra.com/sale",
    bg: "bg-pink-50 dark:bg-pink-950/30",
    border: "border-pink-200 dark:border-pink-800",
  },
  {
    key: "ajio",
    name: "Ajio",
    emoji: "🔴",
    color: "#DC2626",
    deal: "Big Bold Sale",
    discount: "Up to 75% off",
    url: "https://www.ajio.com/sale",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
  },
  {
    key: "meesho",
    name: "Meesho",
    emoji: "🩵",
    color: "#0D9488",
    deal: "Mega Sale",
    discount: "Starting ₹99 — best value picks",
    url: "https://www.meesho.com/sale",
    bg: "bg-teal-50 dark:bg-teal-950/30",
    border: "border-teal-200 dark:border-teal-800",
  },
  {
    key: "nykaa",
    name: "Nykaa Fashion",
    emoji: "🌸",
    color: "#FC2779",
    deal: "Fashion Festival",
    discount: "Up to 60% off on ethnic & western",
    url: "https://www.nykaafashion.com/sale",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-200 dark:border-rose-800",
  },
  {
    key: "indya",
    name: "Indya",
    emoji: "🌺",
    color: "#9B2335",
    deal: "Ethnic Fiesta",
    discount: "Upto 40% off on kurtas & sarees",
    url: "https://www.theindya.com/sale",
    bg: "bg-rose-50 dark:bg-rose-950/20",
    border: "border-rose-300 dark:border-rose-900",
  },
  {
    key: "offduty",
    name: "Offduty India",
    emoji: "🟤",
    color: "#8B6914",
    deal: "Casuals Sale",
    discount: "Min 30% off on everyday wear",
    url: "https://www.offdutyindia.com/sale",
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    border: "border-yellow-200 dark:border-yellow-800",
  },
];

type Category =
  | "All"
  | "Tops"
  | "Bottoms"
  | "Ethnic"
  | "Footwear"
  | "Accessories"
  | "Bags";
const CATEGORIES: Category[] = [
  "All",
  "Tops",
  "Bottoms",
  "Ethnic",
  "Footwear",
  "Accessories",
  "Bags",
];

interface SimulatedDeal {
  emoji: string;
  name: string;
  originalPrice: number;
  salePrice: number;
  discountPct: number;
  retailer: string;
  retailerColor: string;
  category: Category;
  searchQuery: string;
  retailerUrl: string;
}

const SIMULATED_DEALS: SimulatedDeal[] = [
  {
    emoji: "👕",
    name: "Floral Printed Shirt",
    originalPrice: 2499,
    salePrice: 699,
    discountPct: 72,
    retailer: "Myntra",
    retailerColor: "#FF3F6C",
    category: "Tops",
    searchQuery: "floral+printed+shirt",
    retailerUrl: "https://www.myntra.com/floral+printed+shirt",
  },
  {
    emoji: "👖",
    name: "Slim Fit Jeans",
    originalPrice: 3499,
    salePrice: 999,
    discountPct: 71,
    retailer: "Amazon",
    retailerColor: "#FF9900",
    category: "Bottoms",
    searchQuery: "slim+fit+jeans",
    retailerUrl: "https://www.amazon.in/s?k=slim+fit+jeans",
  },
  {
    emoji: "🥻",
    name: "Silk Banarasi Saree",
    originalPrice: 5999,
    salePrice: 1799,
    discountPct: 70,
    retailer: "Indya",
    retailerColor: "#9B2335",
    category: "Ethnic",
    searchQuery: "silk+banarasi+saree",
    retailerUrl: "https://www.theindya.com/search?q=silk+banarasi+saree",
  },
  {
    emoji: "👟",
    name: "Casual Sneakers",
    originalPrice: 4999,
    salePrice: 1299,
    discountPct: 74,
    retailer: "Flipkart",
    retailerColor: "#2874F0",
    category: "Footwear",
    searchQuery: "casual+sneakers",
    retailerUrl: "https://www.flipkart.com/search?q=casual+sneakers",
  },
  {
    emoji: "👜",
    name: "Tote Handbag",
    originalPrice: 2999,
    salePrice: 899,
    discountPct: 70,
    retailer: "Nykaa Fashion",
    retailerColor: "#FC2779",
    category: "Bags",
    searchQuery: "tote+handbag",
    retailerUrl: "https://www.nykaafashion.com/search/result/?q=tote+handbag",
  },
  {
    emoji: "⌚",
    name: "Analog Wrist Watch",
    originalPrice: 3999,
    salePrice: 899,
    discountPct: 78,
    retailer: "Amazon",
    retailerColor: "#FF9900",
    category: "Accessories",
    searchQuery: "analog+wrist+watch",
    retailerUrl: "https://www.amazon.in/s?k=analog+wrist+watch",
  },
  {
    emoji: "🧥",
    name: "Denim Jacket",
    originalPrice: 3499,
    salePrice: 1099,
    discountPct: 69,
    retailer: "Ajio",
    retailerColor: "#DC2626",
    category: "Tops",
    searchQuery: "denim+jacket",
    retailerUrl: "https://www.ajio.com/search/?text=denim+jacket",
  },
  {
    emoji: "👗",
    name: "Flared Midi Dress",
    originalPrice: 2799,
    salePrice: 799,
    discountPct: 71,
    retailer: "Myntra",
    retailerColor: "#FF3F6C",
    category: "Tops",
    searchQuery: "flared+midi+dress",
    retailerUrl: "https://www.myntra.com/flared+midi+dress",
  },
  {
    emoji: "🕶️",
    name: "UV400 Sunglasses",
    originalPrice: 1999,
    salePrice: 499,
    discountPct: 75,
    retailer: "Meesho",
    retailerColor: "#0D9488",
    category: "Accessories",
    searchQuery: "uv400+sunglasses",
    retailerUrl: "https://www.meesho.com/search?q=uv400+sunglasses",
  },
  {
    emoji: "🩱",
    name: "Cotton Anarkali Kurta",
    originalPrice: 2499,
    salePrice: 699,
    discountPct: 72,
    retailer: "Indya",
    retailerColor: "#9B2335",
    category: "Ethnic",
    searchQuery: "cotton+anarkali+kurta",
    retailerUrl: "https://www.theindya.com/search?q=cotton+anarkali+kurta",
  },
  {
    emoji: "👠",
    name: "Block Heel Sandals",
    originalPrice: 3299,
    salePrice: 899,
    discountPct: 73,
    retailer: "Nykaa Fashion",
    retailerColor: "#FC2779",
    category: "Footwear",
    searchQuery: "block+heel+sandals",
    retailerUrl:
      "https://www.nykaafashion.com/search/result/?q=block+heel+sandals",
  },
  {
    emoji: "🧣",
    name: "Cashmere Scarf",
    originalPrice: 1999,
    salePrice: 599,
    discountPct: 70,
    retailer: "Offduty India",
    retailerColor: "#8B6914",
    category: "Accessories",
    searchQuery: "cashmere+scarf",
    retailerUrl:
      "https://www.offdutyindia.com/search?type=product&q=cashmere+scarf",
  },
  {
    emoji: "👒",
    name: "Summer Straw Hat",
    originalPrice: 1499,
    salePrice: 399,
    discountPct: 73,
    retailer: "Amazon",
    retailerColor: "#FF9900",
    category: "Accessories",
    searchQuery: "summer+straw+hat",
    retailerUrl: "https://www.amazon.in/s?k=summer+straw+hat",
  },
  {
    emoji: "👖",
    name: "Palazzo Pants",
    originalPrice: 1799,
    salePrice: 499,
    discountPct: 72,
    retailer: "Meesho",
    retailerColor: "#0D9488",
    category: "Bottoms",
    searchQuery: "palazzo+pants",
    retailerUrl: "https://www.meesho.com/search?q=palazzo+pants",
  },
  {
    emoji: "👜",
    name: "Mini Sling Bag",
    originalPrice: 2299,
    salePrice: 699,
    discountPct: 70,
    retailer: "Flipkart",
    retailerColor: "#2874F0",
    category: "Bags",
    searchQuery: "mini+sling+bag",
    retailerUrl: "https://www.flipkart.com/search?q=mini+sling+bag",
  },
  {
    emoji: "👟",
    name: "Ethnic Juttis",
    originalPrice: 1999,
    salePrice: 549,
    discountPct: 73,
    retailer: "Ajio",
    retailerColor: "#DC2626",
    category: "Footwear",
    searchQuery: "ethnic+juttis",
    retailerUrl: "https://www.ajio.com/search/?text=ethnic+juttis",
  },
];

export default function BestDealsPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [heroVisible, setHeroVisible] = useState(true);

  useEffect(() => {
    const key = `colourClash_dealsHeroDismissed_${new Date().toDateString()}`;
    if (localStorage.getItem(key) === "1") setHeroVisible(false);
  }, []);

  const dismissHero = () => {
    const key = `colourClash_dealsHeroDismissed_${new Date().toDateString()}`;
    localStorage.setItem(key, "1");
    setHeroVisible(false);
  };

  const filteredDeals =
    activeCategory === "All"
      ? SIMULATED_DEALS
      : SIMULATED_DEALS.filter((d) => d.category === activeCategory);

  return (
    <div className="space-y-5 pb-6">
      {/* Hero Banner */}
      <AnimatePresence>
        {heroVisible && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="relative overflow-hidden rounded-3xl"
            style={{
              background:
                "linear-gradient(135deg, #FF006E 0%, #FB5607 35%, #FFBE0B 70%, #FF006E 100%)",
              backgroundSize: "200% 200%",
            }}
            data-ocid="deals.card"
          >
            {/* Animated sparkles */}
            <motion.div
              className="absolute text-white/60 select-none pointer-events-none"
              style={{ top: "21%", left: "18%", fontSize: "20px" }}
              animate={{
                y: [0, -8, 0],
                opacity: [0.4, 1, 0.4],
                rotate: [0, 15, 0],
              }}
              transition={{
                duration: 2.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 0.0,
              }}
            >
              ✨
            </motion.div>
            <motion.div
              className="absolute text-white/60 select-none pointer-events-none"
              style={{ top: "32%", left: "31%", fontSize: "16px" }}
              animate={{
                y: [0, -8, 0],
                opacity: [0.4, 1, 0.4],
                rotate: [0, 15, 0],
              }}
              transition={{
                duration: 2.9,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 0.3,
              }}
            >
              ⭐
            </motion.div>
            <motion.div
              className="absolute text-white/60 select-none pointer-events-none"
              style={{ top: "10%", left: "44%", fontSize: "28px" }}
              animate={{
                y: [0, -8, 0],
                opacity: [0.4, 1, 0.4],
                rotate: [0, 15, 0],
              }}
              transition={{
                duration: 3.3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 0.6,
              }}
            >
              🌟
            </motion.div>
            <motion.div
              className="absolute text-white/60 select-none pointer-events-none"
              style={{ top: "43%", left: "57%", fontSize: "20px" }}
              animate={{
                y: [0, -8, 0],
                opacity: [0.4, 1, 0.4],
                rotate: [0, 15, 0],
              }}
              transition={{
                duration: 3.7,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 0.9,
              }}
            >
              💫
            </motion.div>
            <motion.div
              className="absolute text-white/60 select-none pointer-events-none"
              style={{ top: "54%", left: "70%", fontSize: "16px" }}
              animate={{
                y: [0, -8, 0],
                opacity: [0.4, 1, 0.4],
                rotate: [0, 15, 0],
              }}
              transition={{
                duration: 4.1,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 1.2,
              }}
            >
              ✦
            </motion.div>
            <motion.div
              className="absolute text-white/60 select-none pointer-events-none"
              style={{ top: "65%", left: "83%", fontSize: "28px" }}
              animate={{
                y: [0, -8, 0],
                opacity: [0.4, 1, 0.4],
                rotate: [0, 15, 0],
              }}
              transition={{
                duration: 4.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 1.5,
              }}
            >
              ★
            </motion.div>
            <motion.div
              className="absolute text-white/60 select-none pointer-events-none"
              style={{ top: "76%", left: "18%", fontSize: "20px" }}
              animate={{
                y: [0, -8, 0],
                opacity: [0.4, 1, 0.4],
                rotate: [0, 15, 0],
              }}
              transition={{
                duration: 4.9,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 1.8,
              }}
            >
              🔥
            </motion.div>
            <motion.div
              className="absolute text-white/60 select-none pointer-events-none"
              style={{ top: "21%", left: "57%", fontSize: "28px" }}
              animate={{
                y: [0, -8, 0],
                opacity: [0.4, 1, 0.4],
                rotate: [0, 15, 0],
              }}
              transition={{
                duration: 5.3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 2.1,
              }}
            >
              💥
            </motion.div>

            <div className="relative z-10 p-6 pb-5">
              <button
                type="button"
                onClick={dismissHero}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors text-sm"
                data-ocid="deals.close_button"
              >
                ×
              </button>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: 0.15,
                  type: "spring",
                  stiffness: 400,
                  damping: 28,
                }}
              >
                <p className="text-white/80 text-sm font-semibold mb-1 tracking-wide">
                  🎨 COLOUR CLASH EXCLUSIVE
                </p>
                <h1 className="text-white font-display font-black text-3xl leading-tight mb-2">
                  Today&apos;s Best Deals 🔥
                </h1>
                <p className="text-white/90 text-sm leading-relaxed mb-3">
                  Thank you for being part of the Colour Clash family!
                  <br />
                  We&apos;ve curated the hottest deals just for you. ❤️
                </p>
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <span className="text-white text-xs font-bold">
                    🙌 You&apos;re awesome for downloading this app!
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Featured Deals */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-display font-bold text-base text-foreground">
            🏷️ Featured Sales
          </h2>
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
            8 stores
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {RETAILERS.map((r, i) => (
            <motion.a
              key={r.key}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-2xl p-3.5 border flex flex-col gap-2 active:scale-95 transition-all ${r.bg} ${r.border}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: i * 0.06,
                type: "spring",
                stiffness: 360,
                damping: 30,
              }}
              data-ocid={`deals.item.${i + 1}`}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-base font-black flex-shrink-0"
                  style={{ backgroundColor: r.color }}
                >
                  {r.emoji}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-foreground leading-tight truncate">
                    {r.name}
                  </p>
                  <p className="text-[9px] text-muted-foreground">{r.deal}</p>
                </div>
              </div>
              <p
                className="text-[11px] font-semibold"
                style={{ color: r.color }}
              >
                {r.discount}
              </p>
              <div
                className="rounded-xl py-1.5 text-center text-[11px] font-black text-white"
                style={{ backgroundColor: r.color }}
              >
                Shop Now →
              </div>
            </motion.a>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all border ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-border hover:border-primary/40"
              }`}
              data-ocid="deals.tab"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Simulated Deals Grid */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-display font-bold text-base text-foreground">
            ⚡ Hot Picks
          </h2>
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
            {filteredDeals.length} deals
          </Badge>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="grid grid-cols-2 gap-3"
          >
            {filteredDeals.map((deal, i) => (
              <motion.div
                key={`${deal.name}-${deal.retailer}`}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: i * 0.04,
                  type: "spring",
                  stiffness: 360,
                  damping: 30,
                }}
                className="ios-card overflow-hidden"
                data-ocid={`deals.item.${i + 1}`}
              >
                <div
                  className="h-1.5 w-full"
                  style={{ backgroundColor: deal.retailerColor }}
                />
                <div className="p-3">
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <div>
                      <span className="text-2xl">{deal.emoji}</span>
                    </div>
                    <span
                      className="text-[9px] font-black rounded-full px-1.5 py-0.5 text-white"
                      style={{ backgroundColor: "#DC2626" }}
                    >
                      {deal.discountPct}% OFF
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-foreground leading-tight mb-1.5 line-clamp-2">
                    {deal.name}
                  </p>
                  <div className="mb-2">
                    <span className="text-xs font-black text-foreground">
                      ₹{deal.salePrice.toLocaleString()}
                    </span>{" "}
                    <span className="text-[10px] text-muted-foreground line-through">
                      ₹{deal.originalPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className="text-[8px] font-bold rounded-full px-1.5 py-0.5 text-white"
                      style={{ backgroundColor: deal.retailerColor }}
                    >
                      {deal.retailer}
                    </span>
                    <a
                      href={deal.retailerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-black rounded-lg px-2 py-1 text-white transition-opacity hover:opacity-80"
                      style={{ backgroundColor: deal.retailerColor }}
                      data-ocid="deals.button"
                    >
                      Grab →
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom motivational message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 28 }}
        className="rounded-3xl p-5 text-center"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.52 0.22 270 / 0.12), oklch(0.55 0.18 300 / 0.12))",
          border: "1px solid oklch(var(--border))",
        }}
      >
        <p className="text-sm font-bold text-foreground mb-1">
          🎨 Colour Clash is always finding the best deals for you.
        </p>
        <p className="text-xs text-muted-foreground">
          Keep exploring, keep styling! ✨
        </p>
      </motion.div>
    </div>
  );
}

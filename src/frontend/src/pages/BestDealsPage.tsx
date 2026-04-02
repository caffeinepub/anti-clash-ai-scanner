import { Badge } from "@/components/ui/badge";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import ColorPaletteCard from "../components/ColorPaletteCard";
import { useFilters } from "../context/FilterContext";

const RETAILERS = [
  {
    key: "indya",
    name: "House of Indya",
    color: "#9B2335",
    deal: "Ethnic Fiesta",
    discount: "Upto 40% off on kurtas & sarees",
    url: "https://www.houseofindya.com/Colourclash",
    paletteHex: "#9B2335",
    category: "ethnic",
  },
  {
    key: "amazon",
    name: "Amazon",
    color: "#FF9900",
    deal: "Great Indian Sale",
    discount: "Up to 70% off on fashion",
    url: "https://www.amazon.in/deals",
    paletteHex: "#FF9900",
    category: "top",
  },
  {
    key: "flipkart",
    name: "Flipkart",
    color: "#2874F0",
    deal: "Big Fashion Sale",
    discount: "Flat 50–80% off",
    url: "https://www.flipkart.com/offers-store",
    paletteHex: "#2874F0",
    category: "bottom",
  },
  {
    key: "myntra",
    name: "Myntra",
    color: "#FF3F6C",
    deal: "End of Reason Sale",
    discount: "Min 50% off on top brands",
    url: "https://www.myntra.com/sale",
    paletteHex: "#FF3F6C",
    category: "jacket",
  },
  {
    key: "ajio",
    name: "Ajio",
    color: "#DC2626",
    deal: "Big Bold Sale",
    discount: "Up to 75% off",
    url: "https://www.ajio.com/sale",
    paletteHex: "#DC2626",
    category: "ethnic",
  },
  {
    key: "meesho",
    name: "Meesho",
    color: "#0D9488",
    deal: "Mega Sale",
    discount: "Starting ₹99 — best value",
    url: "https://www.meesho.com",
    paletteHex: "#0D9488",
    category: "accessories",
  },
  {
    key: "nykaa",
    name: "Nykaa Fashion",
    color: "#FC2779",
    deal: "Fashion Festival",
    discount: "Up to 60% off on ethnic & western",
    url: "https://www.nykaa.com/fashion",
    paletteHex: "#FC2779",
    category: "bag",
  },
  {
    key: "offduty",
    name: "Offduty India",
    color: "#8B6914",
    deal: "Casuals Sale",
    discount: "Min 30% off on everyday wear",
    url: "https://offduty.in/collections",
    paletteHex: "#8B6914",
    category: "shoes",
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
  name: string;
  originalPrice: number;
  salePrice: number;
  discountPct: number;
  retailer: string;
  retailerColor: string;
  category: Category;
  retailerUrl: string;
  paletteHex: string;
  itemCategory: string;
}

const SIMULATED_DEALS: SimulatedDeal[] = [
  {
    name: "Floral Printed Shirt",
    originalPrice: 2499,
    salePrice: 699,
    discountPct: 72,
    retailer: "Myntra",
    retailerColor: "#FF3F6C",
    category: "Tops",
    retailerUrl: "https://www.myntra.com/floral+printed+shirt",
    paletteHex: "#E8A4B8",
    itemCategory: "top",
  },
  {
    name: "Slim Fit Jeans",
    originalPrice: 3499,
    salePrice: 999,
    discountPct: 71,
    retailer: "Amazon",
    retailerColor: "#FF9900",
    category: "Bottoms",
    retailerUrl: "https://www.amazon.in/s?k=slim+fit+jeans",
    paletteHex: "#4A7FB5",
    itemCategory: "bottom",
  },
  {
    name: "Silk Banarasi Saree",
    originalPrice: 5999,
    salePrice: 1799,
    discountPct: 70,
    retailer: "House of Indya",
    retailerColor: "#9B2335",
    category: "Ethnic",
    retailerUrl: "https://www.houseofindya.com/Colourclash",
    paletteHex: "#9B2335",
    itemCategory: "ethnic",
  },
  {
    name: "Casual Sneakers",
    originalPrice: 4999,
    salePrice: 1299,
    discountPct: 74,
    retailer: "Flipkart",
    retailerColor: "#2874F0",
    category: "Footwear",
    retailerUrl: "https://www.flipkart.com/search?q=casual+sneakers",
    paletteHex: "#FFFFFF",
    itemCategory: "shoes",
  },
  {
    name: "Tote Handbag",
    originalPrice: 2999,
    salePrice: 899,
    discountPct: 70,
    retailer: "Nykaa Fashion",
    retailerColor: "#FC2779",
    category: "Bags",
    retailerUrl: "https://www.nykaa.com/search/result/?q=tote+handbag",
    paletteHex: "#C4A882",
    itemCategory: "bag",
  },
  {
    name: "Analog Wrist Watch",
    originalPrice: 3999,
    salePrice: 899,
    discountPct: 78,
    retailer: "Amazon",
    retailerColor: "#FF9900",
    category: "Accessories",
    retailerUrl: "https://www.amazon.in/s?k=analog+wrist+watch",
    paletteHex: "#D4A853",
    itemCategory: "watch",
  },
  {
    name: "Denim Jacket",
    originalPrice: 3499,
    salePrice: 1099,
    discountPct: 69,
    retailer: "Ajio",
    retailerColor: "#DC2626",
    category: "Tops",
    retailerUrl: "https://www.ajio.com/search/?text=denim+jacket",
    paletteHex: "#4A7FB5",
    itemCategory: "jacket",
  },
  {
    name: "Flared Midi Dress",
    originalPrice: 2799,
    salePrice: 799,
    discountPct: 71,
    retailer: "Myntra",
    retailerColor: "#FF3F6C",
    category: "Tops",
    retailerUrl: "https://www.myntra.com/flared+midi+dress",
    paletteHex: "#E8A0BF",
    itemCategory: "top",
  },
  {
    name: "UV400 Sunglasses",
    originalPrice: 1999,
    salePrice: 499,
    discountPct: 75,
    retailer: "Meesho",
    retailerColor: "#0D9488",
    category: "Accessories",
    retailerUrl: "https://www.meesho.com/search?q=uv400+sunglasses",
    paletteHex: "#2D3748",
    itemCategory: "accessories",
  },
  {
    name: "Cotton Anarkali Kurta",
    originalPrice: 2499,
    salePrice: 699,
    discountPct: 72,
    retailer: "House of Indya",
    retailerColor: "#9B2335",
    category: "Ethnic",
    retailerUrl: "https://www.houseofindya.com/Colourclash",
    paletteHex: "#E8B4A0",
    itemCategory: "ethnic",
  },
  {
    name: "Block Heel Sandals",
    originalPrice: 3299,
    salePrice: 899,
    discountPct: 73,
    retailer: "Nykaa Fashion",
    retailerColor: "#FC2779",
    category: "Footwear",
    retailerUrl: "https://www.nykaa.com/search/result/?q=block+heel+sandals",
    paletteHex: "#C4A882",
    itemCategory: "shoes",
  },
  {
    name: "Cashmere Scarf",
    originalPrice: 1999,
    salePrice: 599,
    discountPct: 70,
    retailer: "Offduty India",
    retailerColor: "#8B6914",
    category: "Accessories",
    retailerUrl: "https://offduty.in/search?type=product&q=cashmere+scarf",
    paletteHex: "#8B6914",
    itemCategory: "accessories",
  },
  {
    name: "Summer Straw Hat",
    originalPrice: 1499,
    salePrice: 399,
    discountPct: 73,
    retailer: "Amazon",
    retailerColor: "#FF9900",
    category: "Accessories",
    retailerUrl: "https://www.amazon.in/s?k=summer+straw+hat",
    paletteHex: "#D4B483",
    itemCategory: "accessories",
  },
  {
    name: "Palazzo Pants",
    originalPrice: 1799,
    salePrice: 499,
    discountPct: 72,
    retailer: "Meesho",
    retailerColor: "#0D9488",
    category: "Bottoms",
    retailerUrl: "https://www.meesho.com/search?q=palazzo+pants",
    paletteHex: "#0D9488",
    itemCategory: "bottom",
  },
  {
    name: "Mini Sling Bag",
    originalPrice: 2299,
    salePrice: 699,
    discountPct: 70,
    retailer: "Flipkart",
    retailerColor: "#2874F0",
    category: "Bags",
    retailerUrl: "https://www.flipkart.com/search?q=mini+sling+bag",
    paletteHex: "#2874F0",
    itemCategory: "bag",
  },
  {
    name: "Ethnic Juttis",
    originalPrice: 1999,
    salePrice: 549,
    discountPct: 73,
    retailer: "Ajio",
    retailerColor: "#DC2626",
    category: "Footwear",
    retailerUrl: "https://www.ajio.com/search/?text=ethnic+juttis",
    paletteHex: "#8B2020",
    itemCategory: "shoes",
  },
];

export default function BestDealsPage() {
  const { gender } = useFilters();
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

  // Phase 1: filter deals by gender
  const genderFilteredDeals = SIMULATED_DEALS.filter((d) => {
    if (gender === "male") {
      const femaleItems = [
        "Silk Banarasi Saree",
        "Cotton Anarkali Kurta",
        "Block Heel Sandals",
        "Flared Midi Dress",
        "Tote Handbag",
        "Mini Sling Bag",
      ];
      if (femaleItems.includes(d.name)) return false;
    } else {
      const maleItems = ["Slim Fit Jeans", "Casual Sneakers"];
      if (d.name === "Denim Jacket" && gender === "female") return true;
      // Keep female-friendly items and exclude male-only
      if (maleItems.includes(d.name) && gender !== "female") return true;
    }
    return true;
  });
  const filteredDeals =
    activeCategory === "All"
      ? genderFilteredDeals
      : genderFilteredDeals.filter((d) => d.category === activeCategory);

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
            className="relative overflow-hidden rounded-3xl creamy-card"
            style={{
              background:
                "linear-gradient(135deg, #FF006E 0%, #FB5607 35%, #FFBE0B 70%, #FF006E 100%)",
            }}
            data-ocid="deals.card"
          >
            <div className="relative z-10 p-6 pb-5">
              <button
                type="button"
                onClick={dismissHero}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors text-sm"
                data-ocid="deals.close_button"
              >
                ×
              </button>
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Featured Deals - Color Palette style */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-display font-bold text-base text-foreground">
            🏷️ Featured Sales
          </h2>
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
            8 stores
          </Badge>
        </div>
        <div className="flex items-start gap-2 mb-3 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
          <span className="text-sm mt-0.5">ℹ️</span>
          <p className="text-xs leading-relaxed">
            These are official sale pages from each brand. Deals may vary — we
            point you to the right place, the rest is fashion magic. ✨
          </p>
        </div>

        {/* Color palette grid for retailers */}
        <div
          className="flex gap-3 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {RETAILERS.map((r, i) => (
            <motion.div
              key={r.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center gap-2 flex-shrink-0"
            >
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                data-ocid={`deals.item.${i + 1}`}
                style={{ display: "block" }}
              >
                <ColorPaletteCard
                  hex={r.paletteHex}
                  label={r.name}
                  category={r.category}
                  harmony={r.discount}
                  size="lg"
                />
              </a>
              <span
                className="text-[9px] font-bold text-center"
                style={{ color: r.color, maxWidth: 100, textAlign: "center" }}
              >
                {r.deal}
              </span>
            </motion.div>
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

      {/* Hot Picks - Color Palette design */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-display font-bold text-base text-foreground">
            ⚡ Hot Picks
          </h2>
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
            {filteredDeals.length} deals
          </Badge>
        </div>
        <div className="flex items-start gap-2 mb-3 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
          <span className="text-sm mt-0.5">ℹ️</span>
          <p className="text-xs leading-relaxed">
            We&apos;ve handpicked these for you — while we can&apos;t guarantee
            every deal, most of these are spot on for your style. Happy
            shopping! 💛
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="grid grid-cols-2 gap-4"
          >
            {filteredDeals.map((deal, i) => (
              <motion.div
                key={`${deal.name}-${deal.retailer}`}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className="flex flex-col gap-2"
                data-ocid={`deals.item.${i + 1}`}
              >
                {/* Color palette card */}
                <a
                  href={deal.retailerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "block" }}
                >
                  <ColorPaletteCard
                    hex={deal.paletteHex}
                    label={deal.name}
                    category={deal.itemCategory}
                    harmony={`${deal.discountPct}% OFF`}
                    size="lg"
                  />
                </a>
                {/* Deal info below card */}
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[9px] font-bold rounded-full px-1.5 py-0.5 text-white"
                      style={{ backgroundColor: deal.retailerColor }}
                    >
                      {deal.retailer}
                    </span>
                    <span className="text-[9px] font-black text-red-500">
                      {deal.discountPct}% OFF
                    </span>
                  </div>
                  <p className="text-[10px] font-semibold text-foreground mt-1 leading-tight line-clamp-2">
                    {deal.name}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs font-black text-foreground">
                      ₹{deal.salePrice.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground line-through">
                      ₹{deal.originalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
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

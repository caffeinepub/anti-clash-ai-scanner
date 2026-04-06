import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

interface HowToUseModalProps {
  open: boolean;
  onClose: () => void;
}

const SLIDES = [
  {
    emoji: "🎨",
    title: "Welcome to Colour Clash",
    bullets: [
      "Your AI-powered fashion color advisor",
      "Scan any garment to detect its precise color",
      "Get instant matching outfit suggestions",
    ],
    mock: (
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-20 h-20 rounded-full border-4 border-white/40 shadow-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #87CEEB, #4169E1)" }}
        >
          <span className="text-3xl">🎨</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="h-4 w-24 rounded-full bg-white/30" />
          <span className="text-xs font-bold text-white/90">Sky Blue</span>
          <span className="text-[10px] font-mono text-white/60">#87CEEB</span>
        </div>
      </div>
    ),
  },
  {
    emoji: "📸",
    title: "Color Scanner",
    bullets: [
      "Tap the camera to scan any garment's color",
      "Use gallery or camera to upload a photo",
      "The app detects the exact color name instantly",
    ],
    mock: (
      <div className="flex flex-col items-center gap-2">
        <div
          className="w-32 h-24 rounded-2xl border-2 border-white/40 relative overflow-hidden flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.35)" }}
        >
          <div className="absolute inset-2 border-2 border-white/60 rounded-xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-orange-400 border-2 border-white shadow-lg" />
          <span className="absolute bottom-2 left-0 right-0 text-center text-[9px] text-white/70">
            Viewfinder
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
          <div className="w-3 h-3 rounded-full bg-orange-400" />
          <span className="text-[10px] text-white font-semibold">
            Burnt Sienna detected
          </span>
        </div>
      </div>
    ),
  },
  {
    emoji: "🛍️",
    title: "Shop Matching Styles",
    bullets: [
      "Get outfit suggestions paired with your scanned color",
      "Select garment type (Shirt, Pant, Dress, etc.)",
      "Browse matching colors from 8 top retailers",
    ],
    mock: (
      <div className="flex gap-2">
        {[
          { hex: "#4169E1", label: "Shirt", icon: "👔" },
          { hex: "#34D399", label: "Pant", icon: "👖" },
        ].map((c) => (
          <div
            key={c.hex}
            className="flex-1 rounded-xl overflow-hidden border border-white/20"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            <div
              className="h-16 flex items-center justify-center text-2xl"
              style={{ background: c.hex }}
            >
              {c.icon}
            </div>
            <div className="p-1.5">
              <p className="text-[9px] font-bold text-white text-center">
                {c.label}
              </p>
              <div className="mt-1 space-y-0.5">
                <div className="h-2 rounded bg-white/30 text-[7px] text-white/70 flex items-center px-1">
                  🏮 House of Indya
                </div>
                <div className="h-2 rounded bg-white/20 text-[7px] text-white/60 flex items-center px-1">
                  📦 Amazon
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    emoji: "⭐",
    title: "Outfit Score",
    bullets: [
      "Rate your outfit's color harmony out of 100",
      "Upload a photo of your full outfit",
      "Get a score + AI analysis + skin tone suggestions",
    ],
    mock: (
      <div className="flex flex-col items-center gap-2">
        <div className="relative w-20 h-20">
          <svg
            viewBox="0 0 80 80"
            className="w-full h-full -rotate-90"
            role="img"
            aria-label="Score ring"
          >
            <circle
              cx="40"
              cy="40"
              r="30"
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="8"
            />
            <circle
              cx="40"
              cy="40"
              r="30"
              fill="none"
              stroke="#87CEEB"
              strokeWidth="8"
              strokeDasharray="150 188"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black text-white">85</span>
            <span className="text-[10px] font-bold text-sky-300">A</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-white/80">
            S = Style Master · A = Great Look
          </p>
          <p className="text-[9px] text-white/60">
            B = Good Combo · C = Average
          </p>
        </div>
      </div>
    ),
  },
  {
    emoji: "❤️",
    title: "Favourites & Couple Match",
    bullets: [
      "Save your favorite color palettes",
      "Find matching color combos for couples",
      "Search by occasion (Wedding, Party, Office...)",
    ],
    mock: (
      <div className="flex flex-col gap-2">
        {[
          { his: "#4169E1", hers: "#FFB6C1", label: "Wedding Day" },
          { his: "#2E8B57", hers: "#DA70D6", label: "Date Night" },
        ].map((p) => (
          <div
            key={p.label}
            className="flex items-center gap-2 rounded-xl p-2 border border-white/20"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            <div
              className="w-6 h-6 rounded-full border border-white/30"
              style={{ background: p.his }}
            />
            <span className="text-xs text-white/60">+</span>
            <div
              className="w-6 h-6 rounded-full border border-white/30"
              style={{ background: p.hers }}
            />
            <span className="text-[10px] text-white font-medium flex-1">
              {p.label}
            </span>
            <span className="text-[10px]">❤️</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    emoji: "🔥",
    title: "Trend Radar",
    bullets: [
      "Discover what's trending this season",
      "Filter by gender, age and retailer",
      "Shop trending looks directly from the app",
    ],
    mock: (
      <div
        className="rounded-xl overflow-hidden border border-white/20"
        style={{ background: "rgba(255,255,255,0.1)" }}
      >
        <div className="px-3 py-2 border-b border-white/10">
          <p className="text-[10px] font-bold text-white">
            🔥 SS26 Trending Now
          </p>
        </div>
        <div className="p-2 flex gap-1.5">
          {["#FFE135", "#9966cc", "#8fbc8f", "#e97451"].map((hex) => (
            <div key={hex} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-full border border-white/30"
                style={{ background: hex }}
              />
              <div className="h-1.5 w-10 rounded bg-white/20" />
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    emoji: "💰",
    title: "Best Deals",
    bullets: [
      "Curated deals from top fashion retailers",
      "House of Indya featured — use code CCFLY for 5% off",
      "Updated regularly with the best fashion finds",
    ],
    mock: (
      <div className="flex flex-col gap-1.5">
        <div
          className="rounded-xl p-2.5 border border-pink-400/40"
          style={{ background: "rgba(219,39,119,0.2)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-white">
              🏮 House of Indya
            </span>
            <span className="text-[8px] bg-pink-500 text-white rounded-full px-1.5 py-0.5 font-bold">
              CCFLY -5%
            </span>
          </div>
          <p className="text-[9px] text-white/70 mt-0.5">
            Ethnic wear & fusion styles
          </p>
        </div>
        <div
          className="rounded-xl p-2 border border-white/20"
          style={{ background: "rgba(255,255,255,0.1)" }}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/60 flex items-center justify-center text-sm">
              📦
            </div>
            <div>
              <p className="text-[9px] font-bold text-white">Amazon Fashion</p>
              <p className="text-[8px] text-white/60">
                Free delivery on orders above ₹499
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    emoji: "👤",
    title: "Your Profile",
    bullets: [
      "Set your style preferences (gender, age)",
      "Choose gender, download branding assets",
      "Your scan history is saved privately",
    ],
    mock: (
      <div
        className="rounded-xl p-3 border border-white/20 flex flex-col gap-2"
        style={{ background: "rgba(255,255,255,0.1)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/50 border-2 border-white/30 flex items-center justify-center text-lg">
            👤
          </div>
          <div>
            <div className="h-2.5 w-20 rounded bg-white/40 mb-1" />
            <div className="h-2 w-14 rounded bg-white/20" />
          </div>
        </div>
        <div className="flex gap-1.5">
          {["👔 Male", "🧒 Young", "Size M"].map((tag) => (
            <span
              key={tag}
              className="text-[8px] bg-white/20 rounded-full px-2 py-0.5 text-white font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="h-6 rounded-lg bg-white/15 flex items-center justify-center">
          <span className="text-[9px] text-white/70">
            Download Colour Clash Branding →
          </span>
        </div>
      </div>
    ),
  },
];

export default function HowToUseModal({ open, onClose }: HowToUseModalProps) {
  const [current, setCurrent] = useState(0);

  // Reset to first slide when modal opens
  useEffect(() => {
    if (open) setCurrent(0);
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown")
        setCurrent((c) => Math.min(c + 1, SLIDES.length - 1));
      if (e.key === "ArrowLeft" || e.key === "ArrowUp")
        setCurrent((c) => Math.max(c - 1, 0));
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const slide = SLIDES[current];
  const isFirst = current === 0;
  const isLast = current === SLIDES.length - 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          data-ocid="howto.modal"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal panel */}
          <motion.div
            className="relative z-10 w-full max-w-sm mx-4 sm:mx-0 overflow-hidden"
            style={{ borderRadius: 28 }}
            initial={{ y: 60, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 40, scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            {/* Gradient background matching slide theme */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(160deg, oklch(0.22 0.04 250) 0%, oklch(0.14 0.02 250) 100%)",
              }}
            />
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: `radial-gradient(circle at 30% 20%, ${["#FF6B6B", "#87CEEB", "#34D399", "#818CF8", "#F472B6", "#FBBF24", "#FF6B6B", "#818CF8"][current]} 0%, transparent 60%)`,
              }}
            />

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              aria-label="Close guide"
              data-ocid="howto.close_button"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="relative z-10 p-6 pt-5 pb-4">
              {/* Progress indicator */}
              <div className="flex gap-1 mb-5">
                {SLIDES.map((sl, i) => (
                  <button
                    key={sl.title}
                    type="button"
                    onClick={() => setCurrent(i)}
                    className="flex-1 h-1 rounded-full transition-all duration-300"
                    style={{
                      background:
                        i <= current
                          ? "rgba(255,255,255,0.85)"
                          : "rgba(255,255,255,0.2)",
                    }}
                    aria-label={`Go to slide ${i + 1}`}
                    data-ocid={"howto.tab"}
                  />
                ))}
              </div>

              {/* Slide content with animation */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={current}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="flex flex-col gap-4"
                >
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{slide.emoji}</span>
                    <h2 className="text-lg font-black text-white leading-tight">
                      {slide.title}
                    </h2>
                  </div>

                  {/* Mock visual */}
                  <div
                    className="rounded-2xl p-4 flex items-center justify-center min-h-[120px]"
                    style={{
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    {slide.mock}
                  </div>

                  {/* Bullet points */}
                  <ul className="flex flex-col gap-2">
                    {slide.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <span className="mt-0.5 w-4 h-4 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                          <svg
                            width="8"
                            height="8"
                            viewBox="0 0 8 8"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M1.5 4L3.5 6L6.5 2"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <span className="text-[12px] text-white/80 leading-relaxed">
                          {b}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div
                className="flex items-center justify-between mt-5 pt-4"
                style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
              >
                <button
                  type="button"
                  onClick={() => setCurrent((c) => Math.max(c - 1, 0))}
                  disabled={isFirst}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white/70 disabled:opacity-30 hover:text-white transition-colors py-2 px-3 rounded-xl hover:bg-white/10"
                  data-ocid="howto.pagination_prev"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </button>

                <span className="text-[10px] text-white/40 font-medium">
                  {current + 1} / {SLIDES.length}
                </span>

                {isLast ? (
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex items-center gap-1.5 text-xs font-bold text-white py-2 px-4 rounded-xl transition-all active:scale-95"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.55 0.22 250), oklch(0.48 0.20 280))",
                    }}
                    data-ocid="howto.confirm_button"
                  >
                    Let&apos;s Start! 🚀
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setCurrent((c) => Math.min(c + 1, SLIDES.length - 1))
                    }
                    className="flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white transition-colors py-2 px-3 rounded-xl hover:bg-white/10"
                    data-ocid="howto.pagination_next"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

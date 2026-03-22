import { Info, Palette, TrendingUp } from "lucide-react";
import { motion } from "motion/react";

const SS2026_PALETTES = [
  {
    season: "Spring/Summer 2026",
    description:
      "Soft naturals meet digital brights — a balance of organic warmth and electric vibrancy.",
    colors: [
      { hex: "#C8B8A2", name: "Sand Dune" },
      { hex: "#A8C4A0", name: "Sage Mist" },
      { hex: "#7EB8C4", name: "Sky Wash" },
      { hex: "#F0C87A", name: "Butter Gold" },
      { hex: "#E8887A", name: "Clay Rose" },
    ],
  },
  {
    season: "Autumn/Winter 2026",
    description:
      "Deep moody tones anchored by warm neutrals and bold jewel accents.",
    colors: [
      { hex: "#4A3728", name: "Dark Espresso" },
      { hex: "#8B4A6B", name: "Plum Wine" },
      { hex: "#2C4A60", name: "Ocean Midnight" },
      { hex: "#C47A40", name: "Amber Spice" },
      { hex: "#7A8468", name: "Olive Stone" },
    ],
  },
];

const HARMONY_TYPES = [
  {
    type: "Complementary",
    icon: "◑",
    description:
      "Colors directly opposite on the color wheel. High contrast, bold energy — great for statement outfits.",
    example: ["#4C5F40", "#8B3A6B"],
    tip: "Pair olive green with deep magenta for a head-turning contrast.",
  },
  {
    type: "Analogous",
    icon: "◔",
    description:
      "Colors adjacent on the wheel. Harmonious, cohesive — perfect for effortless layering.",
    example: ["#4C8BBF", "#4CBFB4", "#4C6CBF"],
    tip: "Blue, teal, and indigo create a calm, sophisticated layered look.",
  },
  {
    type: "Triadic",
    icon: "△",
    description:
      "Three colors equally spaced on the wheel. Vibrant and balanced — bold yet wearable.",
    example: ["#BF4C4C", "#4CBF4C", "#4C4CBF"],
    tip: "Red, green, and blue accents together feel playful and complete.",
  },
];

const TREND_TIPS = [
  {
    title: "Quiet Luxury",
    desc: "Subtle, neutral tones with premium textures. Beige, ivory, warm gray — no logos, all quality.",
    color: "#C8B49C",
  },
  {
    title: "Neo-Maximalism",
    desc: "Layering bold patterns and saturated hues. More is more — clash with intention.",
    color: "#E87A4C",
  },
  {
    title: "Digital Naturalism",
    desc: "Earthy palettes amplified with electric brights. Organic base, electric accent.",
    color: "#7AC878",
  },
  {
    title: "Coastal Grandmother",
    desc: "Relaxed linen, soft blues, washed neutrals. Effortless, timeless, coastal ease.",
    color: "#7AB8C4",
  },
];

export default function StyleGuidePage() {
  return (
    <div className="flex flex-col gap-6 pb-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h1 className="font-display font-bold text-xl text-foreground">
            2026 Style Guide
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Color trends and harmony rules to elevate your wardrobe.
        </p>
      </motion.div>

      {SS2026_PALETTES.map((season, si) => (
        <motion.section
          key={season.season}
          className="bg-card rounded-2xl border border-border p-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: si * 0.1 }}
          data-ocid="styleguide.card"
        >
          <div className="flex items-center gap-2 mb-2">
            <Palette className="w-4 h-4 text-primary" />
            <h2 className="font-display font-semibold text-foreground">
              {season.season}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {season.description}
          </p>
          <div className="flex gap-2">
            {season.colors.map((c) => (
              <div key={c.hex} className="flex-1 flex flex-col gap-1.5">
                <div
                  className="w-full rounded-lg border border-border"
                  style={{ height: 56, backgroundColor: c.hex }}
                />
                <p className="text-xs text-center text-muted-foreground leading-tight">
                  {c.name}
                </p>
              </div>
            ))}
          </div>
        </motion.section>
      ))}

      <section>
        <h2 className="font-display font-semibold text-foreground mb-3">
          Color Harmony Principles
        </h2>
        <div className="flex flex-col gap-3">
          {HARMONY_TYPES.map((h, i) => (
            <motion.div
              key={h.type}
              className="bg-card rounded-2xl border border-border p-4"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              data-ocid={`styleguide.item.${i + 1}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{h.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{h.type}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {h.description}
                  </p>
                  <div className="flex gap-2 mt-3 mb-2">
                    {h.example.map((hex) => (
                      <div
                        key={hex}
                        className="w-8 h-8 rounded-full border border-border"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2 bg-muted/40 rounded-lg p-2">
                    <Info className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground italic">
                      {h.tip}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display font-semibold text-foreground mb-3">
          2026 Macro Trends
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {TREND_TIPS.map((t, i) => (
            <motion.div
              key={t.title}
              className="bg-card rounded-2xl border border-border p-4 overflow-hidden relative"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.07 }}
              data-ocid="styleguide.panel"
            >
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                style={{ backgroundColor: t.color }}
              />
              <div
                className="w-8 h-8 rounded-lg mb-2 border border-border"
                style={{ backgroundColor: t.color }}
              />
              <h3 className="font-semibold text-foreground text-sm">
                {t.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {t.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

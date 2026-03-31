interface ColorPaletteCardProps {
  hex: string;
  label: string;
  category: string;
  harmony?: string;
  retailerLinks?: Array<{ name: string; url: string }>;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

// Category SVG silhouette icons (white outlines)
function CategoryIcon({ category }: { category: string }) {
  const style = { width: "100%", height: "100%", opacity: 0.85 };
  const cat = category.toLowerCase();

  if (cat.includes("top") || cat.includes("shirt")) {
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
  if (cat.includes("bottom") || cat.includes("pant") || cat.includes("jean")) {
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
        <line x1="30" y1="20" x2="70" y2="20" stroke="white" strokeWidth="3" />
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
        <circle
          cx="50"
          cy="25"
          r="5"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
      </svg>
    );
  }
  if (cat.includes("stole")) {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={style}
        aria-hidden="true"
      >
        <path
          d="M20 15 C20 15 30 35 50 40 C70 45 80 65 80 65"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M30 15 C30 15 38 30 50 35 C62 40 72 55 80 70"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="4 3"
          fill="none"
        />
      </svg>
    );
  }
  if (cat.includes("suit") || cat.includes("blazer")) {
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
        <circle
          cx="50"
          cy="55"
          r="3"
          stroke="white"
          strokeWidth="2"
          fill="none"
        />
      </svg>
    );
  }
  if (cat.includes("hoodie")) {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={style}
        aria-hidden="true"
      >
        <path
          d="M35 15 C35 15 42 12 50 12 C58 12 65 15 65 15 L82 35 L70 38 L70 85 L30 85 L30 38 L18 35Z"
          stroke="white"
          strokeWidth="3"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M40 12 C40 22 42 26 50 28 C58 26 60 22 60 12"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
      </svg>
    );
  }
  if (cat.includes("shorts")) {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={style}
        aria-hidden="true"
      >
        <path
          d="M20 20 L80 20 L70 65 L60 55 L50 60 L40 55 L30 65Z"
          stroke="white"
          strokeWidth="3"
          strokeLinejoin="round"
          fill="none"
        />
        <line x1="50" y1="20" x2="50" y2="60" stroke="white" strokeWidth="3" />
      </svg>
    );
  }
  if (cat.includes("jeans")) {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={style}
        aria-hidden="true"
      >
        <path
          d="M20 15 L80 15 L72 55 L62 90 L50 72 L38 90 L28 55Z"
          stroke="white"
          strokeWidth="3"
          strokeLinejoin="round"
          fill="none"
        />
        <line x1="50" y1="15" x2="50" y2="72" stroke="white" strokeWidth="3" />
        <path
          d="M30 24 Q35 28 42 26"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    );
  }
  if (
    cat.includes("shoe") ||
    cat.includes("footwear") ||
    cat.includes("sneaker")
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
    cat.includes("access") ||
    cat.includes("glass") ||
    cat.includes("sunglass")
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
        <line
          x1="8"
          y1="50"
          x2="2"
          y2="44"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1="92"
          y1="50"
          x2="98"
          y2="44"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (
    cat.includes("ethnic") ||
    cat.includes("saree") ||
    cat.includes("kurta")
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
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M62 28 C62 28 72 32 80 55 L65 85"
          stroke="white"
          strokeWidth="2.5"
          strokeLinejoin="round"
          fill="none"
        />
        <line x1="38" y1="42" x2="62" y2="42" stroke="white" strokeWidth="2" />
      </svg>
    );
  }
  if (cat.includes("watch")) {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={style}
        aria-hidden="true"
      >
        <circle
          cx="50"
          cy="50"
          r="22"
          stroke="white"
          strokeWidth="3"
          fill="none"
        />
        <rect
          x="40"
          y="22"
          width="20"
          height="12"
          rx="4"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
        <rect
          x="40"
          y="66"
          width="20"
          height="12"
          rx="4"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
        <line
          x1="50"
          y1="38"
          x2="50"
          y2="50"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="50"
          y1="50"
          x2="60"
          y2="55"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (cat.includes("bag") || cat.includes("purse") || cat.includes("handbag")) {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={style}
        aria-hidden="true"
      >
        <path
          d="M25 42 L75 42 L80 82 L20 82Z"
          stroke="white"
          strokeWidth="3"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M38 42 C38 42 38 28 50 28 C62 28 62 42 62 42"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <line x1="20" y1="58" x2="80" y2="58" stroke="white" strokeWidth="2" />
      </svg>
    );
  }
  if (
    cat.includes("jacket") ||
    cat.includes("blazer") ||
    cat.includes("coat")
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
          d="M35 12 L15 32 L28 36 L28 85 L72 85 L72 36 L85 32 L65 12"
          stroke="white"
          strokeWidth="3"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M35 12 C40 22 45 26 50 26 C55 26 60 22 65 12"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
        <path
          d="M35 12 L42 28 L50 26"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
        <path
          d="M65 12 L58 28 L50 26"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
      </svg>
    );
  }
  // Default: star/sparkle
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      aria-hidden="true"
    >
      <polygon
        points="50,15 61,38 86,38 67,57 74,82 50,67 26,82 33,57 14,38 39,38"
        stroke="white"
        strokeWidth="3"
        fill="none"
      />
    </svg>
  );
}

export default function ColorPaletteCard({
  hex,
  label,
  category,
  harmony,
  retailerLinks,
  size = "md",
  onClick,
}: ColorPaletteCardProps) {
  // Determine text color based on background lightness
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const textColor = lum < 0.5 ? "#FFFFFF" : "#1A1A1A";
  const subTextColor = lum < 0.5 ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.55)";

  const sizeMap = {
    sm: { card: 80, icon: 36, fontSize: 9 },
    md: { card: 100, icon: 48, fontSize: 10 },
    lg: { card: 130, icon: 64, fontSize: 11 },
  };
  const dim = sizeMap[size];

  return (
    <button
      type="button"
      onClick={onClick}
      title={retailerLinks ? `Shop ${label}` : label}
      style={{
        background: hex,
        borderRadius: 16,
        width: dim.card,
        minWidth: dim.card,
        height: dim.card,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        cursor: onClick || retailerLinks ? "pointer" : "default",
        border: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
        padding: 0,
        flexShrink: 0,
        transition: "transform 0.15s",
      }}
      onMouseEnter={(e) => {
        if (onClick || retailerLinks)
          (e.currentTarget as HTMLElement).style.transform = "scale(1.05)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "scale(1)";
      }}
    >
      {/* Category icon */}
      <div style={{ width: dim.icon, height: dim.icon, padding: 4 }}>
        <CategoryIcon category={category} />
      </div>
      {/* Label */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "4px 4px 5px",
          background: "rgba(0,0,0,0.32)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: dim.fontSize,
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </div>
        {harmony && (
          <div
            style={{
              fontSize: dim.fontSize - 1,
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.1,
              marginTop: 1,
            }}
          >
            {harmony}
          </div>
        )}
      </div>
      {/* Unused param guard */}
      {textColor && subTextColor ? null : null}
    </button>
  );
}

/** Retailer link list that opens when color card is tapped */
export function ColorPaletteCardWithLinks({
  hex,
  label,
  category,
  harmony,
  size,
  retailerLinks,
}: ColorPaletteCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <ColorPaletteCard
        hex={hex}
        label={label}
        category={category}
        harmony={harmony}
        size={size}
        onClick={
          retailerLinks && retailerLinks.length > 0
            ? () => setOpen((v) => !v)
            : undefined
        }
      />
      {open && retailerLinks && retailerLinks.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            zIndex: 50,
            background: "rgba(20,20,20,0.97)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 14,
            padding: "8px 4px",
            marginTop: 4,
            minWidth: 160,
            maxWidth: 220,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <p
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.45)",
              padding: "0 8px 6px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Shop {label}
          </p>
          {retailerLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                padding: "5px 10px",
                fontSize: 11,
                fontWeight: 600,
                color: "#fff",
                textDecoration: "none",
                borderRadius: 8,
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(255,255,255,0.1)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "transparent";
              }}
            >
              {link.name} →
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";

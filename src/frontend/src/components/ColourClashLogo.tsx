interface ColourClashLogoProps {
  size?: "sm" | "md" | "lg";
}

const LETTER_DATA: {
  letter: string;
  color: string;
  italic: boolean;
  id: string;
}[] = [
  { id: "C1", letter: "C", color: "#FF3B30", italic: false },
  { id: "o1", letter: "o", color: "#FF9500", italic: false },
  { id: "l1", letter: "l", color: "#FFCC00", italic: false },
  { id: "o2", letter: "o", color: "#34C759", italic: false },
  { id: "u1", letter: "u", color: "#00C7BE", italic: false },
  { id: "r1", letter: "r", color: "#0A84FF", italic: false },
  { id: "sp", letter: " ", color: "transparent", italic: false },
  { id: "C2", letter: "C", color: "#111111", italic: true },
  { id: "l2", letter: "l", color: "#111111", italic: true },
  { id: "a1", letter: "a", color: "#111111", italic: true },
  { id: "s1", letter: "s", color: "#111111", italic: true },
  { id: "h1", letter: "h", color: "#111111", italic: true },
];

export default function ColourClashLogo({ size = "md" }: ColourClashLogoProps) {
  const sizeClasses = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-3xl",
  };

  return (
    <span
      className={`font-display font-bold tracking-tight leading-none ${sizeClasses[size]}`}
      aria-label="Colour Clash"
    >
      {LETTER_DATA.map(({ id, letter, color, italic }) =>
        letter === " " ? (
          <span key={id}>&nbsp;</span>
        ) : (
          <span
            key={id}
            style={{ color, fontStyle: italic ? "italic" : "normal" }}
          >
            {letter}
          </span>
        ),
      )}
    </span>
  );
}

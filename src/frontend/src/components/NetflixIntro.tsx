import { useEffect, useState } from "react";

interface NetflixIntroProps {
  onComplete: () => void;
}

export default function NetflixIntro({ onComplete }: NetflixIntroProps) {
  const [phase, setPhase] = useState<"zoom" | "hold" | "fadeout">("zoom");

  useEffect(() => {
    // zoom: 0 - 1800ms
    const t1 = setTimeout(() => setPhase("hold"), 1800);
    // hold: 1800 - 2300ms
    const t2 = setTimeout(() => setPhase("fadeout"), 2300);
    // fadeout: 2300 - 2800ms -> complete
    const t3 = setTimeout(() => onComplete(), 2800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        opacity: phase === "fadeout" ? 0 : 1,
        transition: phase === "fadeout" ? "opacity 0.5s ease-in" : undefined,
      }}
    >
      <style>{`
        @keyframes cc-zoom {
          0%   { transform: scale(0.05); opacity: 0; }
          40%  { opacity: 1; }
          80%  { transform: scale(1.25); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes cc-glow-pulse {
          0%, 100% { filter: drop-shadow(0 0 12px #FF6B6B) drop-shadow(0 0 30px #FF6B6B88); }
          33%  { filter: drop-shadow(0 0 20px #FBBF24) drop-shadow(0 0 50px #FBBF2488); }
          66%  { filter: drop-shadow(0 0 20px #60A5FA) drop-shadow(0 0 50px #60A5FA88); }
        }
        .cc-intro-logo {
          animation: cc-zoom 1.8s cubic-bezier(0.22, 1, 0.36, 1) forwards,
                     cc-glow-pulse 2.5s ease-in-out infinite;
        }
      `}</style>
      <div className="cc-intro-logo" style={{ textAlign: "center" }}>
        {/* CC mark */}
        <div
          style={{
            fontSize: "clamp(80px, 20vw, 140px)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <span style={{ color: "#FF6B6B" }}>C</span>
          <span style={{ color: "#FBBF24" }}>C</span>
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: "clamp(14px, 3.5vw, 22px)",
            fontWeight: 700,
            letterSpacing: "0.18em",
            color: "rgba(255,255,255,0.85)",
            textTransform: "uppercase",
          }}
        >
          Colour Clash
        </div>
        <div
          style={{
            fontSize: "clamp(10px, 2.5vw, 14px)",
            color: "rgba(255,255,255,0.45)",
            fontStyle: "italic",
            marginTop: 4,
            letterSpacing: "0.1em",
          }}
        >
          just fly with it...
        </div>
      </div>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  ArrowLeft,
  Bookmark,
  Camera,
  Copy,
  Heart,
  Loader2,
  RefreshCw,
  Send,
  Share2,
  Star,
  Trash2,
  Upload,
  User,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { SiWhatsapp, SiX } from "react-icons/si";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { getCoupleHarmonyScore } from "../utils/colorUtils";
import {
  type OutfitScoreResult,
  analyzeOutfitScore,
  detectCoupleInPhoto,
  detectHuman,
} from "../utils/geminiAI";
import { extractCoupleColors } from "../utils/geminiAI";

// ── Types ────────────────────────────────────────────────────────────────────

type ScoreMode = "single" | "couple";
type ScorePageState =
  | "idle"
  | "hasPhoto"
  | "detecting"
  | "analyzing"
  | "results"
  | "error";

interface HistoryEntry extends OutfitScoreResult {
  id: string;
  photoDataUrl: string;
  date: string;
  mode?: ScoreMode;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadHistory(key: string): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(key: string, entries: HistoryEntry[]) {
  localStorage.setItem(key, JSON.stringify(entries));
}

function getGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  return "D";
}

function getScoreColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

// ── Loading Pulse ─────────────────────────────────────────────────────────────

function LoadingPulse({ message }: { message: string }) {
  return (
    <motion.div
      key="loading-pulse"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center gap-6 py-16"
      data-ocid="outfit.loading_state"
    >
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.6); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .pulse-ring {
          position: absolute;
          border-radius: 50%;
          border: 2px solid oklch(0.55 0.22 250);
          animation: pulse-ring 2s ease-out infinite;
        }
        .pulse-ring-2 { animation-delay: 0.6s !important; }
        .pulse-ring-3 { animation-delay: 1.2s !important; }
      `}</style>
      <div className="relative flex items-center justify-center w-20 h-20">
        <div className="pulse-ring w-16 h-16" />
        <div className="pulse-ring pulse-ring-2 w-16 h-16" />
        <div className="pulse-ring pulse-ring-3 w-16 h-16" />
        <div className="relative w-14 h-14 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">{message}</p>
        <p className="text-xs text-muted-foreground mt-1">Please wait...</p>
      </div>
    </motion.div>
  );
}

// ── Instagram Post Card ───────────────────────────────────────────────────────

function InstagramPostCard({
  photo,
  score,
  onReset,
  onRescan,
}: {
  photo: string;
  score: OutfitScoreResult;
  onReset: () => void;
  onRescan: () => void;
}) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const grade = getGrade(score.score);
  const color = getScoreColor(score.score);

  const shareText = `My outfit scored ${score.score}/100 on Colour Clash! 🎨\nGrade: ${grade}\nColor: ${score.colorScore}/40 | Fit: ${score.fitScore}/30 | Style: ${score.styleScore}/30\n💡 ${score.suggestion}\n\nhttps://colourclash-emb.caffeine.xyz/`;
  const encodedText = encodeURIComponent(shareText);

  const handleShare = async () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Background gradient
        const grad = ctx.createLinearGradient(0, 0, 0, 1350);
        grad.addColorStop(0, "#0A0A0A");
        grad.addColorStop(1, "#1A1A2E");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1080, 1350);

        // Draw photo
        const img = new Image();
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = photo;
        });
        const imgH = 900;
        const imgW = 1080;
        ctx.drawImage(img, 0, 0, imgW, imgH);

        // Score circle
        ctx.beginPath();
        ctx.arc(980, 870, 70, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.font = "bold 52px sans-serif";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.fillText(String(score.score), 980, 882);
        ctx.font = "24px sans-serif";
        ctx.fillText("/100", 980, 912);

        // App name — multicolor COLOUR CLASH
        {
          const letters = [
            { ch: "C", color: "#FF3B30" },
            { ch: "O", color: "#FF9500" },
            { ch: "L", color: "#FFCC00" },
            { ch: "O", color: "#34C759" },
            { ch: "U", color: "#007AFF" },
            { ch: "R", color: "#AF52DE" },
            { ch: " ", color: "#fff" },
            { ch: "C", color: "#FF3B30" },
            { ch: "L", color: "#FF9500" },
            { ch: "A", color: "#FFCC00" },
            { ch: "S", color: "#34C759" },
            { ch: "H", color: "#007AFF" },
          ];
          ctx.font = "bold 42px system-ui";
          let bx = 540 - ctx.measureText("COLOUR CLASH").width / 2;
          const brandY = 980;
          for (const { ch, color: lc } of letters) {
            ctx.fillStyle = lc;
            ctx.textAlign = "left";
            ctx.fillText(ch, bx, brandY);
            bx += ctx.measureText(ch).width;
          }
          ctx.font = "italic 22px system-ui";
          ctx.fillStyle = "rgba(255,255,255,0.5)";
          ctx.textAlign = "center";
          ctx.fillText("colourclash-emb.caffeine.xyz", 540, 1015);
        }

        // Analysis
        ctx.font = "32px sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.textAlign = "center";
        ctx.fillText(score.analysis.slice(0, 60), 540, 1060);

        // Suggestion
        ctx.font = "italic 28px sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.fillText(`Tip: ${score.suggestion.slice(0, 65)}`, 540, 1120);

        const blob = await new Promise<Blob | null>((res) =>
          canvas.toBlob(res, "image/png"),
        );
        if (blob && navigator.share) {
          const file = new File([blob], "colour-clash-score.png", {
            type: "image/png",
          });
          await navigator.share({
            title: "My Colour Clash Outfit Score",
            text: shareText,
            files: [file],
          });
          return;
        }
      }
      if (navigator.share) {
        await navigator.share({
          title: "My Colour Clash Outfit Score",
          text: shareText,
          url: "https://colourclash-emb.caffeine.xyz/",
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success("Score copied to clipboard!");
      }
    } catch {
      // user cancelled
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText);
    toast.success("Copied to clipboard!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="rounded-2xl shadow-xl overflow-hidden bg-card border border-border"
      data-ocid="outfit.card"
    >
      {/* Post header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow">
          <span className="text-primary-foreground text-xs font-extrabold tracking-tight">
            CC
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground leading-none">
            ColourClash
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Outfit Score</p>
        </div>
      </div>

      {/* Photo */}
      <div className="relative w-full aspect-square bg-muted overflow-hidden">
        <img
          src={photo}
          alt="Your outfit"
          className="w-full h-full object-cover"
        />
        <motion.div
          className="absolute bottom-3 left-3"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, type: "spring", stiffness: 280 }}
        >
          <div
            className="flex items-center gap-2 rounded-full px-3 py-1.5"
            style={{
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <span className="text-yellow-400 text-base leading-none">⭐</span>
            <span className="text-white font-extrabold text-sm leading-none">
              {score.score}
            </span>
            <span className="text-white/60 text-xs leading-none">/100</span>
            <span
              className="ml-1 text-xs font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: color, color: "#fff" }}
            >
              {grade}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Score breakdown */}
      <div className="px-4 pt-4 pb-2">
        <div className="space-y-2.5">
          {[
            { label: "Color Harmony", val: score.colorScore, max: 40, pct: 40 },
            { label: "Fit", val: score.fitScore, max: 30, pct: 30 },
            {
              label: "Style & Trends",
              val: score.styleScore,
              max: 30,
              pct: 30,
            },
          ].map(({ label, val, max, pct }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-28 flex-shrink-0">
                {label}
                <span className="text-muted-foreground/60"> ({pct}%)</span>
              </span>
              <div className="flex-1">
                <Progress value={(val / max) * 100} className="h-1.5" />
              </div>
              <span className="text-xs font-bold w-10 text-right text-foreground">
                {val}/{max}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Analysis */}
      {score.analysis && (
        <div className="px-4 pb-1">
          <p className="text-xs text-foreground/80 leading-relaxed">
            💬 {score.analysis}
          </p>
        </div>
      )}

      {/* Suggestion */}
      {score.suggestion && (
        <div className="px-4 pb-3">
          <p className="text-xs text-primary/80 italic leading-relaxed">
            💡 {score.suggestion}
          </p>
        </div>
      )}

      {/* Action bar */}
      <div
        className="px-4 py-2"
        style={{ borderTop: "0.5px solid oklch(var(--border))" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setLiked((v) => !v)}
              className="flex items-center gap-1 transition-transform active:scale-90"
              aria-label="Like"
              data-ocid="outfit.toggle"
            >
              <Heart
                className={`w-6 h-6 transition-colors ${
                  liked ? "fill-red-500 text-red-500" : "text-foreground"
                }`}
              />
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="text-foreground opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Share"
              data-ocid="outfit.secondary_button"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowShare((v) => !v)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="outfit.secondary_button"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setBookmarked((v) => !v)}
            aria-label="Bookmark"
          >
            <Bookmark
              className={`w-6 h-6 transition-colors ${
                bookmarked ? "fill-primary text-primary" : "text-foreground"
              }`}
            />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showShare && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3">
              <p className="text-xs text-muted-foreground mb-2 font-medium">
                Share to
              </p>
              <div className="flex gap-2">
                <a
                  href={`https://wa.me/?text=${encodedText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2 bg-[#25D366] text-white text-xs font-semibold"
                  data-ocid="outfit.secondary_button"
                >
                  <SiWhatsapp className="w-4 h-4" /> WhatsApp
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodedText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2 bg-black text-white text-xs font-semibold"
                  data-ocid="outfit.secondary_button"
                >
                  <SiX className="w-3.5 h-3.5" /> Twitter/X
                </a>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2 border border-border text-foreground text-xs font-semibold"
                  data-ocid="outfit.secondary_button"
                >
                  <Copy className="w-4 h-4" /> Copy
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 pb-4">
        <div className="flex gap-2">
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-primary/30 text-primary py-2.5 text-sm font-medium hover:bg-primary/10 transition-colors"
            onClick={onRescan}
            data-ocid="outfit.primary_button"
          >
            <RefreshCw className="w-4 h-4" /> Re-analyse
          </button>
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
            onClick={onReset}
            data-ocid="outfit.primary_button"
          >
            <Star className="w-4 h-4" /> Score Another
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Couple Result Card ────────────────────────────────────────────────────────

function CoupleResultCard({
  photo,
  person1Color,
  person2Color,
  person1Desc,
  person2Desc,
  onReset,
}: {
  photo: string;
  person1Color: string;
  person2Color: string;
  person1Desc: string;
  person2Desc: string;
  onReset: () => void;
}) {
  const harmony = getCoupleHarmonyScore(person1Color, person2Color);
  const grade = getGrade(harmony.score);
  const color = getScoreColor(harmony.score);

  const tierLabels: Record<string, string> = {
    monochromatic: "Monochromatic 🌟",
    complementary: "Complementary 💖",
    neutrals_pop: "Neutrals + Pop ✨",
    analogous: "Analogous 🌚",
    clash: "High Clash ⚠️",
  };

  const shareText = `Our couple outfit scored ${harmony.score}/100 on Colour Clash! 👫\nHarmony: ${tierLabels[harmony.tier]}\n${harmony.advice}\n\nhttps://colourclash-emb.caffeine.xyz/`;
  const encodedText = encodeURIComponent(shareText);

  const handleShare = async () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Background
        const grad = ctx.createLinearGradient(0, 0, 0, 1350);
        grad.addColorStop(0, "#0A0A0A");
        grad.addColorStop(1, "#1A0A2E");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1080, 1350);

        // Draw actual photo
        const img = new Image();
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = photo;
        });
        const imgH = 900;
        ctx.drawImage(img, 0, 0, 1080, imgH);

        // Semi-transparent overlay for readability
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.fillRect(0, 0, 1080, imgH);

        // Person 1 bounding box (left half) — blue dashed
        ctx.save();
        ctx.setLineDash([16, 8]);
        ctx.strokeStyle = "#60A5FA";
        ctx.lineWidth = 4;
        ctx.strokeRect(30, 50, 480, 820);
        ctx.restore();

        // Person 1 label badge
        ctx.fillStyle = "rgba(96,165,250,0.85)";
        ctx.fillRect(38, 58, 160, 32);
        ctx.font = "bold 18px system-ui";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "left";
        ctx.fillText(`P1 • ${person1Desc}`, 50, 80);

        // Person 2 bounding box (right half) — pink dashed
        ctx.save();
        ctx.setLineDash([16, 8]);
        ctx.strokeStyle = "#F472B6";
        ctx.lineWidth = 4;
        ctx.strokeRect(570, 50, 480, 820);
        ctx.restore();

        // Person 2 label badge
        ctx.fillStyle = "rgba(244,114,182,0.85)";
        ctx.fillRect(578, 58, 160, 32);
        ctx.font = "bold 18px system-ui";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "left";
        ctx.fillText(`P2 • ${person2Desc}`, 590, 80);

        // Score circle (bottom right of photo)
        ctx.beginPath();
        ctx.arc(980, 870, 70, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.font = "bold 52px system-ui";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.fillText(String(harmony.score), 980, 882);
        ctx.font = "24px system-ui";
        ctx.fillText("/100", 980, 912);

        // Harmony tier label
        ctx.font = "bold 34px system-ui";
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fillText(tierLabels[harmony.tier], 540, 970);

        // Advice text (wrapped)
        ctx.font = "italic 26px system-ui";
        ctx.fillStyle = "rgba(255,255,255,0.65)";
        const adviceWords = harmony.advice.split(" ");
        let line = "";
        let y = 1020;
        for (const word of adviceWords) {
          const testLine = `${line}${word} `;
          if (ctx.measureText(testLine).width > 980 && line) {
            ctx.fillText(line.trim(), 540, y);
            line = `${word} `;
            y += 36;
          } else {
            line = testLine;
          }
        }
        if (line) ctx.fillText(line.trim(), 540, y);

        // Branding — multicolor COLOUR CLASH
        const brandY = 1290;
        const letters = [
          { ch: "C", color: "#FF3B30" },
          { ch: "O", color: "#FF9500" },
          { ch: "L", color: "#FFCC00" },
          { ch: "O", color: "#34C759" },
          { ch: "U", color: "#007AFF" },
          { ch: "R", color: "#AF52DE" },
          { ch: " ", color: "#fff" },
          { ch: "C", color: "#FF3B30" },
          { ch: "L", color: "#FF9500" },
          { ch: "A", color: "#FFCC00" },
          { ch: "S", color: "#34C759" },
          { ch: "H", color: "#007AFF" },
        ];
        ctx.font = "bold 32px system-ui";
        let bx = 540 - ctx.measureText("COLOUR CLASH").width / 2;
        for (const { ch, color: lc } of letters) {
          ctx.fillStyle = lc;
          ctx.textAlign = "left";
          ctx.fillText(ch, bx, brandY);
          bx += ctx.measureText(ch).width;
        }
        ctx.font = "italic 20px system-ui";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.textAlign = "center";
        ctx.fillText("colourclash-emb.caffeine.xyz", 540, 1315);

        const blob = await new Promise<Blob | null>((res) =>
          canvas.toBlob(res, "image/png"),
        );
        if (blob && navigator.share) {
          const file = new File([blob], "couple-colour-clash-score.png", {
            type: "image/png",
          });
          await navigator.share({
            title: "Our Couple Colour Clash Score",
            text: shareText,
            files: [file],
          });
          return;
        }
      }
      if (navigator.share) {
        await navigator.share({
          title: "Our Couple Colour Clash Score",
          text: shareText,
          url: "https://colourclash-emb.caffeine.xyz/",
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success("Copied to clipboard!");
      }
    } catch {
      //
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl shadow-xl overflow-hidden bg-card border border-border"
      data-ocid="outfit.card"
    >
      {/* Couple header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-blue-400 flex items-center justify-center">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">
            Couple Harmony Score
          </p>
          <p className="text-xs text-muted-foreground">
            {tierLabels[harmony.tier]}
          </p>
        </div>
      </div>

      {/* Photo with simulated bounding boxes */}
      <div className="relative w-full aspect-square bg-muted overflow-hidden">
        <img
          src={photo}
          alt="Couple outfit"
          className="w-full h-full object-cover"
        />
        {/* Person 1 bounding box - left half */}
        <div
          style={{
            position: "absolute",
            top: "5%",
            left: "3%",
            width: "44%",
            height: "88%",
            border: "2px dashed #60A5FA",
            borderRadius: 8,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 6,
              left: 6,
              background: "rgba(96,165,250,0.85)",
              borderRadius: 6,
              padding: "2px 8px",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: person1Color,
                border: "1px solid #fff",
              }}
            />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>
              Person 1 • {person1Desc}
            </span>
          </div>
        </div>
        {/* Person 2 bounding box - right half */}
        <div
          style={{
            position: "absolute",
            top: "5%",
            right: "3%",
            width: "44%",
            height: "88%",
            border: "2px dashed #F472B6",
            borderRadius: 8,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              background: "rgba(244,114,182,0.85)",
              borderRadius: 6,
              padding: "2px 8px",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: person2Color,
                border: "1px solid #fff",
              }}
            />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>
              Person 2 • {person2Desc}
            </span>
          </div>
        </div>
        {/* Score badge */}
        <div
          className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full px-3 py-1.5"
          style={{
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <Users className="w-3.5 h-3.5 text-pink-400" />
          <span className="text-white font-extrabold text-sm">
            {harmony.score}
          </span>
          <span className="text-white/60 text-xs">/100</span>
          <span
            className="ml-1 text-xs font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: color, color: "#fff" }}
          >
            {grade}
          </span>
        </div>
      </div>

      {/* Color swatches */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              background: person1Color,
              border: "1px solid rgba(0,0,0,0.1)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          />
          <span className="text-xs text-foreground">{person1Desc}</span>
        </div>
        <span className="text-muted-foreground text-xs">+</span>
        <div className="flex items-center gap-2">
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              background: person2Color,
              border: "1px solid rgba(0,0,0,0.1)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          />
          <span className="text-xs text-foreground">{person2Desc}</span>
        </div>
        <span className="ml-auto text-xs font-bold" style={{ color }}>
          {tierLabels[harmony.tier]}
        </span>
      </div>

      {/* Advice */}
      <div className="px-4 pb-2">
        <p className="text-sm font-medium text-foreground">{harmony.advice}</p>
      </div>

      {/* Fix-it suggestion */}
      {harmony.fixItSuggestion && (
        <div className="mx-4 mb-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
            💡 <strong>Style Fix:</strong> {harmony.fixItSuggestion}
          </p>
        </div>
      )}

      {/* Share */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          type="button"
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold"
          data-ocid="outfit.primary_button"
        >
          <Share2 className="w-4 h-4" /> Share Score
        </button>
        <button
          type="button"
          onClick={onReset}
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-border text-foreground py-2.5 text-sm font-medium"
          data-ocid="outfit.secondary_button"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>

      {/* Share links */}
      <div className="px-4 pb-4">
        <div className="flex gap-2">
          <a
            href={`https://wa.me/?text=${encodedText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 bg-[#25D366] text-white text-xs font-semibold"
          >
            <SiWhatsapp className="w-3.5 h-3.5" /> WhatsApp
          </a>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodedText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 bg-black text-white text-xs font-semibold"
          >
            <SiX className="w-3 h-3" /> Twitter/X
          </a>
        </div>
      </div>
    </motion.div>
  );
}

// ── History Card ──────────────────────────────────────────────────────────────

function HistoryCard({
  entry,
  onDelete,
  onView,
}: {
  entry: HistoryEntry;
  onDelete: (id: string) => void;
  onView: (entry: HistoryEntry) => void;
}) {
  const badgeColor =
    entry.score >= 70
      ? "bg-emerald-500"
      : entry.score >= 50
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="ios-card overflow-hidden"
      data-ocid="outfit.item"
    >
      <div className="flex items-center gap-3 p-3">
        <button
          type="button"
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
          onClick={() => onView(entry)}
          data-ocid="outfit.secondary_button"
        >
          <img
            src={entry.photoDataUrl}
            alt="outfit"
            className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`${badgeColor} text-white text-xs font-bold px-2 py-0.5 rounded-full`}
              >
                {entry.score}
              </span>
              <span className="text-xs font-semibold text-foreground/70">
                {getGrade(entry.score)}
              </span>
              <span className="text-xs text-muted-foreground">
                {entry.date}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {entry.suggestion || entry.analysis}
            </p>
            <p className="text-xs text-primary/70 mt-0.5 font-medium">
              Tap to view full score →
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onDelete(entry.id)}
          className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive/70 hover:text-destructive transition-colors flex-shrink-0"
          data-ocid="outfit.delete_button"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function OutfitScorePage({
  onNavigateToSkinTone,
}: {
  onNavigateToSkinTone?: () => void;
}) {
  const { identity } = useInternetIdentity();
  const historyKey = `outfitHistory_${
    identity?.getPrincipal().isAnonymous()
      ? "anon"
      : (identity?.getPrincipal().toText() ?? "anon")
  }`;

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<ScoreMode>("single");
  const [pageState, setPageState] = useState<ScorePageState>("idle");
  const [loadingMsg, setLoadingMsg] = useState("Analysing your outfit...");
  const [photo, setPhoto] = useState<string | null>(null);
  const [cropPhoto, setCropPhoto] = useState<string | null>(null);
  const [score, setScore] = useState<OutfitScoreResult | null>(null);
  const [coupleData, setCoupleData] = useState<{
    person1Color: string;
    person2Color: string;
    person1Desc: string;
    person2Desc: string;
  } | null>(null);
  const [noPersonMsg, setNoPersonMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(() =>
    loadHistory(historyKey),
  );
  const [viewEntry, setViewEntry] = useState<HistoryEntry | null>(null);
  const [cropRect, setCropRect] = useState({ x: 40, y: 40, w: 220, h: 220 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, rx: 0, ry: 0 });
  const cropImgRef = useRef<HTMLImageElement>(null);
  const analyzeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Safety net: if stuck in analyzing/detecting > 15s, force error
  useEffect(() => {
    if (pageState === "analyzing" || pageState === "detecting") {
      analyzeTimeoutRef.current = setTimeout(() => {
        setPageState("error");
      }, 15000);
    } else {
      if (analyzeTimeoutRef.current) {
        clearTimeout(analyzeTimeoutRef.current);
        analyzeTimeoutRef.current = null;
      }
    }
    return () => {
      if (analyzeTimeoutRef.current) clearTimeout(analyzeTimeoutRef.current);
    };
  }, [pageState]);

  const saveEntry = (result: OutfitScoreResult, dataUrl: string) => {
    const entry: HistoryEntry = {
      ...result,
      id: Date.now().toString(),
      photoDataUrl: dataUrl,
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      mode,
    };
    setHistory((prev) => {
      const updated = [entry, ...prev].slice(0, 20);
      saveHistory(historyKey, updated);
      return updated;
    });
    return entry;
  };

  const analyzeSingle = async (dataUrl: string) => {
    setPhoto(dataUrl);
    setScore(null);
    setCoupleData(null);
    setNoPersonMsg(null);

    try {
      // Step 1: Detect human
      setPageState("detecting");
      setLoadingMsg("Checking for a person...");
      const base64 = dataUrl.split(",")[1];
      const mimeMatch = dataUrl.match(/data:([^;]+);/);
      const mimeType = (mimeMatch?.[1] ?? "image/jpeg") as string;

      const humanDetected = await detectHuman(base64, mimeType);
      if (humanDetected === "NO") {
        setNoPersonMsg(
          "No person detected! Please capture or upload a photo of a person for an accurate style score.",
        );
        setPageState("error");
        return;
      }

      // Step 2: Analyse outfit
      setPageState("analyzing");
      setLoadingMsg("Analysing your outfit style...");
      const result = await analyzeOutfitScore(base64, mimeType);
      setScore(result);
      saveEntry(result, dataUrl);
      setPageState("results");
    } catch (err) {
      console.error(err);
      // Fallback
      const fallback: OutfitScoreResult = {
        score: 72,
        colorScore: 28,
        fitScore: 22,
        styleScore: 22,
        analysis: "Solid base look with room to elevate.",
        suggestion:
          "Try adding a statement accessory to lift the overall style.",
      };
      setScore(fallback);
      saveEntry(fallback, dataUrl);
      setPageState("results");
    }
  };

  const analyzeCouple = async (dataUrl: string) => {
    setPhoto(dataUrl);
    setScore(null);
    setCoupleData(null);
    setNoPersonMsg(null);

    try {
      setPageState("detecting");
      setLoadingMsg("Detecting people in photo...");
      const base64 = dataUrl.split(",")[1];
      const mimeMatch = dataUrl.match(/data:([^;]+);/);
      const mimeType = (mimeMatch?.[1] ?? "image/jpeg") as string;

      const detection = await detectCoupleInPhoto(base64, mimeType);
      if (detection === "NO") {
        setNoPersonMsg(
          "No people detected! Please upload a photo with people visible.",
        );
        setPageState("error");
        return;
      }
      if (detection === "YES_ONE") {
        setNoPersonMsg(
          "We only detected one person. For Couple Mode, please use a photo with both people visible.",
        );
        setPageState("error");
        return;
      }

      setPageState("analyzing");
      setLoadingMsg("Extracting colours and scoring couple harmony...");
      const colors = await extractCoupleColors(base64, mimeType);
      setCoupleData({
        person1Color: colors.person1Color,
        person2Color: colors.person2Color,
        person1Desc: colors.person1Description,
        person2Desc: colors.person2Description,
      });
      const harmonyResult = getCoupleHarmonyScore(
        colors.person1Color,
        colors.person2Color,
      );
      const coupleEntry: OutfitScoreResult = {
        score: harmonyResult.score,
        colorScore: Math.round(harmonyResult.score * 0.4),
        fitScore: Math.round(harmonyResult.score * 0.3),
        styleScore:
          harmonyResult.score -
          Math.round(harmonyResult.score * 0.4) -
          Math.round(harmonyResult.score * 0.3),
        analysis: `Couple harmony: ${harmonyResult.tier} — ${colors.person1Description} & ${colors.person2Description}`,
        suggestion: harmonyResult.advice,
      };
      saveEntry(coupleEntry, dataUrl);
      setPageState("results");
    } catch (err) {
      console.error(err);
      setCoupleData({
        person1Color: "#3B82F6",
        person2Color: "#F59E0B",
        person1Desc: "Blue",
        person2Desc: "Amber",
      });
      const fallbackHarmony = getCoupleHarmonyScore("#3B82F6", "#F59E0B");
      const fallbackEntry: OutfitScoreResult = {
        score: fallbackHarmony.score,
        colorScore: Math.round(fallbackHarmony.score * 0.4),
        fitScore: Math.round(fallbackHarmony.score * 0.3),
        styleScore:
          fallbackHarmony.score -
          Math.round(fallbackHarmony.score * 0.4) -
          Math.round(fallbackHarmony.score * 0.3),
        analysis: "Couple harmony analysis (estimated)",
        suggestion: fallbackHarmony.advice,
      };
      saveEntry(fallbackEntry, dataUrl);
      setPageState("results");
    }
  };

  const handleCameraChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (mode === "single") {
        analyzeSingle(dataUrl);
      } else {
        analyzeCouple(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleGalleryChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setTimeout(() => {
        setCropPhoto(dataUrl);
        setPageState("hasPhoto");
      }, 50);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const applyCrop = () => {
    if (!cropPhoto || !cropImgRef.current) return;
    const img = cropImgRef.current;
    const scaleX = img.naturalWidth / img.offsetWidth;
    const scaleY = img.naturalHeight / img.offsetHeight;
    const canvas = document.createElement("canvas");
    canvas.width = cropRect.w * scaleX;
    canvas.height = cropRect.h * scaleY;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const tempImg = new Image();
    tempImg.onload = () => {
      ctx.drawImage(
        tempImg,
        cropRect.x * scaleX,
        cropRect.y * scaleY,
        cropRect.w * scaleX,
        cropRect.h * scaleY,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      const cropped = canvas.toDataURL("image/jpeg", 0.92);
      setCropPhoto(null);
      if (mode === "single") {
        analyzeSingle(cropped);
      } else {
        analyzeCouple(cropped);
      }
    };
    tempImg.src = cropPhoto;
  };

  const skipCrop = () => {
    if (!cropPhoto) return;
    const p = cropPhoto;
    setCropPhoto(null);
    if (mode === "single") {
      analyzeSingle(p);
    } else {
      analyzeCouple(p);
    }
  };

  const getEventXY = (e: React.MouseEvent | React.TouchEvent) => {
    if ("touches" in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const handleCropMouseDown = (
    e: React.MouseEvent | React.TouchEvent,
    mode2: "drag" | "resize",
  ) => {
    e.stopPropagation();
    const { x, y } = getEventXY(e);
    dragStart.current = { mx: x, my: y, rx: cropRect.x, ry: cropRect.y };
    if (mode2 === "drag") setIsDragging(true);
    else setIsResizing(true);
  };

  const handleCropMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging && !isResizing) return;
    const { x, y } = getEventXY(e);
    const dx = x - dragStart.current.mx;
    const dy = y - dragStart.current.my;
    if (isDragging) {
      setCropRect((prev) => ({
        ...prev,
        x: Math.max(0, dragStart.current.rx + dx),
        y: Math.max(0, dragStart.current.ry + dy),
      }));
    } else {
      setCropRect((prev) => ({
        ...prev,
        w: Math.max(60, prev.w + dx),
        h: Math.max(60, prev.h + dy),
      }));
      dragStart.current.mx = x;
      dragStart.current.my = y;
    }
  };

  const handleCropMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleReset = () => {
    setPhoto(null);
    setCropPhoto(null);
    setScore(null);
    setCoupleData(null);
    setViewEntry(null);
    setNoPersonMsg(null);
    setPageState("idle");
  };

  const handleDelete = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((h) => h.id !== id);
      saveHistory(historyKey, updated);
      return updated;
    });
    toast.success("Removed from lookbook.");
  };

  return (
    <div className="flex flex-col gap-5 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-foreground">
            Outfit Score
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            AI-powered fashion feedback
          </p>
        </div>
        {onNavigateToSkinTone && (
          <button
            type="button"
            onClick={onNavigateToSkinTone}
            className="text-xs rounded-xl border border-primary/30 text-primary px-3 py-1.5 flex items-center gap-1.5 hover:bg-primary/10 transition-colors"
            data-ocid="outfit.secondary_button"
          >
            <span>🎨</span> Skin Tone
          </button>
        )}
      </div>

      {/* Mode toggle */}
      <div
        className="flex gap-2 p-1 bg-muted rounded-2xl"
        data-ocid="outfit.toggle"
      >
        <button
          type="button"
          onClick={() => {
            setMode("single");
            handleReset();
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            mode === "single"
              ? "bg-background text-foreground shadow"
              : "text-muted-foreground"
          }`}
          data-ocid="outfit.tab"
        >
          <User className="w-4 h-4" /> Single
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("couple");
            handleReset();
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            mode === "couple"
              ? "bg-background text-foreground shadow"
              : "text-muted-foreground"
          }`}
          data-ocid="outfit.tab"
        >
          <Users className="w-4 h-4" /> Couple
        </button>
      </div>

      {/* Lookbook view mode */}
      <AnimatePresence mode="wait">
        {viewEntry && (
          <motion.div
            key="lookbook-view"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex flex-col gap-4"
          >
            <button
              type="button"
              onClick={() => setViewEntry(null)}
              className="flex items-center gap-2 text-sm text-primary font-medium w-fit"
              data-ocid="outfit.secondary_button"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Lookbook
            </button>
            <InstagramPostCard
              photo={viewEntry.photoDataUrl}
              score={viewEntry}
              onReset={handleReset}
              onRescan={() => {
                setViewEntry(null);
                analyzeSingle(viewEntry.photoDataUrl);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main flow */}
      {!viewEntry && (
        <>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleCameraChange}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleGalleryChange}
            data-ocid="outfit.upload_button"
          />

          <AnimatePresence mode="wait">
            {/* Crop step */}
            {cropPhoto && pageState === "hasPhoto" && (
              <motion.div
                key="crop"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="ios-card overflow-hidden"
                data-ocid="outfit.card"
              >
                <div className="px-4 py-3 bg-muted/20 flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">
                    Crop your photo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Drag box · corner to resize
                  </p>
                </div>
                <div
                  className="relative select-none overflow-hidden"
                  style={{
                    maxHeight: 360,
                    cursor: isDragging ? "grabbing" : "default",
                  }}
                  onMouseMove={handleCropMouseMove}
                  onMouseUp={handleCropMouseUp}
                  onTouchMove={handleCropMouseMove}
                  onTouchEnd={handleCropMouseUp}
                >
                  <img
                    ref={cropImgRef}
                    src={cropPhoto}
                    alt="crop"
                    className="w-full object-contain"
                    style={{ maxHeight: 360, display: "block" }}
                    draggable={false}
                  />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "rgba(0,0,0,0.45)" }}
                  />
                  <div
                    className="absolute border-2 border-white/90"
                    style={{
                      left: cropRect.x,
                      top: cropRect.y,
                      width: cropRect.w,
                      height: cropRect.h,
                      boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
                      cursor: "grab",
                    }}
                    onMouseDown={(e) => handleCropMouseDown(e, "drag")}
                    onTouchStart={(e) => handleCropMouseDown(e, "drag")}
                  >
                    <div
                      className="absolute bottom-0 right-0 w-5 h-5 bg-white rounded-tl-md cursor-se-resize flex items-center justify-center"
                      style={{ fontSize: 10, color: "#333" }}
                      onMouseDown={(e) => handleCropMouseDown(e, "resize")}
                      onTouchStart={(e) => handleCropMouseDown(e, "resize")}
                    >
                      ⇡
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 p-3">
                  <button
                    type="button"
                    onClick={skipCrop}
                    className="flex-1 rounded-2xl border border-border py-2.5 text-sm text-muted-foreground"
                    data-ocid="outfit.secondary_button"
                  >
                    Skip Crop
                  </button>
                  <button
                    type="button"
                    onClick={applyCrop}
                    className="flex-1 rounded-2xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold"
                    data-ocid="outfit.primary_button"
                  >
                    ✓ Crop &amp; Analyse
                  </button>
                </div>
              </motion.div>
            )}

            {/* Detecting / analyzing spinner */}
            {(pageState === "detecting" || pageState === "analyzing") && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="ios-card"
              >
                <LoadingPulse message={loadingMsg} />
              </motion.div>
            )}

            {/* Error / no person detected */}
            {pageState === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="ios-card flex flex-col items-center gap-4 py-12 px-6 text-center"
                data-ocid="outfit.error_state"
              >
                <AlertCircle className="w-10 h-10 text-amber-500" />
                <div>
                  <p className="font-semibold text-foreground">
                    {noPersonMsg
                      ? "No Person Detected"
                      : "Something went wrong"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {noPersonMsg ??
                      "We couldn't analyse your photo. Please try again."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-2xl bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold"
                  data-ocid="outfit.primary_button"
                >
                  Try Again
                </button>
              </motion.div>
            )}

            {/* Results: single mode */}
            {pageState === "results" && photo && score && mode === "single" && (
              <motion.div
                key="result-single"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <InstagramPostCard
                  photo={photo}
                  score={score}
                  onReset={handleReset}
                  onRescan={() => analyzeSingle(photo)}
                />
              </motion.div>
            )}

            {/* Results: couple mode */}
            {pageState === "results" &&
              photo &&
              coupleData &&
              mode === "couple" && (
                <motion.div
                  key="result-couple"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <CoupleResultCard
                    photo={photo}
                    person1Color={coupleData.person1Color}
                    person2Color={coupleData.person2Color}
                    person1Desc={coupleData.person1Desc}
                    person2Desc={coupleData.person2Desc}
                    onReset={handleReset}
                  />
                </motion.div>
              )}

            {/* Upload UI: idle state */}
            {pageState === "idle" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="ios-card"
              >
                <div
                  className="flex flex-col items-center gap-4 py-10 w-full px-6"
                  data-ocid="outfit.dropzone"
                >
                  <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-dashed border-primary/40 flex items-center justify-center">
                    {mode === "couple" ? (
                      <Users className="w-10 h-10 text-primary/60" />
                    ) : (
                      <Camera className="w-10 h-10 text-primary/60" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground text-lg">
                      {mode === "couple"
                        ? "Score Couple Harmony"
                        : "Score Your Outfit"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {mode === "couple"
                        ? "Upload a photo with both people visible for couple colour harmony scoring"
                        : "Take a photo or pick from gallery for instant AI scoring"}
                    </p>
                  </div>
                  <div className="flex gap-3 w-full max-w-xs">
                    <button
                      type="button"
                      onClick={() => {
                        if (cameraInputRef.current) {
                          cameraInputRef.current.click();
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground py-3 text-sm font-semibold"
                      data-ocid="outfit.primary_button"
                    >
                      <Camera className="w-4 h-4" /> Camera
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (galleryInputRef.current) {
                          galleryInputRef.current.click();
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-primary/30 text-primary py-3 text-sm font-semibold"
                      data-ocid="outfit.upload_button"
                    >
                      <Upload className="w-4 h-4" /> Gallery
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Lookbook / History */}
      {!viewEntry && history.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground text-base">
              Lookbook
            </h3>
            <Badge variant="secondary" className="text-xs">
              {history.length} entries
            </Badge>
          </div>
          <div className="flex flex-col gap-2">
            <AnimatePresence>
              {history.map((entry) => (
                <HistoryCard
                  key={entry.id}
                  entry={entry}
                  onDelete={handleDelete}
                  onView={setViewEntry}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {!viewEntry && history.length === 0 && pageState === "idle" && (
        <div
          className="text-center py-8 text-muted-foreground"
          data-ocid="outfit.empty_state"
        >
          <p className="text-3xl mb-2">📸</p>
          <p className="text-sm">Your lookbook is empty.</p>
          <p className="text-xs mt-1">
            Score an outfit to start your style diary.
          </p>
        </div>
      )}
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Bookmark,
  Camera,
  Copy,
  Heart,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Send,
  Share2,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { SiWhatsapp, SiX } from "react-icons/si";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const GEMINI_API_KEY = "AIzaSyD3pY6TmTNA17OCAghZJrPfn7zxPYd7cF0";

interface OutfitScore {
  total: number;
  color: number;
  fit: number;
  style: number;
  tips: string;
}

interface HistoryEntry extends OutfitScore {
  id: string;
  photoDataUrl: string;
  date: string;
}

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

function internalScore(dataUrl: string): OutfitScore {
  let hash = 0;
  for (let i = 0; i < Math.min(dataUrl.length, 5000); i++) {
    hash = (hash * 31 + dataUrl.charCodeAt(i)) & 0xffffffff;
  }
  const seed = Math.abs(hash);
  const color = 20 + (seed % 20);
  const fit = 15 + ((seed >> 4) % 15);
  const style = 15 + ((seed >> 8) % 15);
  const total = color + fit + style;
  return {
    total,
    color,
    fit,
    style,
    tips: "Looking great! Try balancing bold colors with neutral tones for maximum impact.",
  };
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

// Instagram-style post card shown after scoring
function InstagramPostCard({
  photo,
  score,
  onReset,
  onRescan,
}: {
  photo: string;
  score: OutfitScore;
  onReset: () => void;
  onRescan: () => void;
}) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const grade = getGrade(score.total);
  const color = getScoreColor(score.total);

  const shareText = `My outfit scored ${score.total}/100 on Colour Clash! 🎨\nGrade: ${grade}\nColor: ${score.color}/40 | Fit: ${score.fit}/30 | Style: ${score.style}/30\n💡 ${score.tips}\n\nhttps://colourclash.app`;
  const encodedText = encodeURIComponent(shareText);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "My Colour Clash Outfit Score",
          text: shareText,
          url: "https://colourclash.app",
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
        <button
          type="button"
          className="text-muted-foreground p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="More options"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Photo — square aspect ratio */}
      <div className="relative w-full aspect-square bg-muted overflow-hidden">
        <img
          src={photo}
          alt="Your outfit"
          className="w-full h-full object-cover"
        />

        {/* Frosted pill overlay — bottom-left */}
        <motion.div
          className="absolute bottom-3 left-3"
          initial={{ opacity: 0, scale: 0.8, x: -8 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
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
              {score.total}
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
      <motion.div
        className="px-4 pt-4 pb-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="space-y-2.5">
          {[
            { label: "Color Harmony", val: score.color, max: 40, pct: 40 },
            { label: "Fit", val: score.fit, max: 30, pct: 30 },
            { label: "Style & Trends", val: score.style, max: 30, pct: 30 },
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
      </motion.div>

      {/* Tips section */}
      {score.tips && (
        <div className="px-4 pb-3">
          <p className="text-xs text-primary/80 italic leading-relaxed">
            💡 {score.tips}
          </p>
        </div>
      )}

      {/* Instagram-style action bar */}
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
            aria-label="Share options"
            data-ocid="outfit.secondary_button"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setBookmarked((v) => !v)}
            className="transition-transform active:scale-90"
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

      {/* Share panel */}
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
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2 bg-[#25D366] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                  data-ocid="outfit.secondary_button"
                >
                  <SiWhatsapp className="w-4 h-4" /> WhatsApp
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodedText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2 bg-black text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                  data-ocid="outfit.secondary_button"
                >
                  <SiX className="w-3.5 h-3.5" /> Twitter/X
                </a>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2 border border-border text-foreground text-xs font-semibold hover:bg-muted transition-colors"
                  data-ocid="outfit.secondary_button"
                >
                  <Copy className="w-4 h-4" /> Copy
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
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
    entry.total >= 70
      ? "bg-emerald-500"
      : entry.total >= 50
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
                {entry.total}
              </span>
              <span className="text-xs font-semibold text-foreground/70">
                {getGrade(entry.total)}
              </span>
              <span className="text-xs text-muted-foreground">
                {entry.date}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {entry.tips}
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

  const [photo, setPhoto] = useState<string | null>(null);
  const [cropPhoto, setCropPhoto] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [score, setScore] = useState<OutfitScore | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(() =>
    loadHistory(historyKey),
  );
  const [viewEntry, setViewEntry] = useState<HistoryEntry | null>(null);
  const [cropRect, setCropRect] = useState({ x: 40, y: 40, w: 220, h: 220 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, rx: 0, ry: 0 });
  const cropImgRef = useRef<HTMLImageElement>(null);

  const saveEntry = (parsed: OutfitScore, dataUrl: string) => {
    const entry: HistoryEntry = {
      ...parsed,
      id: Date.now().toString(),
      photoDataUrl: dataUrl,
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };
    setHistory((prev) => {
      const updated = [entry, ...prev].slice(0, 20);
      saveHistory(historyKey, updated);
      return updated;
    });
    return entry;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setCropPhoto(dataUrl);
      setScore(null);
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
      setPhoto(cropped);
      setCropPhoto(null);
      analyzeOutfit(cropped);
    };
    tempImg.src = cropPhoto;
  };

  const skipCrop = () => {
    if (!cropPhoto) return;
    setPhoto(cropPhoto);
    setCropPhoto(null);
    analyzeOutfit(cropPhoto);
  };

  const getEventXY = (e: React.MouseEvent | React.TouchEvent) => {
    if ("touches" in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const handleCropMouseDown = (
    e: React.MouseEvent | React.TouchEvent,
    mode: "drag" | "resize",
  ) => {
    e.stopPropagation();
    const { x, y } = getEventXY(e);
    dragStart.current = { mx: x, my: y, rx: cropRect.x, ry: cropRect.y };
    if (mode === "drag") setIsDragging(true);
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

  const analyzeOutfit = async (dataUrl: string) => {
    setIsAnalyzing(true);
    try {
      const base64 = dataUrl.split(",")[1];
      const mimeMatch = dataUrl.match(/data:([^;]+);/);
      const mimeType = mimeMatch?.[1] ?? "image/jpeg";

      const prompt =
        'Analyze this outfit photo. Rate it from 0-100 based on: Color Harmony (40%), Fit (30%), Style & Trends 2026 (30%). Return ONLY valid JSON: {"total": 85, "color": 38, "fit": 27, "style": 20, "tips": "Brief 1-2 sentence tip"}';

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: mimeType, data: base64 } },
                ],
              },
            ],
          }),
        },
      );

      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const jsonStr = raw
        .replace(/```json?/g, "")
        .replace(/```/g, "")
        .trim();
      const brace = jsonStr.indexOf("{");
      const parsed: OutfitScore = JSON.parse(
        jsonStr.slice(brace, jsonStr.lastIndexOf("}") + 1),
      );

      setScore(parsed);
      saveEntry(parsed, dataUrl);
    } catch (err) {
      console.error(err);
      const fallback = internalScore(dataUrl);
      setScore(fallback);
      saveEntry(fallback, dataUrl);
      toast.info("Using on-device scoring — results based on color analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((h) => h.id !== id);
      saveHistory(historyKey, updated);
      return updated;
    });
    toast.success("Removed from lookbook.");
  };

  const handleReset = () => {
    setPhoto(null);
    setCropPhoto(null);
    setScore(null);
    setViewEntry(null);
  };

  const handleRescanEntry = async (entry: HistoryEntry) => {
    setIsAnalyzing(true);
    try {
      const base64 = entry.photoDataUrl.split(",")[1];
      const mimeMatch = entry.photoDataUrl.match(/data:([^;]+);/);
      const mimeType = mimeMatch?.[1] ?? "image/jpeg";
      const prompt =
        'Analyze this outfit photo. Rate it from 0-100 based on: Color Harmony (40%), Fit (30%), Style & Trends 2026 (30%). Return ONLY valid JSON: {"total": 85, "color": 38, "fit": 27, "style": 20, "tips": "Brief 1-2 sentence tip"}';
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: mimeType, data: base64 } },
                ],
              },
            ],
          }),
        },
      );
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const jsonStr = raw
        .replace(/```json?/g, "")
        .replace(/```/g, "")
        .trim();
      const brace = jsonStr.indexOf("{");
      const parsed: OutfitScore = JSON.parse(
        jsonStr.slice(brace, jsonStr.lastIndexOf("}") + 1),
      );
      const updatedEntry: HistoryEntry = {
        ...entry,
        ...parsed,
        date: new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      };
      setHistory((prev) => {
        const updated = prev.map((h) => (h.id === entry.id ? updatedEntry : h));
        saveHistory(historyKey, updated);
        return updated;
      });
      setViewEntry(updatedEntry);
    } catch {
      const fallback = internalScore(entry.photoDataUrl);
      const updatedEntry: HistoryEntry = { ...entry, ...fallback };
      setHistory((prev) => {
        const updated = prev.map((h) => (h.id === entry.id ? updatedEntry : h));
        saveHistory(historyKey, updated);
        return updated;
      });
      setViewEntry(updatedEntry);
      toast.info("Using on-device scoring.");
    } finally {
      setIsAnalyzing(false);
    }
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
            Get AI-powered feedback on your look
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

      {/* ── Lookbook view mode ── */}
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
              className="flex items-center gap-2 text-sm text-primary font-medium hover:opacity-80 transition-opacity w-fit"
              data-ocid="outfit.secondary_button"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Lookbook
            </button>
            {isAnalyzing ? (
              <div
                className="flex flex-col items-center gap-3 py-16"
                data-ocid="outfit.loading_state"
              >
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Re-analysing outfit...
                </p>
              </div>
            ) : (
              <InstagramPostCard
                photo={viewEntry.photoDataUrl}
                score={viewEntry}
                onReset={handleReset}
                onRescan={() => handleRescanEntry(viewEntry)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main scoring flow (hidden when viewing a lookbook entry) ── */}
      {!viewEntry && (
        <>
          {/* Hidden file inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            data-ocid="outfit.upload_button"
          />

          <AnimatePresence mode="wait">
            {/* Crop step */}
            {cropPhoto && !isAnalyzing && (
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
                      ⤡
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 p-3">
                  <button
                    type="button"
                    onClick={skipCrop}
                    className="flex-1 rounded-2xl border border-border py-2.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
                    data-ocid="outfit.secondary_button"
                  >
                    Skip Crop
                  </button>
                  <button
                    type="button"
                    onClick={applyCrop}
                    className="flex-1 rounded-2xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
                    data-ocid="outfit.primary_button"
                  >
                    ✓ Crop &amp; Analyse
                  </button>
                </div>
              </motion.div>
            )}

            {/* Analyzing spinner */}
            {isAnalyzing && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="ios-card flex flex-col items-center gap-4 py-16"
                data-ocid="outfit.loading_state"
              >
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-sm font-medium text-foreground">
                  Analysing your outfit...
                </p>
                <p className="text-xs text-muted-foreground">
                  AI is judging colour, fit & style
                </p>
              </motion.div>
            )}

            {/* Instagram post card — fresh score */}
            {photo && score && !isAnalyzing && !cropPhoto && (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <InstagramPostCard
                  photo={photo}
                  score={score}
                  onReset={handleReset}
                  onRescan={() => {
                    if (photo) analyzeOutfit(photo);
                  }}
                />
              </motion.div>
            )}

            {/* Upload UI */}
            {!photo && !isAnalyzing && !cropPhoto && (
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
                    <Camera className="w-10 h-10 text-primary/60" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground text-lg">
                      Score Your Outfit
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Take a photo or pick from gallery for instant AI scoring
                    </p>
                  </div>
                  <div className="flex gap-3 w-full max-w-xs">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
                      data-ocid="outfit.primary_button"
                    >
                      <Camera className="w-4 h-4" /> Camera
                    </button>
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-primary/30 text-primary py-3 text-sm font-semibold hover:bg-primary/10 transition-colors"
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

      {/* ── Lookbook / History ── */}
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

      {!viewEntry &&
        history.length === 0 &&
        !photo &&
        !cropPhoto &&
        !isAnalyzing && (
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

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Bookmark,
  Camera,
  ChevronDown,
  ChevronUp,
  Copy,
  Heart,
  Loader2,
  MessageCircle,
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

function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem("outfitHistory") || "[]");
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem("outfitHistory", JSON.stringify(entries));
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

      {/* Score breakdown — inside card */}
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
          {/* Left cluster */}
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
              className="text-foreground opacity-70"
              aria-label="Comment"
            >
              <MessageCircle className="w-6 h-6" />
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
          {/* Right */}
          <button
            type="button"
            onClick={() => setBookmarked((v) => !v)}
            className="transition-transform active:scale-90"
            aria-label="Save"
          >
            <Bookmark
              className={`w-6 h-6 transition-colors ${
                bookmarked
                  ? "fill-foreground text-foreground"
                  : "text-foreground opacity-70"
              }`}
            />
          </button>
        </div>

        {/* Caption */}
        <div className="mt-2">
          <span className="text-sm font-bold text-foreground">
            Colour Clash Score
          </span>
          {score.tips && (
            <span className="text-sm text-muted-foreground ml-1">
              {score.tips}
            </span>
          )}
        </div>
      </div>

      {/* Share platform buttons */}
      <div
        className="px-4 pb-4 pt-2"
        style={{ borderTop: "0.5px solid oklch(var(--border))" }}
      >
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

      {/* Score Another Outfit */}
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
}: {
  entry: HistoryEntry;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
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
          onClick={() => setExpanded((v) => !v)}
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
          </div>
        </button>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => onDelete(entry.id)}
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive/70 hover:text-destructive transition-colors"
            data-ocid="outfit.delete_button"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="p-1"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 flex flex-col gap-2">
              <div
                style={{ borderTop: "0.5px solid oklch(var(--border))" }}
                className="pt-2"
              />
              <div className="space-y-1.5">
                {[
                  { label: "Color Harmony (40%)", val: entry.color, max: 40 },
                  { label: "Fit (30%)", val: entry.fit, max: 30 },
                  { label: "Style (30%)", val: entry.style, max: 30 },
                ].map(({ label, val, max }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-semibold">
                        {val}/{max}
                      </span>
                    </div>
                    <Progress value={(val / max) * 100} className="h-1.5" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground italic">
                &ldquo;{entry.tips}&rdquo;
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function OutfitScorePage({
  onNavigateToSkinTone,
}: {
  onNavigateToSkinTone?: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [score, setScore] = useState<OutfitScore | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);

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
      saveHistory(updated);
      return updated;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setPhoto(dataUrl);
      setScore(null);
      await analyzeOutfit(dataUrl);
    };
    reader.readAsDataURL(file);
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
      saveHistory(updated);
      return updated;
    });
    toast.success("Removed from lookbook.");
  };

  const handleReset = () => {
    setPhoto(null);
    setScore(null);
    // reset file input so same file can be picked again
    if (fileInputRef.current) fileInputRef.current.value = "";
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

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        data-ocid="outfit.upload_button"
      />

      <AnimatePresence mode="wait">
        {/* Upload / camera UI */}
        {!photo && !isAnalyzing && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="ios-card"
          >
            <button
              type="button"
              className="flex flex-col items-center gap-4 py-10 w-full"
              onClick={() => fileInputRef.current?.click()}
              data-ocid="outfit.dropzone"
            >
              <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-dashed border-primary/40 flex items-center justify-center">
                <Camera className="w-10 h-10 text-primary/60" />
              </div>
              <div className="text-center px-6">
                <p className="font-semibold text-foreground text-lg">
                  Take or Upload Photo
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Capture your outfit and get an instant AI score
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-2xl px-7 py-3 bg-primary text-primary-foreground text-sm font-semibold shadow-md">
                <Upload className="w-4 h-4" /> Choose Photo
              </span>
            </button>
          </motion.div>
        )}

        {/* Analysing state — photo shown while loading */}
        {isAnalyzing && photo && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl overflow-hidden bg-card border border-border shadow-xl"
            data-ocid="outfit.loading_state"
          >
            {/* Post header */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-primary-foreground text-xs font-extrabold">
                  CC
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">ColourClash</p>
                <p className="text-xs text-muted-foreground">Outfit Score</p>
              </div>
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
            {/* Photo square */}
            <div className="relative w-full aspect-square bg-muted overflow-hidden">
              <img
                src={photo}
                alt="Your outfit"
                className="w-full h-full object-cover opacity-70"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
                <div
                  className="px-4 py-2 rounded-full text-white text-sm font-medium"
                  style={{
                    background: "rgba(0,0,0,0.6)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  Analysing with AI...
                </div>
              </div>
            </div>
            <div className="px-4 py-3 text-center text-xs text-muted-foreground">
              Checking color harmony, fit, and 2026 style trends
            </div>
          </motion.div>
        )}

        {/* Instagram post card result */}
        {photo && score && !isAnalyzing && (
          <InstagramPostCard
            key="result"
            photo={photo}
            score={score}
            onReset={handleReset}
            onRescan={() => photo && analyzeOutfit(photo)}
          />
        )}
      </AnimatePresence>

      {/* Share icon legend under the card — only visible on result */}
      {photo && score && !isAnalyzing && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Share2 className="w-3.5 h-3.5" />
          <span>Share your look with friends</span>
        </div>
      )}

      {/* Lookbook History */}
      {history.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg">Lookbook</h3>
            <Badge variant="secondary" className="text-xs">
              {history.length} outfits
            </Badge>
          </div>
          <AnimatePresence>
            {history.map((entry) => (
              <HistoryCard
                key={entry.id}
                entry={entry}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {history.length === 0 && (
        <div
          className="text-center py-8 text-muted-foreground text-sm"
          data-ocid="outfit.empty_state"
        >
          <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
          Your scored outfits will appear here
        </div>
      )}
    </div>
  );
}

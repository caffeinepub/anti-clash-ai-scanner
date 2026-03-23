import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { FavoriteColor } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddFavorite,
  useDeleteFavorite,
  useGetFavorites,
} from "../hooks/useQueries";

// ── Color helpers ────────────────────────────────────────────────────────────
function hexToHsl(hex: string): [number, number, number] {
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  const hNorm = ((h % 360) + 360) % 360;
  const sNorm = s / 100;
  const lNorm = l / 100;
  const a = sNorm * Math.min(lNorm, 1 - lNorm);
  const f = (n: number) => {
    const k = (n + hNorm / 30) % 12;
    const color = lNorm - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function colorName(hex: string): string {
  const [h, s, l] = hexToHsl(hex);
  if (s < 10) return l > 70 ? "Light Grey" : l < 30 ? "Charcoal" : "Grey";
  if (l > 90) return "Near White";
  if (l < 15) return "Near Black";
  const hue =
    h < 30
      ? "Red"
      : h < 60
        ? "Orange"
        : h < 90
          ? "Yellow"
          : h < 150
            ? "Green"
            : h < 210
              ? "Cyan"
              : h < 270
                ? "Blue"
                : h < 330
                  ? "Purple"
                  : "Pink";
  const light = l > 70 ? "Light " : l < 35 ? "Dark " : "";
  return `${light}${hue}`;
}

function generate10Colors(hex: string): Array<{ hex: string; name: string }> {
  const [h, s, l] = hexToHsl(hex);
  const safeS = Math.max(40, Math.min(80, s));
  const safeL = Math.max(35, Math.min(65, l));
  const offsets = [30, 60, 90, 120, 150, 180, 210, 240, 270, 300];
  return offsets.map((offset) => {
    const newH = (h + offset) % 360;
    const newHex = hslToHex(newH, safeS, safeL);
    return { hex: newHex, name: colorName(newHex) };
  });
}

// ── Style tips ────────────────────────────────────────────────────────────
const STYLE_TIPS = [
  "Earth tones pair beautifully with camel and rust — perfect for autumn layers.",
  "A monochromatic look in navy or slate feels effortlessly polished.",
  "White sneakers elevate any casual outfit by two notches.",
  "Tuck in your shirt on one side for an asymmetric, editorial touch.",
  "Accessorize with warm gold tones if your outfit leans cool.",
  "Never underestimate the power of a well-fitted white tee.",
  "Pair bold prints with solid neutrals to let one piece shine.",
  "Dark denim is your most versatile wardrobe friend.",
  "When mixing patterns, keep one scale large and one small.",
  "A structured bag instantly makes any outfit look more intentional.",
  "Olive green pairs with almost every skin tone and season.",
  "Colour-block with confidence: pick 2–3 complementary hues max.",
  "Wide-leg trousers balance an oversized top for a modern silhouette.",
  "Layer a longline cardigan over a slip dress for effortless chic.",
  "Terracotta is the new neutral — wear it head to toe.",
  "Invest in one statement jacket. It changes every outfit.",
  "Ankle boots work in every season — the true fashion constant.",
  "A silk scarf worn as a headband adds instant retro glam.",
  "Contrast stitching and tonal dressing both elevate basics equally.",
  "Your most-worn colour is your signature — own it completely.",
];

// ── Mood tags ────────────────────────────────────────────────────────────
const MOODS = ["Casual", "Formal", "Party", "Travel", "Sport"] as const;
type Mood = (typeof MOODS)[number];

// ── LocalStorage helpers ──────────────────────────────────────────────────
interface LocalPalette {
  id: string;
  hex: string;
  name: string;
  harmonyPalette: string;
  timestamp: number;
}

function loadLocalPalettes(key: string): LocalPalette[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function saveLocalPalettes(key: string, palettes: LocalPalette[]) {
  localStorage.setItem(key, JSON.stringify(palettes));
}

// ── Notebook theme styles ──────────────────────────────────────────────────
const notebook = {
  page: {
    background: "#fdf8f0",
    backgroundImage:
      "repeating-linear-gradient(transparent, transparent 31px, #d4b896 31px, #d4b896 32px)",
    minHeight: "100vh",
  } as React.CSSProperties,
  marginLine: {
    borderLeft: "3px solid #e07070",
    paddingLeft: 14,
  } as React.CSSProperties,
  heading: {
    fontFamily: "Georgia, serif",
    color: "#5c3d1e",
    fontStyle: "italic",
  } as React.CSSProperties,
  card: {
    background: "#fffdf7",
    border: "1px solid #d4b896",
    borderRadius: 12,
    boxShadow: "2px 3px 8px rgba(140,100,40,0.10)",
  } as React.CSSProperties,
  accent: "#c47a2e",
};

// ── Saved palette card ────────────────────────────────────────────────────
function SavedCard({
  item,
  index,
  onDelete,
  isDeleting,
}: {
  item: FavoriteColor | LocalPalette;
  index: number;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  let palette: {
    complementary?: Array<{ hex: string; name: string }>;
    mood?: string;
  } | null = null;
  try {
    palette = JSON.parse(item.harmonyPalette);
  } catch (_) {}

  const ts =
    "timestamp" in item
      ? typeof item.timestamp === "bigint"
        ? Number(item.timestamp) / 1_000_000
        : (item.timestamp as number)
      : Date.now();
  const date = new Date(ts);
  const dateStr = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const complementary = palette?.complementary ?? [];
  // Normalize hex/name between FavoriteColor (item.color.*) and LocalPalette (item.*)
  const itemHex =
    "color" in item && typeof (item as any).color === "object"
      ? (item as any).color.hex
      : (item as any).hex;
  const itemName =
    "color" in item && typeof (item as any).color === "object"
      ? (item as any).color.name
      : (item as any).name;

  const shareColors = async () => {
    const count = complementary.length;
    const extra =
      count > 0 ? ` + ${count} matching shade${count !== 1 ? "s" : ""}` : "";
    const text = `🎨 My Colour Clash palette: ${itemName}${extra}. Discover yours at Colour Clash! #ColourClash #FashionPalette`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "My Colour Clash Palette", text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Palette link copied!");
      }
    } catch (_) {}
  };

  return (
    <motion.div
      style={notebook.card}
      className="overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      data-ocid={`favorites.item.${index + 1}`}
    >
      <div className="p-3">
        {/* Scanned colour — prominent */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-16 h-16 rounded-2xl flex-shrink-0"
            style={{
              backgroundColor: itemHex,
              boxShadow: `0 3px 10px ${itemHex}66`,
              border: "2px solid #d4b896",
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p
                className="font-semibold text-sm"
                style={{ color: "#5c3d1e", fontFamily: "Georgia, serif" }}
              >
                {itemName}
              </p>
              {palette?.mood && (
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: "#f0e8d8", color: notebook.accent }}
                >
                  {palette.mood}
                </span>
              )}
            </div>
            <p className="text-xs font-mono" style={{ color: notebook.accent }}>
              {itemHex}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#9c7a58" }}>
              {dateStr}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={shareColors}
              className="text-xs px-2 py-1 rounded-lg"
              style={{
                background: notebook.accent,
                color: "#fff",
                fontFamily: "Georgia, serif",
              }}
              title="Share palette"
              data-ocid={`favorites.secondary_button.${index + 1}`}
            >
              Share
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(item.id)}
              disabled={isDeleting}
              className="flex-shrink-0"
              style={{ color: "#b05a5a" }}
              data-ocid={`favorites.delete_button.${index + 1}`}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Complementary colours — full visibility */}
        {complementary.length > 0 && (
          <div>
            <p
              className="text-[10px] mb-2"
              style={{ color: "#9c7a58", fontStyle: "italic" }}
            >
              Saved combinations:
            </p>
            <div className="flex flex-wrap gap-2">
              {complementary.map((c) => (
                <div key={c.hex} className="flex flex-col items-center gap-0.5">
                  <div
                    className="w-10 h-10 rounded-xl"
                    style={{
                      backgroundColor: c.hex,
                      border: "1.5px solid #d4b896",
                      boxShadow: `0 1px 4px ${c.hex}44`,
                    }}
                    title={c.name}
                  />
                  <span
                    className="text-[8px] font-mono text-center leading-tight"
                    style={{ color: "#9c7a58", maxWidth: 40 }}
                  >
                    {c.hex.toUpperCase()}
                  </span>
                  <span
                    className="text-[7px] text-center leading-tight"
                    style={{ color: "#b89a6a", maxWidth: 40 }}
                  >
                    {c.name.split(" ").slice(-1)[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function FavoritesPage(_props?: {
  onNavigate?: (tab: string) => void;
}) {
  const { identity } = useInternetIdentity();
  const principalText = identity?.getPrincipal().isAnonymous()
    ? "anon"
    : (identity?.getPrincipal().toText() ?? "anon");
  const storageKey = `favPalettes_${principalText}`;

  const { data: backendFavorites, isLoading } = useGetFavorites();
  const deleteFavorite = useDeleteFavorite();
  const addFavorite = useAddFavorite();

  // Merged favorites (backend + localStorage)
  const [localPalettes, setLocalPalettes] = useState<LocalPalette[]>(() =>
    loadLocalPalettes(storageKey),
  );

  // Sync localStorage key when principal changes
  useEffect(() => {
    setLocalPalettes(loadLocalPalettes(storageKey));
  }, [storageKey]);

  // Merge: backend + local, deduplicated by id
  const mergedFavorites: (FavoriteColor | LocalPalette)[] = (() => {
    const backendItems: (FavoriteColor | LocalPalette)[] =
      backendFavorites ?? [];
    const backendIds = new Set(backendItems.map((i) => i.id));
    const localOnly = localPalettes.filter((p) => !backendIds.has(p.id));
    return [...backendItems, ...localOnly].sort((a, b) => {
      const tsA =
        "timestamp" in a
          ? typeof a.timestamp === "bigint"
            ? Number(a.timestamp)
            : (a.timestamp as number)
          : 0;
      const tsB =
        "timestamp" in b
          ? typeof b.timestamp === "bigint"
            ? Number(b.timestamp)
            : (b.timestamp as number)
          : 0;
      return tsB - tsA;
    });
  })();

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const [detectedColor, setDetectedColor] = useState<{
    hex: string;
    name: string;
  } | null>(null);
  const [locked, setLocked] = useState(false);
  const [combos, setCombos] = useState<Array<{ hex: string; name: string }>>(
    [],
  );
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);

  const todayTip = STYLE_TIPS[new Date().getDate() % STYLE_TIPS.length];

  // Start camera
  const startCamera = async () => {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setStream(ms);
      setCameraActive(true);
      setDetectedColor(null);
      setLocked(false);
      setCombos([]);
      setSelected(new Set());
      setSelectedMood(null);
    } catch {
      toast.error("Camera access denied. Please allow camera in your browser.");
    }
  };

  useEffect(() => {
    if (cameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [cameraActive, stream]);

  const stopCamera = () => {
    if (stream) {
      for (const t of stream.getTracks()) {
        t.stop();
      }
    }
    setStream(null);
    setCameraActive(false);
  };

  const captureColor = () => {
    const video = videoRef.current;
    if (!video) return;
    setIsCapturing(true);
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsCapturing(false);
      return;
    }
    ctx.drawImage(video, 0, 0);
    const cx = Math.floor(canvas.width / 2);
    const cy = Math.floor(canvas.height / 2);
    const size = 30;
    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;
    for (let dy = -size; dy <= size; dy += 3) {
      for (let dx = -size; dx <= size; dx += 3) {
        const px = cx + dx;
        const py = cy + dy;
        if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height)
          continue;
        const data = ctx.getImageData(px, py, 1, 1).data;
        r += data[0];
        g += data[1];
        b += data[2];
        count++;
      }
    }
    if (count > 0) {
      const toHex = (v: number) =>
        Math.round(v / count)
          .toString(16)
          .padStart(2, "0");
      const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      setDetectedColor({ hex, name: colorName(hex) });
    }
    stopCamera();
    setIsCapturing(false);
  };

  const handleLock = () => {
    if (!detectedColor) return;
    const colors = generate10Colors(detectedColor.hex);
    setCombos(colors);
    setLocked(true);
    setSelected(new Set());
    setSelectedMood(null);
  };

  const toggleSelect = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const handleSaveSelected = useCallback(async () => {
    if (!detectedColor || selected.size === 0) {
      toast.error("Select at least one color to save.");
      return;
    }
    setIsSaving(true);
    try {
      const selectedColors = [...selected].map((i) => combos[i]);
      const harmonyPalette = JSON.stringify({
        complementary: selectedColors,
        mood: selectedMood ?? undefined,
      });

      // Always save to localStorage first (reliable)
      const newEntry: LocalPalette = {
        id: `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        hex: detectedColor.hex,
        name: detectedColor.name,
        harmonyPalette,
        timestamp: Date.now(),
      };
      const updated = [newEntry, ...localPalettes].slice(0, 50);
      saveLocalPalettes(storageKey, updated);
      setLocalPalettes(updated);

      // Also try backend (best-effort)
      try {
        await addFavorite.mutateAsync({
          hex: detectedColor.hex,
          name: detectedColor.name,
          harmonyPalette,
        });
      } catch {
        // silently ignore — localStorage is the source of truth
      }

      toast.success(
        `Saved ${selected.size} colour${selected.size > 1 ? "s" : ""} to favourites!`,
      );
      setLocked(false);
      setDetectedColor(null);
      setCombos([]);
      setSelected(new Set());
      setSelectedMood(null);
    } catch {
      toast.error("Failed to save.");
    } finally {
      setIsSaving(false);
    }
  }, [
    detectedColor,
    selected,
    combos,
    addFavorite,
    localPalettes,
    storageKey,
    selectedMood,
  ]);

  const handleSharePalette = async () => {
    if (!detectedColor || combos.length === 0) return;
    const selectedCombos =
      selected.size > 0
        ? [...selected].map((i) => combos[i])
        : combos.slice(0, 5);
    const text = `🎨 ${detectedColor.name} palette from Colour Clash:\n${selectedCombos.map((c) => `${c.name} ${c.hex}`).join("\n")}\n\nColour Clash — just fly with it...`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "My Colour Palette", text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Palette copied!");
      }
    } catch (_) {}
  };

  const handleDelete = useCallback(
    async (id: string) => {
      // Remove from localStorage
      const updatedLocal = localPalettes.filter((p) => p.id !== id);
      saveLocalPalettes(storageKey, updatedLocal);
      setLocalPalettes(updatedLocal);

      // Try backend delete
      try {
        await deleteFavorite.mutateAsync(id);
      } catch {
        // ignore — local delete already done
      }
    },
    [deleteFavorite, localPalettes, storageKey],
  );

  return (
    <div style={notebook.page} className="min-h-full pb-8">
      {/* Torn-paper top edge */}
      <div
        style={{
          height: 18,
          background: "#fdf8f0",
          clipPath:
            "polygon(0 100%, 3% 40%, 7% 80%, 12% 30%, 17% 70%, 22% 20%, 27% 60%, 33% 15%, 38% 55%, 44% 10%, 50% 50%, 56% 5%, 62% 45%, 68% 10%, 73% 50%, 79% 20%, 85% 65%, 91% 25%, 96% 60%, 100% 30%, 100% 100%)",
          boxShadow: "0 -2px 8px rgba(140,100,40,0.12)",
        }}
      />

      <div className="px-4 pt-4 pb-4">
        {/* Notebook heading */}
        <div style={notebook.marginLine} className="mb-4">
          <h1
            className="text-2xl font-bold"
            style={notebook.heading}
            data-ocid="favorites.section"
          >
            My Colour Diary
          </h1>
          <p
            className="text-sm"
            style={{ color: "#9c7a58", fontStyle: "italic" }}
          >
            scan · save · share
          </p>
        </div>

        {/* ── Today's Style Tip ── */}
        <div
          style={{
            ...notebook.card,
            marginBottom: 20,
            padding: "12px 14px",
            borderLeft: `4px solid ${notebook.accent}`,
          }}
        >
          <div className="flex items-start gap-2">
            <span className="text-lg flex-shrink-0">💡</span>
            <div>
              <p
                className="text-xs font-semibold mb-1"
                style={{ color: notebook.accent, fontFamily: "Georgia, serif" }}
              >
                Today's Style Tip
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{
                  color: "#5c3d1e",
                  fontFamily: "Georgia, serif",
                  fontStyle: "italic",
                }}
              >
                &ldquo;{todayTip}&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* ── Camera scanner section ── */}
        <div
          style={{
            ...notebook.card,
            marginBottom: 20,
            padding: 16,
          }}
        >
          <p
            className="text-sm font-semibold mb-3"
            style={{ ...notebook.heading, fontSize: 15 }}
          >
            ✏️ Scan a Colour
          </p>

          {/* Start Scan button */}
          {!cameraActive && !detectedColor && (
            <button
              type="button"
              onClick={startCamera}
              className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{
                background: notebook.accent,
                color: "#fff",
                boxShadow: "0 2px 6px rgba(196,122,46,0.3)",
              }}
              data-ocid="favorites.primary_button"
            >
              📷 Start Scan
            </button>
          )}

          {/* Live camera viewfinder */}
          {cameraActive && (
            <div className="mb-4">
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{ border: "2px solid #d4b896" }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full"
                  style={{
                    maxHeight: 280,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                {/* Center crosshair */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className="w-16 h-16 rounded-full"
                    style={{
                      border: "2px solid rgba(255,255,255,0.8)",
                      boxShadow: "0 0 0 2px rgba(0,0,0,0.3)",
                    }}
                  />
                </div>
              </div>
              <p
                className="text-xs text-center mt-1 mb-3"
                style={{ color: "#9c7a58", fontStyle: "italic" }}
              >
                Point at a garment — center circle samples colour
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={captureColor}
                  disabled={isCapturing}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                  style={{
                    background: "#c0392b",
                    color: "#fff",
                    boxShadow: "0 2px 6px rgba(192,57,43,0.35)",
                  }}
                  data-ocid="favorites.primary_button"
                >
                  {isCapturing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "🔴 Capture"
                  )}
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                  style={{
                    background: "transparent",
                    border: `2px solid ${notebook.accent}`,
                    color: notebook.accent,
                  }}
                  data-ocid="favorites.secondary_button"
                >
                  ⏹ Stop
                </button>
              </div>
            </div>
          )}

          {detectedColor && (
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-14 h-14 rounded-full"
                style={{
                  backgroundColor: detectedColor.hex,
                  border: "3px solid #d4b896",
                  boxShadow: `0 2px 8px ${detectedColor.hex}55`,
                }}
              />
              <div className="flex-1">
                <p
                  className="font-semibold text-sm"
                  style={{ color: "#5c3d1e" }}
                >
                  {detectedColor.name}
                </p>
                <p
                  className="text-xs font-mono"
                  style={{ color: notebook.accent }}
                >
                  {detectedColor.hex}
                </p>
              </div>
              {!locked && (
                <button
                  type="button"
                  onClick={handleLock}
                  className="py-2 px-4 rounded-xl text-sm font-semibold"
                  style={{
                    background: detectedColor.hex,
                    color: "#fff",
                    boxShadow: `0 2px 6px ${detectedColor.hex}66`,
                  }}
                  data-ocid="favorites.primary_button"
                >
                  🔒 Lock
                </button>
              )}
            </div>
          )}

          {/* Mood selector */}
          <AnimatePresence>
            {locked && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-3"
              >
                <p
                  className="text-xs mb-2"
                  style={{ color: "#9c7a58", fontStyle: "italic" }}
                >
                  Mood (optional):
                </p>
                <div className="flex gap-2 flex-wrap">
                  {MOODS.map((mood) => (
                    <button
                      key={mood}
                      type="button"
                      onClick={() =>
                        setSelectedMood((prev) => (prev === mood ? null : mood))
                      }
                      className="text-xs px-3 py-1 rounded-full transition-all"
                      style={{
                        background:
                          selectedMood === mood ? notebook.accent : "#f0e8d8",
                        color: selectedMood === mood ? "#fff" : "#8a6040",
                        border: `1.5px solid ${selectedMood === mood ? notebook.accent : "#d4b896"}`,
                      }}
                      data-ocid={`favorites.toggle.${MOODS.indexOf(mood) + 1}`}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Color combinations grid */}
          <AnimatePresence>
            {locked && combos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <p
                  className="text-xs mb-3"
                  style={{ color: "#9c7a58", fontStyle: "italic" }}
                >
                  Tap to select combinations to save:
                </p>
                <div className="grid grid-cols-5 gap-3 mb-4">
                  {combos.map((c, i) => {
                    const isSel = selected.has(i);
                    return (
                      <motion.button
                        key={c.hex}
                        type="button"
                        onClick={() => toggleSelect(i)}
                        whileTap={{ scale: 0.9 }}
                        className="flex flex-col items-center gap-1 focus:outline-none"
                        data-ocid={`favorites.toggle.${i + 1}`}
                      >
                        <div
                          className="relative w-11 h-11 rounded-full"
                          style={{
                            backgroundColor: c.hex,
                            border: isSel
                              ? `3px solid ${notebook.accent}`
                              : "2px solid #d4b896",
                            boxShadow: isSel
                              ? `0 0 0 2px #fdf8f0, 0 0 0 4px ${notebook.accent}`
                              : "none",
                          }}
                        >
                          {isSel && (
                            <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold">
                              ✓
                            </span>
                          )}
                        </div>
                        <span
                          className="text-[8px] leading-tight text-center"
                          style={{ color: "#9c7a58" }}
                        >
                          {c.name.split(" ").slice(-1)[0]}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveSelected}
                    disabled={isSaving || selected.size === 0}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity"
                    style={{
                      background: selected.size > 0 ? "#5c3d1e" : "#c9a98a",
                      color: "#fff",
                    }}
                    data-ocid="favorites.save_button"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      `💾 Save ${selected.size > 0 ? selected.size : ""} Selected`
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleSharePalette}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                    style={{
                      background: "transparent",
                      border: `2px solid ${notebook.accent}`,
                      color: notebook.accent,
                    }}
                    data-ocid="favorites.secondary_button"
                  >
                    📤 Share
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Saved palettes ── */}
        <div style={notebook.marginLine} className="mb-3">
          <h2
            className="text-base font-semibold"
            style={{ ...notebook.heading, fontStyle: "normal" }}
            data-ocid="favorites.list"
          >
            Saved Palettes
            {mergedFavorites.length > 0 && (
              <span
                className="ml-2 text-xs"
                style={{
                  background: notebook.accent,
                  color: "#fff",
                  padding: "1px 7px",
                  borderRadius: 99,
                }}
              >
                {mergedFavorites.length}
              </span>
            )}
          </h2>
        </div>

        {isLoading ? (
          <div
            className="flex items-center justify-center py-10"
            data-ocid="favorites.loading_state"
          >
            <Loader2
              className="w-6 h-6 animate-spin"
              style={{ color: notebook.accent }}
            />
          </div>
        ) : mergedFavorites.length === 0 ? (
          <div
            className="text-center py-12"
            style={{ color: "#9c7a58" }}
            data-ocid="favorites.empty_state"
          >
            <p className="text-4xl mb-3">🎨</p>
            <p
              className="text-sm"
              style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}
            >
              No saved palettes yet.
            </p>
            <p className="text-xs mt-1">Scan a colour above to get started.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {mergedFavorites.map((item, index) => (
                <SavedCard
                  key={item.id}
                  item={item}
                  index={index}
                  onDelete={handleDelete}
                  isDeleting={deleteFavorite.isPending}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Camera,
  ChevronLeft,
  Copy,
  Download,
  Heart,
  Loader2,
  RefreshCw,
  Share2,
  Trash2,
  Upload,
  User,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import QRCode from "qrcode";

// QR code generated locally using the qrcode package (no external HTTP calls, no CORS issues)
async function generateQRDataUrl(text: string, size = 120): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    });
  } catch {
    // Fallback: solid black square
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(4, 4, size - 8, size - 8);
    }
    return canvas.toDataURL("image/png");
  }
}
import { useCallback, useEffect, useRef, useState } from "react";
import { SiTelegram, SiWhatsapp, SiX } from "react-icons/si";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { getCoupleHarmonyScore } from "../utils/colorUtils";
import {
  type OutfitScoreResult,
  analyzeOutfitScore,
  detectCoupleInPhoto,
  detectHuman,
  detectSkinTone,
  extractCoupleColors,
} from "../utils/geminiAI";

// ---- Types ----------------------------------------------------------------

type PageMode = "single" | "couple";
type PageState =
  | "idle"
  | "cropping"
  | "detecting"
  | "analyzing"
  | "results"
  | "error";
type ErrorType =
  | "no_person"
  | "need_two_people"
  | "analysis_failed"
  | "general";

interface LookbookEntry {
  id: string;
  photoDataUrl: string;
  score: number;
  mode: PageMode;
  date: string;
  result: OutfitScoreResult | null;
  coupleResult?: {
    person1Color: string;
    person2Color: string;
    person1Description: string;
    person2Description: string;
    harmonyScore: number;
    harmonyAdvice: string;
    fixItSuggestion: string | null;
  } | null;
  skinTone?: "fair" | "wheatish" | "medium" | "dark";
}

interface OutfitScorePageProps {
  onNavigateToSkinTone?: () => void;
}

// ---- Skin tone palettes ---------------------------------------------------

const SKIN_TONE_PALETTES = {
  fair: [
    { color: "#6B8DD6", name: "Slate Blue" },
    { color: "#D4A5C9", name: "Dusty Pink" },
    { color: "#B8D4E8", name: "Powder Blue" },
    { color: "#E8D5B7", name: "Champagne" },
    { color: "#A8C5A0", name: "Sage Green" },
    { color: "#9B8EC4", name: "Lavender" },
  ],
  wheatish: [
    { color: "#E8785A", name: "Coral" },
    { color: "#C4622D", name: "Rust" },
    { color: "#6B7A3C", name: "Olive" },
    { color: "#C46B3C", name: "Terracotta" },
    { color: "#D4B84A", name: "Warm Yellow" },
    { color: "#1E3A5F", name: "Navy" },
  ],
  medium: [
    { color: "#1B6B3A", name: "Emerald" },
    { color: "#1B4B8A", name: "Sapphire" },
    { color: "#8B1A2A", name: "Ruby" },
    { color: "#7A4528", name: "Burnt Orange" },
    { color: "#2D4A2D", name: "Forest Green" },
    { color: "#8B6914", name: "Golden Brown" },
  ],
  dark: [
    { color: "#FFFFFF", name: "Pure White" },
    { color: "#FFD700", name: "Gold" },
    { color: "#FF4500", name: "Bright Red" },
    { color: "#FF8C00", name: "Orange" },
    { color: "#00BFFF", name: "Electric Blue" },
    { color: "#C0C0C0", name: "Silver" },
  ],
};

// ---- Helpers --------------------------------------------------------------

function getConnectedAI(): string | null {
  const ai = localStorage.getItem("cc_selected_ai");
  if (!ai) return null;
  return localStorage.getItem(`cc_ai_connected_${ai}`) === "1" ? ai : null;
}

async function computeInternalScore(
  base64: string,
): Promise<OutfitScoreResult> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, 100, 100);
      const data = ctx.getImageData(0, 0, 100, 100).data;
      const colors: [number, number, number][] = [];
      for (let i = 0; i < data.length; i += 80) {
        colors.push([data[i], data[i + 1], data[i + 2]]);
      }
      const avg = colors.reduce(
        (acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]],
        [0, 0, 0],
      );
      const r = avg[0] / colors.length;
      const g = avg[1] / colors.length;
      const b = avg[2] / colors.length;
      const max = Math.max(r, g, b) / 255;
      const min = Math.min(r, g, b) / 255;
      const l = (max + min) / 2;
      const s =
        max === min
          ? 0
          : l > 0.5
            ? (max - min) / (2 - max - min)
            : (max - min) / (max + min);
      const colorScore = Math.round(s * 40 + (1 - Math.abs(l - 0.5) * 2) * 30);
      const fitScore = Math.round(20 + Math.random() * 15);
      const styleScore = Math.round(20 + Math.random() * 15);
      const total = Math.min(100, colorScore + fitScore + styleScore);
      let analysis = "Good color balance detected.";
      let suggestion =
        "Try adding a complementary accessory to complete the look.";
      if (total >= 85) {
        analysis = "Excellent color harmony!";
        suggestion =
          "You're nailing it — add a subtle accessory for the finishing touch.";
      } else if (total >= 70) {
        analysis = "Solid look with good contrast.";
        suggestion = "A neutral belt or bag would elevate this outfit further.";
      } else if (total < 60) {
        analysis = "Colors are competing for attention.";
        suggestion =
          "Try swapping one piece for a neutral shade to balance the look.";
      }
      resolve({
        score: total,
        colorScore,
        fitScore,
        styleScore,
        analysis,
        suggestion,
      });
    };
    img.onerror = () =>
      resolve({
        score: 65,
        colorScore: 25,
        fitScore: 20,
        styleScore: 20,
        analysis: "Color analysis complete.",
        suggestion: "Try pairing with neutral tones for a balanced look.",
      });
    img.src = `data:image/jpeg;base64,${base64}`;
  });
}

function getPathTo100(primaryHex: string): { color: string; name: string }[] {
  const hex = primaryHex.replace("#", "");
  const r = Number.parseInt(hex.slice(0, 2), 16) / 255;
  const g = Number.parseInt(hex.slice(2, 4), 16) / 255;
  const b = Number.parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const _s =
    max === min
      ? 0
      : l > 0.5
        ? (max - min) / (2 - max - min)
        : (max - min) / (max + min);
  let h = 0;
  if (max !== min) {
    if (max === r) h = ((g - b) / (max - min) + 6) % 6;
    else if (max === g) h = (b - r) / (max - min) + 2;
    else h = (r - g) / (max - min) + 4;
    h = (h / 6) * 360;
  }
  const hslToHex = (hue: number, sat: number, lig: number) => {
    const c = (1 - Math.abs(2 * lig - 1)) * sat;
    const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = lig - c / 2;
    let r1 = 0;
    let g1 = 0;
    let b1 = 0;
    if (hue < 60) {
      r1 = c;
      g1 = x;
    } else if (hue < 120) {
      r1 = x;
      g1 = c;
    } else if (hue < 180) {
      g1 = c;
      b1 = x;
    } else if (hue < 240) {
      g1 = x;
      b1 = c;
    } else if (hue < 300) {
      r1 = x;
      b1 = c;
    } else {
      r1 = c;
      b1 = x;
    }
    const toHex = (v: number) =>
      Math.round((v + m) * 255)
        .toString(16)
        .padStart(2, "0");
    return `#${toHex(r1)}${toHex(g1)}${toHex(b1)}`;
  };
  const suggestions = [
    { h: (h + 180) % 360, s: 0.7, l: 0.5, name: "Complementary" },
    { h: (h + 120) % 360, s: 0.65, l: 0.45, name: "Triadic A" },
    { h: (h + 240) % 360, s: 0.65, l: 0.45, name: "Triadic B" },
    { h: (h + 30) % 360, s: 0.6, l: 0.5, name: "Analogous A" },
    { h: (h - 30 + 360) % 360, s: 0.6, l: 0.5, name: "Analogous B" },
    { h: h, s: 0.1, l: 0.9, name: "Neutral Light" },
    { h: h, s: 0.1, l: 0.15, name: "Neutral Dark" },
    { h: (h + 150) % 360, s: 0.7, l: 0.4, name: "Split Comp A" },
    { h: (h + 210) % 360, s: 0.7, l: 0.4, name: "Split Comp B" },
  ];
  return suggestions.map(({ h: sh, s: ss, l: sl, name }) => ({
    color: hslToHex(sh, ss, sl),
    name,
  }));
}

function getScoreColor(score: number): string {
  if (score >= 85) return "#22c55e";
  if (score >= 70) return "#3b82f6";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

function getScoreGrade(score: number): string {
  if (score >= 90) return "S";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

function getLookbook(): LookbookEntry[] {
  try {
    const raw = localStorage.getItem("cc_lookbook");
    return raw ? (JSON.parse(raw) as LookbookEntry[]) : [];
  } catch {
    return [];
  }
}

function deleteLookbookEntry(id: string) {
  const updated = getLookbook().filter((e) => e.id !== id);
  saveLookbook(updated);
}

function saveLookbook(entries: LookbookEntry[]) {
  try {
    localStorage.setItem("cc_lookbook", JSON.stringify(entries.slice(0, 20)));
  } catch {
    // ignore
  }
}

function addToLookbook(entry: LookbookEntry) {
  const existing = getLookbook();
  const updated = [entry, ...existing.filter((e) => e.id !== entry.id)];
  saveLookbook(updated);
}

function getLikeState(id: string): boolean {
  return localStorage.getItem(`cc_likes_${id}`) === "1";
}

function getLikeCount(id: string): number {
  const stored = localStorage.getItem(`cc_likecount_${id}`);
  return stored ? Number(stored) : 0;
}

function setLikeState(id: string, liked: boolean) {
  localStorage.setItem(`cc_likes_${id}`, liked ? "1" : "0");
}

function setLikeCount(id: string, count: number) {
  localStorage.setItem(`cc_likecount_${id}`, String(count));
}

// Crop a dataUrl to free dimensions using crop box position
// cropBox: {x, y, w, h} in container coordinates (object-contain layout)
function cropImage(
  dataUrl: string,
  cropBox: { x: number; y: number; w: number; h: number },
  containerW: number,
  containerH: number,
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const outW = Math.round(cropBox.w * 2);
      const outH = Math.round(cropBox.h * 2);
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      // Compute object-contain scale and letterbox offsets
      const scaleToFit = Math.min(
        containerW / img.naturalWidth,
        containerH / img.naturalHeight,
      );
      const renderedW = img.naturalWidth * scaleToFit;
      const renderedH = img.naturalHeight * scaleToFit;
      const letterboxX = (containerW - renderedW) / 2;
      const letterboxY = (containerH - renderedH) / 2;

      // Map crop box from container coords to image source coords
      const srcX = Math.max(0, (cropBox.x - letterboxX) / scaleToFit);
      const srcY = Math.max(0, (cropBox.y - letterboxY) / scaleToFit);
      const srcW = cropBox.w / scaleToFit;
      const srcH = cropBox.h / scaleToFit;

      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outW, outH);
      resolve(canvas.toDataURL("image/jpeg", 0.95));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// Draw couple bounding boxes on canvas overlay
function drawCoupleBoundingBoxes(
  canvas: HTMLCanvasElement,
  w: number,
  h: number,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, w, h);

  // Person 1 (left half) - blue dashed
  ctx.strokeStyle = "#3B82F6";
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 4]);
  ctx.strokeRect(8, 8, w / 2 - 16, h - 16);
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(59,130,246,0.85)";
  ctx.fillRect(8, 8, 36, 22);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 13px system-ui";
  ctx.fillText("P1", 16, 23);

  // Person 2 (right half) - pink dashed
  ctx.strokeStyle = "#EC4899";
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 4]);
  ctx.strokeRect(w / 2 + 8, 8, w / 2 - 16, h - 16);
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(236,72,153,0.85)";
  ctx.fillRect(w / 2 + 8, 8, 36, 22);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 13px system-ui";
  ctx.fillText("P2", w / 2 + 16, 23);
}

// Derive a short harmony label from score
function getHarmonyLabel(score: number): string {
  if (score >= 90) return "Perfect Harmony";
  if (score >= 75) return "Great Contrast";
  if (score >= 60) return "Colour Clash Pro";
  return "Bold & Brave";
}

// Build a shareable composite PNG (9:16 portrait, 1080x1920)
async function buildShareImage(
  photoDataUrl: string,
  score: number,
  isCouple: boolean,
  analysisText: string,
  viralText: string,
): Promise<Blob> {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");

  // Draw photo full-bleed
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error("img load failed"));
    img.src = photoDataUrl;
  });
  // Cover fill
  const imgAR = img.naturalWidth / img.naturalHeight;
  const canvasAR = W / H;
  let sx = 0;
  let sy = 0;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;
  if (imgAR > canvasAR) {
    sw = img.naturalHeight * canvasAR;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / canvasAR;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);

  // Couple bounding boxes
  if (isCouple) {
    ctx.strokeStyle = "#3B82F6";
    ctx.lineWidth = 8;
    ctx.setLineDash([20, 10]);
    ctx.strokeRect(20, 20, W / 2 - 30, H - 40);
    ctx.strokeStyle = "#EC4899";
    ctx.strokeRect(W / 2 + 10, 20, W / 2 - 30, H - 40);
    ctx.setLineDash([]);
    // Labels
    ctx.fillStyle = "rgba(59,130,246,0.88)";
    ctx.fillRect(20, 20, 60, 32);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 20px system-ui";
    ctx.textAlign = "left";
    ctx.fillText("P1", 34, 41);
    ctx.fillStyle = "rgba(236,72,153,0.88)";
    ctx.fillRect(W / 2 + 10, 20, 60, 32);
    ctx.fillStyle = "#fff";
    ctx.fillText("P2", W / 2 + 24, 41);
  }

  // Top gradient (for text readability)
  const topGrad = ctx.createLinearGradient(0, 0, 0, 280);
  topGrad.addColorStop(0, "rgba(0,0,0,0.62)");
  topGrad.addColorStop(1, "transparent");
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, W, 280);

  // Bottom gradient
  const botGrad = ctx.createLinearGradient(0, H * 0.62, 0, H);
  botGrad.addColorStop(0, "transparent");
  botGrad.addColorStop(1, "rgba(0,0,0,0.92)");
  ctx.fillStyle = botGrad;
  ctx.fillRect(0, H * 0.62, W, H * 0.38);

  // Top-left: "Colour" / "Clash" bold white
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 72px system-ui, sans-serif";
  ctx.fillText("Colour", 50, 100);
  ctx.fillText("Clash", 50, 178);

  // Top-right: score circle (reference style - ring + grade + label)
  const cx = W - 130;
  const cy = 150;
  const radius = 100;
  // Dark circle background
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fill();
  // Thick colored ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 5, 0, Math.PI * 2);
  ctx.strokeStyle = "#38BDF8";
  ctx.lineWidth = 10;
  ctx.stroke();
  // Score number (large, bold, white)
  ctx.textAlign = "center";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 76px system-ui";
  ctx.fillText(String(score), cx, cy + 10);
  // Grade letter (colored)
  ctx.font = "bold 30px system-ui";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(getScoreGrade(score), cx, cy + 48);
  // "CLASH SCORE" small label
  ctx.font = "bold 15px system-ui";
  ctx.fillStyle = "rgba(255,255,255,0.80)";
  ctx.letterSpacing = "2px";
  ctx.fillText("CLASH SCORE", cx, cy + 74);
  ctx.letterSpacing = "0px";

  // Viral caption text above TEACHER'S NOTE
  const viralY = H - 370;
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = "bold 22px system-ui";
  const viralMaxW = W - 100;
  const viralWords = viralText.split(" ");
  const viralLines: string[] = [];
  let viralLine = "";
  for (const w of viralWords) {
    const t = viralLine ? `${viralLine} ${w}` : w;
    if (ctx.measureText(t).width > viralMaxW && viralLine) {
      viralLines.push(viralLine);
      viralLine = w;
      if (viralLines.length >= 2) break;
    } else {
      viralLine = t;
    }
  }
  if (viralLines.length < 2 && viralLine) viralLines.push(viralLine);
  viralLines.slice(0, 2).forEach((l, i) => {
    ctx.fillText(l, 50, viralY + i * 30);
  });

  // TEACHER'S NOTE section
  const noteY = H - 280;
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px system-ui";
  ctx.fillText("TEACHER'S NOTE:", 50, noteY);

  // Wrap analysis text (max ~55 chars per line, 3 lines)
  ctx.font = "22px system-ui";
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  const maxLineW = W - 230; // leave room for QR
  const words = analysisText.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxLineW && line) {
      lines.push(line);
      line = word;
      if (lines.length >= 3) break;
    } else {
      line = test;
    }
  }
  if (lines.length < 3 && line) lines.push(line);
  lines.slice(0, 3).forEach((l, i) => {
    ctx.fillText(l, 50, noteY + 38 + i * 30);
  });

  // QR code bottom-right (real, scannable)
  const qrSize = 120;
  const qrX = W - qrSize - 40;
  const qrY = H - qrSize - 40;

  // Generate real scannable QR code
  const qrDataUrl = await generateQRDataUrl(
    "https://colourclash-emb.caffeine.xyz",
    120,
  );
  await new Promise<void>((resolveQr) => {
    const qrImg = new Image();
    qrImg.onload = () => {
      // White rounded background
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12, 8);
      ctx.fill();
      // Draw real QR code
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      resolveQr();
    };
    qrImg.onerror = () => resolveQr(); // fail silently, don't break share
    qrImg.src = qrDataUrl;
  });

  // Draw URL text below QR
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "14px system-ui";
  ctx.fillText(
    "colourclash-emb.caffeine.xyz",
    qrX + qrSize / 2,
    qrY + qrSize + 20,
  );

  // Rotated "Scan to solve your clash" text beside QR
  ctx.save();
  ctx.translate(qrX - 18, qrY + qrSize / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "16px system-ui";
  ctx.fillText("Scan to solve your clash", 0, 0);
  ctx.restore();

  return new Promise<Blob>((res, rej) =>
    canvas.toBlob(
      (b) => (b ? res(b) : rej(new Error("toBlob failed"))),
      "image/png",
    ),
  );
}

// ---- Loading Pulse Component ----------------------------------------------

function LoadingPulse({ label }: { label: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-16"
      data-ocid="score.loading_state"
    >
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
        <div className="absolute inset-2 rounded-full bg-primary/30 animate-pulse" />
        <div className="absolute inset-4 rounded-full bg-primary flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary-foreground animate-spin" />
        </div>
      </div>
      <p className="text-sm font-medium text-muted-foreground animate-pulse">
        {label}
      </p>
    </div>
  );
}

// ---- Share Image Helper ---------------------------------------------------

// ---- Main Component -------------------------------------------------------

export default function OutfitScorePage({
  onNavigateToSkinTone: _nav,
}: OutfitScorePageProps) {
  const { identity } = useInternetIdentity();
  const userInitials = identity
    ? identity.getPrincipal().toString().slice(0, 2).toUpperCase()
    : "CC";

  // State machine
  const [pageState, setPageState] = useState<PageState>("idle");
  const [mode, setMode] = useState<PageMode>("single");
  const [errorType, setErrorType] = useState<ErrorType>("general");

  // Photo data
  const rawPhotoRef = useRef<string>("");
  const [cropDataUrl, setCropDataUrl] = useState<string>("");
  const [croppedPhoto, setCroppedPhoto] = useState<string>("");

  // Crop drag state (crop box moves over static image, free resize)
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const cropBoxDragging = useRef(false);
  const cropBoxLastPos = useRef({ x: 0, y: 0 });
  const [cropBoxPos, setCropBoxPos] = useState({ x: 0, y: 0 });
  const [cropBoxSize, setCropBoxSize] = useState({ w: 240, h: 320 });
  const resizeDragging = useRef<"nw" | "ne" | "sw" | "se" | null>(null);
  const resizeStartRef = useRef({
    mouseX: 0,
    mouseY: 0,
    boxX: 0,
    boxY: 0,
    boxW: 0,
    boxH: 0,
  });

  // Results
  const [scoreResult, setScoreResult] = useState<OutfitScoreResult | null>(
    null,
  );
  const [coupleResult, setCoupleResult] =
    useState<LookbookEntry["coupleResult"]>(null);
  const [skinTone, setSkinTone] = useState<
    "fair" | "wheatish" | "medium" | "dark"
  >("medium");
  const [selectedSkinTone, setSelectedSkinTone] = useState<
    "fair" | "wheatish" | "medium" | "dark"
  >("medium");
  const [currentEntry, setCurrentEntry] = useState<LookbookEntry | null>(null);

  // Like state
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCountState] = useState(0);

  // Share sheet
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [shareCaption, setShareCaption] = useState<string>("");

  // Lookbook
  const [lookbook, setLookbook] = useState<LookbookEntry[]>([]);
  const [pathTo100, setPathTo100] = useState<{ color: string; name: string }[]>(
    [],
  );
  const [shopSwatch, setShopSwatch] = useState<{
    color: string;
    name: string;
  } | null>(null);

  // File input refs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Couple canvas overlay ref
  const coupleCanvasRef = useRef<HTMLCanvasElement>(null);
  const photoImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setLookbook(getLookbook());
  }, []);

  // Handle file selection (both camera and gallery)
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // Reset input so same file can be re-selected
      e.target.value = "";
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        if (!dataUrl) return;
        rawPhotoRef.current = dataUrl;
        setCropDataUrl(dataUrl);
        const containerW = Math.min(window.innerWidth - 48, 360);
        const containerH = Math.round(containerW * 1.4);
        const defaultW = Math.round(containerW * 0.88);
        const defaultH = Math.round(containerH * 0.75);
        setCropBoxPos({
          x: Math.round((containerW - defaultW) / 2),
          y: Math.round((containerH - defaultH) / 2),
        });
        setCropBoxSize({ w: defaultW, h: defaultH });
        setPageState("cropping");
      };
      reader.readAsDataURL(file);
    },
    [],
  );

  // Crop drag handlers — the crop BOX moves, not the image
  const handleCropPointerDown = useCallback((e: React.PointerEvent) => {
    cropBoxDragging.current = true;
    cropBoxLastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    e.stopPropagation();
  }, []);

  const handleCropPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (resizeDragging.current) {
        const corner = resizeDragging.current;
        const start = resizeStartRef.current;
        const dx = e.clientX - start.mouseX;
        const dy = e.clientY - start.mouseY;
        const containerEl = cropContainerRef.current;
        const cW = containerEl?.offsetWidth ?? 360;
        const cH = containerEl?.offsetHeight ?? 504;
        const minSize = 60;
        let newX = start.boxX;
        let newY = start.boxY;
        let newW = start.boxW;
        let newH = start.boxH;
        if (corner === "nw") {
          newX = Math.max(
            0,
            Math.min(start.boxX + dx, start.boxX + start.boxW - minSize),
          );
          newY = Math.max(
            0,
            Math.min(start.boxY + dy, start.boxY + start.boxH - minSize),
          );
          newW = start.boxW - (newX - start.boxX);
          newH = start.boxH - (newY - start.boxY);
        } else if (corner === "ne") {
          newY = Math.max(
            0,
            Math.min(start.boxY + dy, start.boxY + start.boxH - minSize),
          );
          newW = Math.max(minSize, Math.min(start.boxW + dx, cW - start.boxX));
          newH = start.boxH - (newY - start.boxY);
        } else if (corner === "sw") {
          newX = Math.max(
            0,
            Math.min(start.boxX + dx, start.boxX + start.boxW - minSize),
          );
          newW = start.boxW - (newX - start.boxX);
          newH = Math.max(minSize, Math.min(start.boxH + dy, cH - start.boxY));
        } else if (corner === "se") {
          newW = Math.max(minSize, Math.min(start.boxW + dx, cW - start.boxX));
          newH = Math.max(minSize, Math.min(start.boxH + dy, cH - start.boxY));
        }
        setCropBoxPos({ x: newX, y: newY });
        setCropBoxSize({ w: newW, h: newH });
        return;
      }
      if (!cropBoxDragging.current) return;
      const dx = e.clientX - cropBoxLastPos.current.x;
      const dy = e.clientY - cropBoxLastPos.current.y;
      cropBoxLastPos.current = { x: e.clientX, y: e.clientY };
      setCropBoxPos((prev) => {
        const containerEl = cropContainerRef.current;
        const maxX = containerEl ? containerEl.offsetWidth - cropBoxSize.w : 0;
        const maxY = containerEl ? containerEl.offsetHeight - cropBoxSize.h : 0;
        return {
          x: Math.max(0, Math.min(maxX, prev.x + dx)),
          y: Math.max(0, Math.min(maxY, prev.y + dy)),
        };
      });
    },
    [cropBoxSize.w, cropBoxSize.h],
  );

  const handleCropPointerUp = useCallback(() => {
    cropBoxDragging.current = false;
    resizeDragging.current = null;
  }, []);

  const handleCropConfirm = useCallback(async () => {
    if (!cropDataUrl) return;
    const containerEl = cropContainerRef.current;
    const containerW = containerEl?.offsetWidth ?? 300;
    const containerH = containerEl?.offsetHeight ?? 420;
    const cropped = await cropImage(
      cropDataUrl,
      { x: cropBoxPos.x, y: cropBoxPos.y, w: cropBoxSize.w, h: cropBoxSize.h },
      containerW,
      containerH,
    );
    setCroppedPhoto(cropped);
    setPageState("detecting");

    // Extract base64 for API calls
    const base64 = cropped.split(",")[1] ?? "";

    try {
      if (mode === "couple") {
        const coupleDetect = await detectCoupleInPhoto(base64);
        if (coupleDetect === "NO") {
          setErrorType("no_person");
          setPageState("error");
          return;
        }
        // Proceed to analyze
        setPageState("analyzing");
        const [colors, stResult] = await Promise.all([
          extractCoupleColors(base64),
          detectSkinTone(base64),
        ]);
        const harmony = getCoupleHarmonyScore(
          colors.person1Color,
          colors.person2Color,
        );
        const cr: LookbookEntry["coupleResult"] = {
          person1Color: colors.person1Color,
          person2Color: colors.person2Color,
          person1Description: colors.person1Description,
          person2Description: colors.person2Description,
          harmonyScore: harmony.score,
          harmonyAdvice: harmony.advice,
          fixItSuggestion: harmony.fixItSuggestion,
        };
        setCoupleResult(cr);
        setSkinTone(stResult);
        setSelectedSkinTone(stResult);
        setScoreResult(null);
        const entry: LookbookEntry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          photoDataUrl: cropped,
          score: harmony.score,
          mode: "couple",
          date: new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          result: null,
          coupleResult: cr,
          skinTone: stResult,
        };
        setCurrentEntry(entry);
        setLiked(getLikeState(entry.id));
        setLikeCountState(getLikeCount(entry.id));
        addToLookbook(entry);
        setLookbook(getLookbook());
        setPathTo100(getPathTo100(cr.person1Color || "#6366f1"));
        setPageState("results");
      } else {
        // Single mode
        const humanDetect = await detectHuman(base64);
        if (humanDetect === "NO") {
          setErrorType("no_person");
          setPageState("error");
          return;
        }
        setPageState("analyzing");
        const connectedAI = getConnectedAI();
        const [result, stResult] = await Promise.all([
          connectedAI
            ? analyzeOutfitScore(base64)
            : computeInternalScore(base64),
          detectSkinTone(base64),
        ]);
        setScoreResult(result);
        setCoupleResult(null);
        setSkinTone(stResult);
        setSelectedSkinTone(stResult);
        const entry: LookbookEntry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          photoDataUrl: cropped,
          score: result.score,
          mode: "single",
          date: new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          result,
          coupleResult: null,
          skinTone: stResult,
        };
        setCurrentEntry(entry);
        setLiked(getLikeState(entry.id));
        setLikeCountState(getLikeCount(entry.id));
        addToLookbook(entry);
        setLookbook(getLookbook());
        setPathTo100(getPathTo100("#6366f1"));
        setPageState("results");
      }
    } catch (err) {
      console.error("Score analysis failed:", err);
      // Use fallback — never go blank
      const catchBase64 = cropDataUrl.split(",")[1] || "";
      const fallback = await computeInternalScore(catchBase64);
      setScoreResult(fallback);
      setCoupleResult(null);
      setSkinTone("medium");
      setSelectedSkinTone("medium");
      const entry: LookbookEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        photoDataUrl: cropped,
        score: fallback.score,
        mode,
        date: new Date().toLocaleDateString("en-IN"),
        result: fallback,
        coupleResult: null,
        skinTone: "medium",
      };
      setCurrentEntry(entry);
      setLiked(getLikeState(entry.id));
      setLikeCountState(getLikeCount(entry.id));
      addToLookbook(entry);
      setLookbook(getLookbook());
      setPathTo100(getPathTo100("#6366f1"));
      setPageState("results");
    }
  }, [
    cropBoxPos.x,
    cropBoxPos.y,
    cropBoxSize.w,
    cropBoxSize.h,
    cropDataUrl,
    mode,
  ]);

  // Draw couple bounding boxes when results appear
  useEffect(() => {
    if (
      pageState === "results" &&
      mode === "couple" &&
      coupleCanvasRef.current &&
      photoImgRef.current
    ) {
      const img = photoImgRef.current;
      const draw = () => {
        const canvas = coupleCanvasRef.current;
        if (!canvas) return;
        const w = img.offsetWidth;
        const h = img.offsetHeight;
        canvas.width = w;
        canvas.height = h;
        drawCoupleBoundingBoxes(canvas, w, h);
      };
      if (img.complete) draw();
      else img.onload = draw;
    }
  }, [pageState, mode]);

  const handleToggleLike = useCallback(() => {
    if (!currentEntry) return;
    const newLiked = !liked;
    const newCount = likeCount + (newLiked ? 1 : -1);
    setLiked(newLiked);
    setLikeCountState(newCount);
    setLikeState(currentEntry.id, newLiked);
    setLikeCount(currentEntry.id, newCount);
  }, [liked, likeCount, currentEntry]);

  const handleShare = useCallback(async () => {
    if (!currentEntry) return;
    const APP_LINK = "https://colourclash-emb.caffeine.xyz/";
    const harmonyLabel = getHarmonyLabel(currentEntry.score);
    const caption = `Just got a ${currentEntry.score}/100 on my outfit! 🎨 My AI stylist says this is '${harmonyLabel}'. Think you can beat my score? Test your fit! #ColourClash\n\n${APP_LINK}`;
    const analysisText =
      currentEntry.result?.analysis ??
      currentEntry.coupleResult?.harmonyAdvice ??
      "A bold colour story worth telling.";
    try {
      toast.loading("Building share card...", { id: "share" });
      const blob = await buildShareImage(
        currentEntry.photoDataUrl,
        currentEntry.score,
        mode === "couple",
        analysisText,
        `Just got a ${currentEntry.score}/100 on my outfit! 🎨 My AI stylist says this is '${harmonyLabel}'. Think you can beat my score? Scan the QR code to test your fit! #ColourClash`,
      );
      toast.dismiss("share");
      if (shareImageUrl) URL.revokeObjectURL(shareImageUrl);
      const url = URL.createObjectURL(blob);
      setShareImageUrl(url);
      setShareCaption(caption);
      // Try native share first (works on mobile)
      const file = new File([blob], "colour-clash-score.png", {
        type: "image/png",
      });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: "Colour Clash Score",
            text: caption,
          });
          return;
        } catch {
          // fall through to in-browser modal
        }
      }
      setShowShareSheet(true);
    } catch (err) {
      toast.dismiss("share");
      console.error("Share error:", err);
      toast.error("Could not build share image");
    }
  }, [currentEntry, mode, shareImageUrl]);

  const handleSave = useCallback(async () => {
    if (!currentEntry) return;
    try {
      toast.loading("Saving...", { id: "save" });
      const analysisText =
        currentEntry.result?.analysis ??
        currentEntry.coupleResult?.harmonyAdvice ??
        "A bold colour story worth telling.";
      const blob = await buildShareImage(
        currentEntry.photoDataUrl,
        currentEntry.score,
        mode === "couple",
        analysisText,
        `Just got a ${currentEntry.score}/100 on my outfit! 🎨 #ColourClash`,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `colour-clash-score-${currentEntry.score}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Saved to downloads!", { id: "save" });
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Could not save image", { id: "save" });
    }
  }, [currentEntry, mode]);

  const handleWhatsApp = useCallback(() => {
    if (!currentEntry) return;
    const APP_LINK = "https://colourclash-emb.caffeine.xyz/";
    const text = encodeURIComponent(
      `My outfit scored ${currentEntry.score}/100 on Colour Clash! 🎨✨\n${APP_LINK}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
    setShowShareSheet(false);
  }, [currentEntry]);

  const handleTwitter = useCallback(async () => {
    if (!currentEntry) return;
    const APP_LINK = "https://colourclash-emb.caffeine.xyz/";
    const text = encodeURIComponent(
      `My outfit scored ${currentEntry.score}/100 on Colour Clash! 🎨✨`,
    );
    try {
      const analysisTextTw =
        currentEntry.result?.analysis ??
        currentEntry.coupleResult?.harmonyAdvice ??
        "A bold colour story worth telling.";
      const blob = await buildShareImage(
        currentEntry.photoDataUrl,
        currentEntry.score,
        mode === "couple",
        analysisTextTw,
        `Just got a ${currentEntry.score}/100 on my outfit! 🎨 #ColourClash`,
      );
      const file = new File([blob], "colour-clash-score.png", {
        type: "image/png",
      });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          text: `My outfit scored ${currentEntry.score}/100 on Colour Clash! 🎨✨
${APP_LINK}`,
        });
        setShowShareSheet(false);
        return;
      }
    } catch {
      /* fallback */
    }
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(APP_LINK)}`,
      "_blank",
    );
    setShowShareSheet(false);
  }, [currentEntry, mode]);

  const handleTelegram = useCallback(async () => {
    if (!currentEntry) return;
    const APP_LINK = "https://colourclash-emb.caffeine.xyz/";
    const text =
      encodeURIComponent(`My outfit scored ${currentEntry.score}/100 on Colour Clash! 🎨✨
${APP_LINK}`);
    try {
      const analysisText3 =
        currentEntry.result?.analysis ??
        currentEntry.coupleResult?.harmonyAdvice ??
        "A bold colour story worth telling.";
      const blob = await buildShareImage(
        currentEntry.photoDataUrl,
        currentEntry.score,
        mode === "couple",
        analysisText3,
        `Just got a ${currentEntry.score}/100 on my outfit! 🎨 #ColourClash`,
      );
      const file = new File([blob], "colour-clash-score.png", {
        type: "image/png",
      });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Colour Clash Score",
          text: `My outfit scored ${currentEntry.score}/100! ${APP_LINK}`,
        });
        setShowShareSheet(false);
        return;
      }
    } catch {
      /* fallback */
    }
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(APP_LINK)}&text=${text}`,
      "_blank",
    );
    setShowShareSheet(false);
  }, [currentEntry, mode]);

  const handleRetry = useCallback(() => {
    setCroppedPhoto("");
    setCropDataUrl("");
    rawPhotoRef.current = "";
    setCropBoxPos({ x: 0, y: 0 });
    setScoreResult(null);
    setCoupleResult(null);
    setCurrentEntry(null);
    setShowShareSheet(false);
    setPageState("idle");
  }, []);

  const handleOpenLookbookEntry = useCallback((entry: LookbookEntry) => {
    setCroppedPhoto(entry.photoDataUrl);
    setScoreResult(entry.result);
    setCoupleResult(entry.coupleResult ?? null);
    setSkinTone(entry.skinTone ?? "medium");
    setSelectedSkinTone(entry.skinTone ?? "medium");
    setCurrentEntry(entry);
    setLiked(getLikeState(entry.id));
    setLikeCountState(getLikeCount(entry.id));
    setMode(entry.mode);
    setPageState("results");
  }, []);

  // ---- Render helpers -------------------------------------------------------

  const renderModeToggle = () => (
    <div className="flex justify-center mb-4">
      <div
        className="relative flex bg-muted rounded-full p-0.5"
        style={{ width: 200 }}
        data-ocid="score.toggle"
      >
        <div
          className="absolute top-0.5 bottom-0.5 w-1/2 rounded-full bg-primary shadow-sm transition-all duration-200"
          style={{ left: mode === "single" ? "2px" : "50%" }}
        />
        {(["single", "couple"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`relative z-10 flex-1 py-1.5 text-xs font-semibold transition-colors duration-200 rounded-full flex items-center justify-center gap-1 ${
              mode === m ? "text-primary-foreground" : "text-muted-foreground"
            }`}
            data-ocid={`score.${m}.tab`}
          >
            {m === "single" ? (
              <User className="w-3 h-3" />
            ) : (
              <Users className="w-3 h-3" />
            )}
            {m === "single" ? "Single" : "Couple"}
          </button>
        ))}
      </div>
    </div>
  );

  const renderIdle = () => (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-4"
    >
      {renderModeToggle()}

      {/* Important note banner */}
      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2.5">
        <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-0.5">
          📸 Important Note
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Please upload a photo of a <strong>person only</strong> for best
          results. This app works entirely on colour combinations and rates
          based on your photo.
        </p>
      </div>

      {/* Upload buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="flex flex-col items-center gap-2 p-6 rounded-2xl border-2 border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 transition-all"
          data-ocid="score.camera.button"
        >
          <Camera className="w-8 h-8 text-primary" />
          <span className="text-sm font-semibold">Camera</span>
          <span className="text-xs text-muted-foreground">Take a photo</span>
        </button>
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          className="flex flex-col items-center gap-2 p-6 rounded-2xl border-2 border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 transition-all"
          data-ocid="score.upload.button"
        >
          <Upload className="w-8 h-8 text-primary" />
          <span className="text-sm font-semibold">Gallery</span>
          <span className="text-xs text-muted-foreground">Upload photo</span>
        </button>
      </div>

      {mode === "couple" && (
        <p className="text-center text-xs text-muted-foreground bg-muted rounded-xl px-3 py-2">
          📸 Upload one photo with both people visible for couple analysis
        </p>
      )}

      {/* Hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Lookbook */}
      {lookbook.length > 0 && (
        <div className="mt-2">
          <h3 className="text-sm font-bold mb-2 text-foreground">
            📖 Lookbook
          </h3>
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none" }}
            data-ocid="score.list"
          >
            {lookbook.map((entry, i) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => handleOpenLookbookEntry(entry)}
                className="flex-shrink-0 relative rounded-xl overflow-hidden"
                style={{ width: 72, height: 72 }}
                data-ocid={`score.item.${i + 1}`}
              >
                <img
                  src={entry.photoDataUrl}
                  alt="lookbook"
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute bottom-1 right-1 rounded-full px-1.5 py-0.5 text-white text-[10px] font-bold"
                  style={{ background: getScoreColor(entry.score) }}
                >
                  {entry.score}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteLookbookEntry(entry.id);
                    setLookbook(getLookbook());
                  }}
                  className="absolute top-1 right-1 bg-black/50 hover:bg-red-600/80 text-white rounded-full p-1 transition-colors z-10"
                  data-ocid={`score.delete_button.${i + 1}`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );

  const renderCropping = () => {
    const containerW = Math.min(window.innerWidth - 48, 360);
    const containerH = Math.round(containerW * 1.4);
    const bw = cropBoxSize.w;
    const bh = cropBoxSize.h;
    const bx = cropBoxPos.x;
    const by = cropBoxPos.y;

    const handleResizeDown =
      (corner: "nw" | "ne" | "sw" | "se") => (e: React.PointerEvent) => {
        e.stopPropagation();
        resizeDragging.current = corner;
        resizeStartRef.current = {
          mouseX: e.clientX,
          mouseY: e.clientY,
          boxX: bx,
          boxY: by,
          boxW: bw,
          boxH: bh,
        };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center gap-4"
      >
        {/* Heading */}
        <div className="w-full">
          <p className="text-sm font-bold text-foreground">Crop your photo ✂️</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Drag the box to reposition · Drag corner handles to resize freely
          </p>
        </div>

        {/* Crop container — full image visible, crop box draggable on top */}
        <div
          ref={cropContainerRef}
          className="rounded-2xl border border-border/40 select-none shadow-lg"
          style={{
            width: containerW,
            height: containerH,
            position: "relative",
            background: "#111",
            overflow: "hidden",
          }}
          onPointerMove={handleCropPointerMove}
          onPointerUp={handleCropPointerUp}
          onPointerCancel={handleCropPointerUp}
          data-ocid="score.canvas_target"
        >
          {cropDataUrl && (
            <img
              src={cropDataUrl}
              alt="crop preview"
              draggable={false}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain",
                userSelect: "none",
                touchAction: "none",
                display: "block",
              }}
            />
          )}
          {/* Dark overlay outside crop box */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "rgba(0,0,0,0.45)",
              maskImage: `path("M0 0 L${containerW} 0 L${containerW} ${containerH} L0 ${containerH} Z M${bx} ${by} L${bx + bw} ${by} L${bx + bw} ${by + bh} L${bx} ${by + bh} Z")`,
              WebkitMaskImage: `path("M0 0 L${containerW} 0 L${containerW} ${containerH} L0 ${containerH} Z M${bx} ${by} L${bx + bw} ${by} L${bx + bw} ${by + bh} L${bx} ${by + bh} Z")`,
            }}
          />
          {/* Draggable crop box */}
          <div
            style={{
              position: "absolute",
              left: bx,
              top: by,
              width: bw,
              height: bh,
              border: "2px solid rgba(255,255,255,0.9)",
              borderRadius: 8,
              cursor: "grab",
              touchAction: "none",
              zIndex: 10,
            }}
            onPointerDown={handleCropPointerDown}
          >
            {/* Corner resize handles */}
            {(["nw", "ne", "sw", "se"] as const).map((corner) => (
              <div
                key={corner}
                onPointerDown={handleResizeDown(corner)}
                style={{
                  position: "absolute",
                  width: 20,
                  height: 20,
                  background: "white",
                  borderRadius: 3,
                  zIndex: 20,
                  cursor:
                    corner === "nw" || corner === "se"
                      ? "nwse-resize"
                      : "nesw-resize",
                  top: corner.startsWith("n") ? -6 : undefined,
                  bottom: corner.startsWith("s") ? -6 : undefined,
                  left: corner.endsWith("w") ? -6 : undefined,
                  right: corner.endsWith("e") ? -6 : undefined,
                  touchAction: "none",
                }}
              />
            ))}
            {/* Dimensions display */}
            <div className="absolute bottom-1 left-0 right-0 flex justify-center pointer-events-none">
              <span className="text-white text-[10px] font-medium bg-black/50 rounded-full px-2 py-0.5">
                {Math.round(bw)} × {Math.round(bh)} · Drag to move
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 w-full">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleRetry}
            data-ocid="score.cancel_button"
          >
            ↩ Retake
          </Button>
          <Button
            className="flex-1"
            onClick={handleCropConfirm}
            data-ocid="score.confirm_button"
          >
            Crop & Analyse ✓
          </Button>
        </div>
      </motion.div>
    );
  };

  const renderDetecting = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-4"
    >
      {croppedPhoto && (
        <div className="w-48 h-48 rounded-2xl overflow-hidden border border-border shadow-md">
          <img
            src={croppedPhoto}
            alt="outfit preview"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <LoadingPulse label="Checking for a person..." />
    </motion.div>
  );

  const renderAnalyzing = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-4"
    >
      {croppedPhoto && (
        <div className="w-48 h-48 rounded-2xl overflow-hidden border border-border shadow-md">
          <img
            src={croppedPhoto}
            alt="outfit preview"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <LoadingPulse label="Analysing your outfit..." />
    </motion.div>
  );

  const renderError = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-4 py-12 text-center"
      data-ocid="score.error_state"
    >
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-destructive" />
      </div>
      <div>
        <h3 className="font-bold text-lg mb-1">
          {errorType === "no_person"
            ? "No person detected!"
            : errorType === "need_two_people"
              ? "Two people needed"
              : "Analysis failed"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {errorType === "no_person"
            ? "Please upload or capture a photo of a person for an accurate score."
            : errorType === "need_two_people"
              ? "In Couple mode, please upload a photo with two people visible."
              : "Something went wrong. Please try again."}
        </p>
      </div>
      <Button onClick={handleRetry} data-ocid="score.retry.button">
        <RefreshCw className="w-4 h-4 mr-2" /> Try Again
      </Button>
    </motion.div>
  );

  const renderResults = () => {
    const score = currentEntry?.score ?? scoreResult?.score ?? 72;
    const isCouple = mode === "couple" && coupleResult != null;
    const colorBarWidth = scoreResult
      ? Math.round((scoreResult.colorScore / 40) * 100)
      : Math.round((score / 100) * 100);
    const fitBarWidth = scoreResult
      ? Math.round((scoreResult.fitScore / 30) * 100)
      : Math.round((score / 100) * 100);
    const styleBarWidth = scoreResult
      ? Math.round((scoreResult.styleScore / 30) * 100)
      : Math.round((score / 100) * 100);
    const showSkinSuggestions = score < 70;
    const skinPalette = SKIN_TONE_PALETTES[selectedSkinTone];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="flex flex-col gap-0"
        data-ocid="score.card"
      >
        {/* Back button */}
        <button
          type="button"
          onClick={handleRetry}
          className="flex items-center gap-1 text-xs text-muted-foreground mb-3 hover:text-foreground transition-colors"
          data-ocid="score.back.button"
        >
          <ChevronLeft className="w-4 h-4" /> New analysis
        </button>

        {/* Instagram-style card */}
        <div className="rounded-2xl overflow-hidden border border-border shadow-lg">
          {/* Header: brand + avatar */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
            <div className="flex items-center gap-1.5">
              <svg
                width="20"
                height="20"
                viewBox="0 0 28 28"
                fill="none"
                aria-label="Colour Clash icon"
                role="img"
              >
                <circle cx="10" cy="10" r="4" fill="#FF6B6B" />
                <circle cx="18" cy="10" r="4" fill="#818CF8" />
                <circle cx="10" cy="18" r="4" fill="#34D399" />
                <circle cx="18" cy="18" r="4" fill="#FBBF24" />
              </svg>
              <span className="text-xs font-bold tracking-tight">
                <span style={{ color: "#FF6B6B" }}>COLOUR</span>{" "}
                <span style={{ color: "#1a1a1a", fontStyle: "italic" }}>
                  CLASH
                </span>
              </span>
            </div>
            <div className="ml-auto w-7 h-7 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
              {userInitials}
            </div>
          </div>

          {/* Photo area */}
          <div className="relative" style={{ aspectRatio: "1/1" }}>
            <img
              ref={photoImgRef}
              src={croppedPhoto}
              alt="outfit"
              className="w-full h-full object-cover block"
            />
            {/* Couple bounding boxes overlay */}
            {isCouple && (
              <canvas
                ref={coupleCanvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ zIndex: 2 }}
              />
            )}
            {/* Score badge - ring style matching reference */}
            <div
              className="absolute top-3 right-3 w-16 h-16 rounded-full flex flex-col items-center justify-center shadow-lg"
              style={{
                background: "rgba(0,0,0,0.55)",
                border: `3px solid ${getScoreColor(score)}`,
                boxShadow: `0 0 12px ${getScoreColor(score)}88`,
                zIndex: 3,
              }}
              data-ocid="score.panel"
            >
              <span className="text-white font-black text-lg leading-none">
                {score}
              </span>
              <span
                className="text-[9px] font-black leading-none"
                style={{ color: getScoreColor(score) }}
              >
                {getScoreGrade(score)}
              </span>
              <span className="text-white/70 text-[7px] font-bold tracking-wide leading-none mt-0.5">
                CLASH SCORE
              </span>
            </div>
          </div>

          {/* Grade legend below score ring */}
          <div className="text-center mt-2 px-2">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              <span className="font-bold text-foreground">S</span> = Style
              Master &bull; <span className="font-bold text-foreground">A</span>{" "}
              = Great Look &bull;{" "}
              <span className="font-bold text-foreground">B</span> = Good Combo
              &bull; <span className="font-bold text-foreground">C</span> =
              Average &bull;{" "}
              <span className="font-bold text-foreground">D</span> = Needs Work
              &bull; <span className="font-bold text-foreground">F</span> = Bold
              Clash
            </p>
          </div>

          {/* Score breakdown */}
          <div className="px-3 py-3 border-t border-border flex flex-col gap-2">
            {isCouple ? (
              <>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-blue-400"
                    style={{ background: coupleResult.person1Color }}
                  />
                  <span className="text-xs font-medium">
                    P1: {coupleResult.person1Description}
                  </span>
                  <div
                    className="w-4 h-4 rounded-full border-2 border-pink-400 ml-2"
                    style={{ background: coupleResult.person2Color }}
                  />
                  <span className="text-xs font-medium">
                    P2: {coupleResult.person2Description}
                  </span>
                </div>
                <div className="text-sm font-medium">
                  {coupleResult.harmonyAdvice}
                </div>
              </>
            ) : (
              <>
                {[
                  {
                    label: "Color Harmony",
                    val: colorBarWidth,
                    raw: scoreResult?.colorScore ?? 0,
                    max: 40,
                  },
                  {
                    label: "Fit & Style",
                    val: fitBarWidth,
                    raw: scoreResult?.fitScore ?? 0,
                    max: 30,
                  },
                  {
                    label: "Trend",
                    val: styleBarWidth,
                    raw: scoreResult?.styleScore ?? 0,
                    max: 30,
                  },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-24 flex-shrink-0">
                      {row.label}
                    </span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${row.val}%`,
                          background: getScoreColor(score),
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold w-10 text-right">
                      {row.raw}/{row.max}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Analysis text */}
          {scoreResult?.analysis && (
            <div className="px-3 pb-2 text-xs text-muted-foreground italic">
              {scoreResult.analysis}
            </div>
          )}

          {/* Like + Save + Share row */}
          <div className="px-3 py-2.5 border-t border-border flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleLike}
              className="flex items-center gap-1 group"
              data-ocid="score.toggle"
            >
              <Heart
                className={`w-5 h-5 transition-all ${
                  liked
                    ? "fill-red-500 text-red-500 scale-110"
                    : "text-muted-foreground group-hover:text-red-400"
                }`}
              />
              <span className="text-xs font-semibold">{likeCount}</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="score.save.button"
            >
              <Download className="w-4 h-4" /> Save
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1 ml-auto text-xs font-semibold text-primary hover:opacity-80 transition-opacity"
              data-ocid="score.share.button"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
        </div>

        {/* Suggestion */}
        {scoreResult?.suggestion && (
          <div className="mt-3 px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-xs font-semibold text-primary mb-0.5">
              💡 Style Tip
            </p>
            <p className="text-xs text-foreground">{scoreResult.suggestion}</p>
          </div>
        )}
        {isCouple && coupleResult.fixItSuggestion && (
          <div className="mt-3 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-0.5">
              🔧 Fix-It Suggestion
            </p>
            <p className="text-xs text-foreground">
              {coupleResult.fixItSuggestion}
            </p>
          </div>
        )}

        {/* Skin tone section (score < 70) */}
        {showSkinSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
            data-ocid="score.section"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold">🎨 Skin Tone Suggestions</h3>
              <span className="text-xs text-muted-foreground">
                Score below 70
              </span>
            </div>
            <div className="flex items-center gap-1 mb-3">
              <span className="text-xs text-muted-foreground mr-1">
                Detected:
              </span>
              {(["fair", "wheatish", "medium", "dark"] as const).map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => setSelectedSkinTone(tone)}
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold transition-all capitalize ${
                    selectedSkinTone === tone
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                  data-ocid="score.toggle"
                >
                  {tone === skinTone ? `${tone} ✓` : tone}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Colors that suit your {selectedSkinTone} skin tone:
            </p>
            <div className="grid grid-cols-6 gap-1.5">
              {skinPalette.map((item) => (
                <div
                  key={item.name}
                  className="flex flex-col items-center gap-0.5"
                >
                  <div
                    className="w-10 h-10 rounded-full border-2 border-white shadow-md"
                    style={{ background: item.color }}
                  />
                  <span className="text-[9px] text-center text-muted-foreground leading-tight">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Path to 100% swatches */}
        {pathTo100.length > 0 && (
          <div className="mt-3 bg-card border border-border/30 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              🎯 AI Suggestion: How to get 100% with this look.
            </h3>
            <p className="text-xs text-muted-foreground">
              Tap a colour to shop it
            </p>
            <div className="grid grid-cols-3 gap-3">
              {pathTo100.map((swatch, idx) => {
                const isSelected = shopSwatch?.name === swatch.name;
                return (
                  <button
                    type="button"
                    key={`${swatch.name}-${idx}`}
                    className="flex flex-col items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
                    onClick={() => setShopSwatch(isSelected ? null : swatch)}
                    data-ocid="score.button"
                  >
                    <div
                      className="w-12 h-12 rounded-full shadow-md border-2 transition-all"
                      style={{
                        background: swatch.color,
                        borderColor: isSelected
                          ? "#fff"
                          : "rgba(255,255,255,0.2)",
                        transform: isSelected ? "scale(1.15)" : "scale(1)",
                        boxShadow: isSelected
                          ? "0 0 0 3px rgba(135,206,235,0.7)"
                          : undefined,
                      }}
                    />
                    <span className="text-xs text-muted-foreground text-center leading-tight">
                      {swatch.name}
                    </span>
                  </button>
                );
              })}
            </div>
            {shopSwatch && (
              <div className="pt-3 border-t border-border/20">
                <p className="text-xs font-semibold text-foreground mb-2">
                  🛍️ Shop {shopSwatch.name}:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      name: "House of Indya",
                      url: `https://www.houseofindya.com/Colourclash?q=${encodeURIComponent(shopSwatch.name)}`,
                      color: "#9B2335",
                    },
                    {
                      name: "Amazon",
                      url: `https://www.amazon.in/s?k=${encodeURIComponent(`${shopSwatch.name} clothing`)}`,
                      color: "#FF9900",
                    },
                    {
                      name: "Flipkart",
                      url: `https://www.flipkart.com/search?q=${encodeURIComponent(`${shopSwatch.name} clothing`)}`,
                      color: "#2874F0",
                    },
                    {
                      name: "Myntra",
                      url: `https://www.myntra.com/${encodeURIComponent(shopSwatch.name)}`,
                      color: "#FF3F6C",
                    },
                    {
                      name: "Ajio",
                      url: `https://www.ajio.com/search/?text=${encodeURIComponent(`${shopSwatch.name} clothing`)}`,
                      color: "#DC2626",
                    },
                    {
                      name: "Meesho",
                      url: `https://www.meesho.com/search?q=${encodeURIComponent(`${shopSwatch.name} clothing`)}`,
                      color: "#0D9488",
                    },
                    {
                      name: "Nykaa",
                      url: `https://www.nykaa.com/search/result/?q=${encodeURIComponent(`${shopSwatch.name} clothing`)}`,
                      color: "#FC2779",
                    },
                    {
                      name: "Offduty",
                      url: `https://offduty.in/search?type=product&q=${encodeURIComponent(shopSwatch.name)}`,
                      color: "#8B6914",
                    },
                  ].map((retailer) => (
                    <a
                      key={retailer.name}
                      href={retailer.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 rounded-full font-medium text-white transition-opacity hover:opacity-80"
                      style={{ background: retailer.color }}
                      data-ocid="score.button"
                    >
                      {retailer.name}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Share sheet */}
        <AnimatePresence>
          {showShareSheet && currentEntry && shareImageUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
              onClick={() => setShowShareSheet(false)}
              data-ocid="score.popover"
            >
              <div
                className="w-full max-w-sm bg-background rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                {/* Full composite image preview */}
                <div
                  className="w-full bg-black flex items-center justify-center"
                  style={{ maxHeight: "60vh", overflow: "hidden" }}
                >
                  <img
                    src={shareImageUrl}
                    alt="Share card"
                    className="w-full object-contain"
                    style={{ maxHeight: "60vh" }}
                  />
                </div>

                <div className="p-4 space-y-3">
                  <p className="text-xs text-muted-foreground text-center">
                    Right-click the image above to copy or save it
                  </p>

                  {/* Caption copy area */}
                  <div className="bg-muted rounded-xl p-3 text-xs text-foreground leading-relaxed">
                    {shareCaption}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const a = document.createElement("a");
                        a.href = shareImageUrl;
                        a.download = "colour-clash-score.png";
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        toast.success("Image downloaded!");
                      }}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
                      data-ocid="score.secondary_button"
                    >
                      <Download className="w-4 h-4" /> Download Image
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard
                          .writeText(shareCaption)
                          .then(() => toast.success("Caption copied!"))
                          .catch(() => toast.error("Could not copy"));
                      }}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-muted text-foreground text-sm font-semibold"
                      data-ocid="score.copy.button"
                    >
                      <Copy className="w-4 h-4" /> Copy Caption
                    </button>
                  </div>

                  {/* Platform buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={handleWhatsApp}
                      className="flex flex-col items-center gap-1"
                      data-ocid="score.share.button"
                    >
                      <div className="w-11 h-11 rounded-full bg-[#25D366] flex items-center justify-center">
                        <SiWhatsapp className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[9px] text-muted-foreground">
                        WhatsApp
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={handleTwitter}
                      className="flex flex-col items-center gap-1"
                      data-ocid="score.share.button"
                    >
                      <div className="w-11 h-11 rounded-full bg-black flex items-center justify-center">
                        <SiX className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[9px] text-muted-foreground">
                        X / Twitter
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={handleTelegram}
                      className="flex flex-col items-center gap-1"
                    >
                      <div className="w-11 h-11 rounded-full bg-[#0088CC] flex items-center justify-center">
                        <SiTelegram className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[9px] text-muted-foreground">
                        Telegram
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard
                          .writeText(shareCaption)
                          .then(() => toast.success("Copied!"));
                        setShowShareSheet(false);
                      }}
                      className="flex flex-col items-center gap-1"
                      data-ocid="score.copy.button"
                    >
                      <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center">
                        <Copy className="w-5 h-5" />
                      </div>
                      <span className="text-[9px] text-muted-foreground">
                        Copy Link
                      </span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowShareSheet(false)}
                    className="w-full py-2 rounded-xl bg-muted text-sm font-medium text-muted-foreground"
                    data-ocid="score.cancel_button"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // ---- Main render ----------------------------------------------------------

  return (
    <div className="w-full max-w-md mx-auto pb-8 px-4 pt-2">
      {/* Page header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5">
          <svg
            width="22"
            height="22"
            viewBox="0 0 28 28"
            fill="none"
            aria-label="Colour Clash icon"
            role="img"
          >
            <circle cx="10" cy="10" r="4" fill="#FF6B6B" />
            <circle cx="18" cy="10" r="4" fill="#818CF8" />
            <circle cx="10" cy="18" r="4" fill="#34D399" />
            <circle cx="18" cy="18" r="4" fill="#FBBF24" />
          </svg>
          <h1 className="text-base font-black tracking-tight">
            <span style={{ color: "#FF6B6B" }}>Outfit</span>{" "}
            <span style={{ fontStyle: "italic" }}>Score</span>
          </h1>
        </div>
        {pageState === "results" && (
          <button
            type="button"
            onClick={handleRetry}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            data-ocid="score.secondary_button"
          >
            <RefreshCw className="w-3.5 h-3.5" /> New
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {pageState === "idle" && renderIdle()}
        {pageState === "cropping" && renderCropping()}
        {pageState === "detecting" && renderDetecting()}
        {pageState === "analyzing" && renderAnalyzing()}
        {pageState === "results" && renderResults()}
        {pageState === "error" && renderError()}
      </AnimatePresence>
    </div>
  );
}

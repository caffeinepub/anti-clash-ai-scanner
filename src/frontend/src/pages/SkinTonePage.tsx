import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

const GEMINI_API_KEY = "AIzaSyD3pY6TmTNA17OCAghZJrPfn7zxPYd7cF0";

interface ColorProfile {
  tone: string;
  season: string;
  description: string;
  suits: string[];
  clashes: string[];
}

function loadProfile(): ColorProfile | null {
  try {
    const raw = localStorage.getItem("colorProfile");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function SwatchGrid({
  colors,
  label,
  variant,
}: {
  colors: string[];
  label: string;
  variant: "suits" | "clashes";
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        {label}
      </p>
      <div className="grid grid-cols-5 gap-2">
        {colors.map((hex) => (
          <div key={hex} className="flex flex-col items-center gap-1">
            <div
              className="w-11 h-11 rounded-xl shadow-sm"
              style={{
                backgroundColor: hex,
                border: `2px solid ${
                  variant === "suits" ? "#22c55e" : "#ef4444"
                }`,
              }}
              title={hex}
            />
            <span className="text-[9px] text-muted-foreground font-mono">
              {hex}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SkinTonePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<ColorProfile | null>(loadProfile);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzePhoto = async (dataUrl: string) => {
    setIsAnalyzing(true);
    try {
      const base64 = dataUrl.split(",")[1];
      const mimeMatch = dataUrl.match(/data:([^;]+);/);
      const mimeType = mimeMatch?.[1] ?? "image/jpeg";

      const prompt =
        'Analyze the skin tone in this photo. Return ONLY valid JSON: {"tone": "Warm", "season": "Soft Autumn", "description": "Brief description", "suits": ["#hex1","#hex2","#hex3","#hex4","#hex5","#hex6","#hex7","#hex8","#hex9","#hex10"], "clashes": ["#hex1","#hex2","#hex3","#hex4","#hex5","#hex6","#hex7","#hex8","#hex9","#hex10"]}';

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
      const cleaned = raw
        .replace(/```json?/g, "")
        .replace(/```/g, "")
        .trim();
      const brace = cleaned.indexOf("{");
      const result: ColorProfile = JSON.parse(
        cleaned.slice(brace, cleaned.lastIndexOf("}") + 1),
      );

      setProfile(result);
      localStorage.setItem("colorProfile", JSON.stringify(result));
      toast.success("Skin tone profile saved!");
    } catch (err) {
      console.error(err);
      toast.error("Analysis failed. Please try a clearer selfie.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      analyzePhoto(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const toneColor =
    profile?.tone === "Warm"
      ? "bg-amber-100 text-amber-800 border-amber-300"
      : profile?.tone === "Cool"
        ? "bg-blue-100 text-blue-800 border-blue-300"
        : "bg-purple-100 text-purple-800 border-purple-300";

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div>
        <h2 className="font-display font-bold text-2xl text-foreground">
          Skin Tone Analysis
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Discover colors that make you glow
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFile}
        data-ocid="skintone.upload_button"
      />

      {!profile && !isAnalyzing && (
        <Card className="ios-card border-0">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-100 via-rose-100 to-purple-100 flex items-center justify-center">
                <span className="text-4xl">🪞</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Analyse My Skin Tone</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Take a selfie and AI will identify your color season and
                  suggest which colors suit you best.
                </p>
              </div>
              <Button
                className="gap-2 rounded-2xl px-8"
                onClick={() => fileInputRef.current?.click()}
                data-ocid="skintone.primary_button"
              >
                <Sparkles className="w-4 h-4" /> Take a Selfie
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isAnalyzing && (
        <Card className="ios-card border-0">
          <CardContent className="py-12">
            <div
              className="flex flex-col items-center gap-4"
              data-ocid="skintone.loading_state"
            >
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="font-semibold text-foreground">
                Analysing with AI...
              </p>
              <p className="text-xs text-muted-foreground">
                Detecting your color season
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {profile && !isAnalyzing && (
        <motion.div
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          data-ocid="skintone.success_state"
        >
          {/* Tone card */}
          <Card className="ios-card border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`px-3 py-1 rounded-full text-sm font-bold border ${toneColor}`}
                >
                  {profile.tone} Tone
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {profile.season}
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {profile.description}
              </p>
            </CardContent>
          </Card>

          {/* Suits */}
          <Card className="ios-card border-0">
            <CardContent className="p-4">
              <SwatchGrid
                colors={profile.suits}
                label="✅ Colors That Suit You"
                variant="suits"
              />
            </CardContent>
          </Card>

          {/* Clashes */}
          <Card className="ios-card border-0">
            <CardContent className="p-4">
              <SwatchGrid
                colors={profile.clashes}
                label="❌ Colors To Avoid"
                variant="clashes"
              />
            </CardContent>
          </Card>

          <Button
            variant="outline"
            className="gap-2 rounded-2xl border-primary/30 text-primary"
            onClick={() => fileInputRef.current?.click()}
            data-ocid="skintone.secondary_button"
          >
            <RefreshCw className="w-4 h-4" /> Re-analyse
          </Button>
        </motion.div>
      )}
    </div>
  );
}

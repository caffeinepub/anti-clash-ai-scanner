import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

interface AIEngineModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = "initial" | "select-ai";

const AI_OPTIONS = [
  {
    key: "gemini",
    label: "Google Gemini",
    emoji: "🔮",
    color: "#4285F4",
    gradient: "linear-gradient(135deg, #4285F4, #34A853)",
    url: "https://gemini.google.com",
  },
  {
    key: "chatgpt",
    label: "ChatGPT",
    emoji: "🤖",
    color: "#10a37f",
    gradient: "linear-gradient(135deg, #10a37f, #0d8a6b)",
    url: "https://chatgpt.com",
  },
  {
    key: "metallamа",
    label: "Meta LLaMA",
    emoji: "🦙",
    color: "#0668E1",
    gradient: "linear-gradient(135deg, #0668E1, #1877F2)",
    url: "https://llama.meta.com",
  },
  {
    key: "grok",
    label: "Grok",
    emoji: "⚡",
    color: "#1DA1F2",
    gradient: "linear-gradient(135deg, #1a1a2e, #16213e)",
    url: "https://grok.x.ai",
  },
];

export default function AIEngineModal({ open, onClose }: AIEngineModalProps) {
  const [step, setStep] = useState<Step>("initial");
  const [selectedAI, setSelectedAI] = useState<string | null>(null);

  const handleUseInternal = () => {
    localStorage.setItem("cc_ai_engine_preference", "internal");
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem("cc_ai_engine_preference", "skipped");
    onClose();
  };

  const handleConnectCustom = () => {
    setStep("select-ai");
  };

  const handleAISelect = (aiKey: string) => {
    setSelectedAI(aiKey);
    const ai = AI_OPTIONS.find((a) => a.key === aiKey);
    if (!ai) return;
    localStorage.setItem("cc_ai_engine_preference", "external");
    localStorage.setItem("cc_filter_ai", aiKey);
    // Redirect to AI login page
    window.open(ai.url, "_blank", "noopener,noreferrer");
    // Close modal after redirect initiated
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleBack = () => {
    setStep("initial");
    setSelectedAI(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          data-ocid="ai-modal.modal"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(99,20,255,0.85) 0%, rgba(255,46,99,0.75) 50%, rgba(255,152,0,0.7) 100%)",
              backdropFilter: "blur(20px)",
            }}
            onClick={handleSkip}
            aria-hidden="true"
          />

          {/* Modal Card */}
          <motion.div
            className="relative z-10 w-full max-w-sm overflow-hidden"
            style={{
              borderRadius: 28,
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(30px) saturate(200%)",
              border: "1.5px solid rgba(255,255,255,0.25)",
              boxShadow:
                "0 32px 80px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset",
            }}
            initial={{ scale: 0.85, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
          >
            {/* Rainbow top bar */}
            <div
              className="h-1.5 w-full"
              style={{
                background:
                  "linear-gradient(90deg, #FF6B6B, #FBBF24, #34D399, #60A5FA, #818CF8, #F472B6, #FF6B6B)",
              }}
            />

            <AnimatePresence mode="wait">
              {step === "initial" ? (
                <motion.div
                  key="initial"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center gap-5 px-6 py-7"
                >
                  {/* Logo dots */}
                  <motion.div
                    className="flex flex-col items-center gap-1"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: 0.1,
                      type: "spring",
                      stiffness: 400,
                      damping: 22,
                    }}
                  >
                    <div className="relative w-16 h-16">
                      <div
                        className="absolute"
                        style={{
                          top: 4,
                          left: 4,
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background:
                            "radial-gradient(circle at 35% 35%, #FF8A8A, #FF6B6B)",
                          boxShadow: "0 4px 16px rgba(255,107,107,0.6)",
                        }}
                      />
                      <div
                        className="absolute"
                        style={{
                          top: 4,
                          right: 4,
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background:
                            "radial-gradient(circle at 35% 35%, #a5b4fc, #818CF8)",
                          boxShadow: "0 4px 16px rgba(129,140,248,0.6)",
                        }}
                      />
                      <div
                        className="absolute"
                        style={{
                          bottom: 4,
                          left: 4,
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background:
                            "radial-gradient(circle at 35% 35%, #6ee7b7, #34D399)",
                          boxShadow: "0 4px 16px rgba(52,211,153,0.6)",
                        }}
                      />
                      <div
                        className="absolute"
                        style={{
                          bottom: 4,
                          right: 4,
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background:
                            "radial-gradient(circle at 35% 35%, #fde68a, #FBBF24)",
                          boxShadow: "0 4px 16px rgba(251,191,36,0.6)",
                        }}
                      />
                    </div>
                  </motion.div>

                  <div className="text-center space-y-1.5">
                    <h2 className="text-xl font-black text-white leading-tight">
                      Choose Your AI Engine
                    </h2>
                    <p className="text-sm text-white/75 leading-relaxed">
                      Power your Colour Clash experience with your preferred AI
                      or use our fast internal engine.
                    </p>
                  </div>

                  {/* Main CTA — Connect Custom AI */}
                  <motion.button
                    type="button"
                    onClick={handleConnectCustom}
                    className="w-full py-4 rounded-2xl font-black text-sm text-white transition-all active:scale-95 relative overflow-hidden"
                    style={{
                      background:
                        "linear-gradient(135deg, #FF6B6B 0%, #818CF8 50%, #34D399 100%)",
                      boxShadow: "0 8px 32px -6px rgba(255,107,107,0.5)",
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    data-ocid="ai-modal.primary_button"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg">🔗</span>
                      <span>Connect Custom AI Engine</span>
                    </div>
                    <p className="text-[10px] text-white/75 mt-0.5 font-normal">
                      Gemini · ChatGPT · Meta LLaMA · Grok
                    </p>
                  </motion.button>

                  {/* Use Internal Engine */}
                  <button
                    type="button"
                    onClick={handleUseInternal}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm text-white/90 border border-white/25 transition-all active:scale-95 hover:bg-white/10"
                    data-ocid="ai-modal.secondary_button"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-base">⚡</span>
                      <span>Use Internal App Engine</span>
                    </div>
                    <p className="text-[10px] text-white/55 mt-0.5 font-normal">
                      Fast · Offline · Instant results
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={handleSkip}
                    className="text-xs text-white/45 hover:text-white/70 transition-colors py-1"
                    data-ocid="ai-modal.close_button"
                  >
                    Skip for now
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="select-ai"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-4 px-6 py-7"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-colors"
                      data-ocid="ai-modal.cancel_button"
                    >
                      ←
                    </button>
                    <div>
                      <h2 className="text-base font-black text-white">
                        Select Your AI
                      </h2>
                      <p className="text-[11px] text-white/60">
                        You'll be redirected to sign in
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {AI_OPTIONS.map((ai, i) => (
                      <motion.button
                        key={ai.key}
                        type="button"
                        onClick={() => handleAISelect(ai.key)}
                        className="w-full flex items-center gap-3 py-3.5 px-4 rounded-2xl font-bold text-white text-sm transition-all active:scale-95 relative overflow-hidden"
                        style={{
                          background: ai.gradient,
                          boxShadow: `0 6px 24px -6px ${ai.color}80`,
                          opacity:
                            selectedAI && selectedAI !== ai.key ? 0.5 : 1,
                        }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        data-ocid={`ai-modal.toggle.${i + 1}`}
                      >
                        <span className="text-2xl">{ai.emoji}</span>
                        <div className="text-left flex-1">
                          <p className="font-black">{ai.label}</p>
                          <p className="text-[10px] text-white/65 font-normal">
                            Tap to open & sign in
                          </p>
                        </div>
                        {selectedAI === ai.key && (
                          <span className="text-lg">✓</span>
                        )}
                      </motion.button>
                    ))}
                  </div>

                  <div
                    className="rounded-xl p-3"
                    style={{ background: "rgba(255,255,255,0.1)" }}
                  >
                    <p className="text-[10px] text-white/70 text-center leading-relaxed">
                      🔒 Your data is{" "}
                      <strong className="text-white/90">never stored</strong> by
                      this app. All AI processing uses your phone memory only.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

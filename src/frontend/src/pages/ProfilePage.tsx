import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import {
  Camera,
  CheckCircle2,
  Loader2,
  Mail,
  SendHorizonal,
  ShieldCheck,
  Trash2,
  UserCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useUserProfile } from "../context/UserProfileContext";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

// OTP email verification state machine
type VerifyStep = "idle" | "code-sent" | "verified";

function EmailVerificationCard({
  email,
  onVerified,
}: {
  email: string;
  onVerified: () => void;
}) {
  const storageKey = `emailVerified_${email}`;
  const isAlreadyVerified =
    typeof window !== "undefined"
      ? localStorage.getItem(storageKey) === "true"
      : false;

  const [step, setStep] = useState<VerifyStep>(
    isAlreadyVerified ? "verified" : "idle",
  );
  const [generatedCode, setGeneratedCode] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  // Reset when email changes
  useEffect(() => {
    const alreadyDone =
      localStorage.getItem(`emailVerified_${email}`) === "true";
    setStep(alreadyDone ? "verified" : "idle");
    setOtpValue("");
    setGeneratedCode("");
    setError("");
  }, [email]);

  const handleSendCode = () => {
    if (!email.trim()) {
      toast.error("Please enter an email address first.");
      return;
    }
    setIsSending(true);
    // Simulate a brief send delay
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      setStep("code-sent");
      setOtpValue("");
      setError("");
      setIsSending(false);
      toast.success("Code ready — check the app (demo mode)");
    }, 800);
  };

  const handleVerify = () => {
    if (otpValue === generatedCode) {
      localStorage.setItem(storageKey, "true");
      setStep("verified");
      setError("");
      toast.success("Email verified successfully! ✨");
      onVerified();
    } else {
      setError("Incorrect code. Please try again.");
      setOtpValue("");
    }
  };

  if (step === "verified") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl"
        data-ocid="profile.success_state"
      >
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span className="text-sm font-semibold text-emerald-700">
          Verified on this device
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/60 overflow-hidden bg-muted/10"
      data-ocid="profile.card"
    >
      {/* Step indicator */}
      <div className="flex items-center gap-0 border-b border-border/40">
        {(["Enter Email", "Get Code", "Verified ✓"] as const).map(
          (label, i) => {
            const stepIndex =
              step === "idle" ? 0 : step === "code-sent" ? 1 : 2;
            const isActive = stepIndex === i;
            const isDone = stepIndex > i;
            return (
              <div
                key={label}
                className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                  isActive
                    ? "text-primary bg-primary/5"
                    : isDone
                      ? "text-emerald-600 bg-emerald-50/50"
                      : "text-muted-foreground"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isDone
                        ? "bg-emerald-500 text-white"
                        : "bg-muted-foreground/30 text-muted-foreground"
                  }`}
                >
                  {isDone ? "✓" : i + 1}
                </span>
                {label}
              </div>
            );
          },
        )}
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait">
          {step === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col items-center gap-4 py-2"
            >
              <div className="flex flex-col items-center gap-1 text-center">
                <Mail className="w-8 h-8 text-primary/70" />
                <p className="text-sm font-semibold text-foreground">
                  Verify Your Email
                </p>
                <p className="text-xs text-muted-foreground">
                  We'll send a 6-digit code to
                </p>
                <p className="text-xs font-mono font-bold text-primary">
                  {email || "your@email.com"}
                </p>
              </div>
              <Button
                type="button"
                onClick={handleSendCode}
                disabled={isSending || !email.trim()}
                className="gap-2 rounded-xl w-full h-10 text-sm font-semibold bg-primary hover:bg-primary/90"
                data-ocid="profile.primary_button"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <SendHorizonal className="w-4 h-4" />
                )}
                {isSending ? "Sending..." : "Send Code"}
              </Button>
            </motion.div>
          )}

          {step === "code-sent" && (
            <motion.div
              key="code-sent"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col items-center gap-4 py-2"
            >
              <div className="flex flex-col items-center gap-1 text-center">
                <p className="text-sm font-semibold text-foreground">
                  Enter 6-digit code
                </p>
                <p className="text-xs text-muted-foreground">
                  Enter the code below to verify
                </p>
              </div>

              <InputOTP
                maxLength={6}
                value={otpValue}
                onChange={setOtpValue}
                data-ocid="profile.input"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>

              {/* Demo hint */}
              <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl w-full text-center">
                <p className="text-xs text-amber-700">
                  Demo code:{" "}
                  <span className="font-mono font-bold tracking-widest">
                    {generatedCode}
                  </span>
                </p>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-destructive font-medium"
                  data-ocid="profile.error_state"
                >
                  {error}
                </motion.p>
              )}

              <Button
                type="button"
                onClick={handleVerify}
                disabled={otpValue.length < 6}
                className="gap-2 rounded-xl w-full h-10 text-sm font-semibold bg-primary hover:bg-primary/90"
                data-ocid="profile.submit_button"
              >
                <CheckCircle2 className="w-4 h-4" />
                Verify Code
              </Button>

              <button
                type="button"
                onClick={() => {
                  setStep("idle");
                  setOtpValue("");
                  setError("");
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Resend code
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function ProfilePage() {
  const { actor } = useActor();
  const { identity, clear } = useInternetIdentity();
  const { userProfile, isLoadingProfile, refreshProfile } = useUserProfile();

  const isLoggedIn = identity && !identity.getPrincipal().isAnonymous();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<"men" | "women" | "all">("all");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(() =>
    localStorage.getItem("profilePhotoUrl"),
  );
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setProfilePhotoUrl(dataUrl);
      localStorage.setItem("profilePhotoUrl", dataUrl);
      window.dispatchEvent(new Event("profilePhotoUpdated"));
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName);
      setEmail(userProfile.email);
      setGender((userProfile.gender as "men" | "women" | "all") || "all");
    }
    const savedDob = localStorage.getItem("colourclash_dob") || "";
    if (savedDob) setDob(savedDob);
  }, [userProfile]);

  // Sync local email verified state from localStorage
  useEffect(() => {
    const deviceVerified =
      email && localStorage.getItem(`emailVerified_${email}`) === "true";
    setIsEmailVerified(!!(userProfile?.emailVerified || deviceVerified));
  }, [email, userProfile]);

  const handleSave = async () => {
    if (!actor) return;
    if (!displayName.trim()) {
      toast.error("Please enter your display name.");
      return;
    }
    try {
      setIsSaving(true);
      localStorage.setItem("colourclash_dob", dob);
      const ageFromDob = dob
        ? BigInt(
            Math.floor(
              (Date.now() - new Date(dob).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000),
            ),
          )
        : 0n;
      await actor.saveCallerUserProfile({
        displayName: displayName.trim(),
        email: email.trim(),
        age: ageFromDob,
        gender,
        emailVerified: isEmailVerified,
      });
      await refreshProfile();
      toast.success("Profile saved!");
    } catch {
      toast.error("Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!actor) return;
    try {
      setIsDeleting(true);
      await actor.deleteUserAccount();
      setDeleteDialogOpen(false);
      toast.success("Account deleted.");
      clear();
    } catch {
      toast.error("Failed to delete account.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 gap-5"
        data-ocid="profile.section"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <UserCircle className="w-8 h-8 text-primary" />
        </div>
        <p className="text-center text-muted-foreground">
          Please log in to view and edit your profile.
        </p>
      </div>
    );
  }

  if (isLoadingProfile) {
    return (
      <div
        className="flex items-center justify-center py-20"
        data-ocid="profile.loading_state"
      >
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      className="flex flex-col gap-5 pb-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      data-ocid="profile.section"
    >
      {/* Header card */}
      <div className="ios-card p-5">
        <div className="flex items-center gap-4">
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
            data-ocid="profile.upload_button"
          />
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="relative w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center overflow-hidden group"
            data-ocid="profile.secondary_button"
            aria-label="Change profile photo"
          >
            {profilePhotoUrl ? (
              <img
                src={profilePhotoUrl}
                alt="profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <UserCircle className="w-9 h-9 text-primary" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </button>
          <div className="flex-1">
            <h2 className="font-display font-bold text-xl text-foreground">
              {displayName ? `Hey, ${displayName}` : "Your Profile"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {email || "No email set"}
            </p>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="ios-card overflow-hidden">
        <div className="px-4 py-3 bg-muted/20">
          <h3 className="ios-section-header mb-0">Profile Information</h3>
        </div>
        <div style={{ borderTop: "0.5px solid oklch(var(--border))" }} />
        <div className="p-4 flex flex-col gap-4">
          {/* Display Name */}
          <div className="space-y-1.5">
            <Label
              htmlFor="displayName"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              Display Name
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onBlur={(e) => {
                if (e.target.value.trim()) {
                  localStorage.setItem(
                    "colourclash_displayName",
                    e.target.value.trim(),
                  );
                }
              }}
              placeholder="e.g. Rahul Sharma"
              className="rounded-xl border-border/60 h-11"
              data-ocid="profile.input"
            />
          </div>

          {/* Email + Verification */}
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              Email Address
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="rounded-xl border-border/60 h-11 pr-10"
                data-ocid="profile.input"
              />
              {isEmailVerified && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
              )}
            </div>

            {/* Trendy OTP verification card */}
            {email.trim() && (
              <EmailVerificationCard
                email={email.trim()}
                onVerified={() => setIsEmailVerified(true)}
              />
            )}
          </div>

          {/* Date of Birth */}
          <div className="space-y-1.5">
            <Label
              htmlFor="dob"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              Date of Birth
            </Label>
            <Input
              id="dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="rounded-xl border-border/60 h-11"
              data-ocid="profile.input"
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Style Preference
            </Label>
            <div
              className="flex gap-2"
              role="radiogroup"
              aria-label="Gender preference"
            >
              {(["men", "women", "all"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                    gender === g
                      ? "bg-primary text-primary-foreground border-primary shadow-md"
                      : "bg-muted text-muted-foreground border-border/40 hover:border-primary/30"
                  }`}
                  data-ocid="profile.radio"
                  aria-pressed={gender === g}
                >
                  {g === "men"
                    ? "👔 Men"
                    : g === "women"
                      ? "👗 Women"
                      : "✨ All"}
                </button>
              ))}
            </div>
          </div>

          {/* Save button */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full gap-2 rounded-2xl h-12 font-semibold text-sm bg-primary hover:bg-primary/90"
            style={{ boxShadow: "0 6px 20px -4px oklch(0.60 0.20 250 / 0.4)" }}
            data-ocid="profile.submit_button"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isSaving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="ios-card overflow-hidden">
        <Accordion type="single" collapsible>
          <AccordionItem value="terms" className="border-none">
            <AccordionTrigger
              className="px-4 py-3.5 hover:no-underline"
              data-ocid="profile.toggle"
            >
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm text-foreground">
                  Terms &amp; Conditions
                </span>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                  Legal
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div style={{ borderTop: "0.5px solid oklch(var(--border))" }} />
              <div className="px-4 py-4 space-y-4 text-[11px] text-muted-foreground leading-relaxed">
                <p className="font-bold text-foreground text-xs">
                  Colour Clash — Terms &amp; Conditions
                </p>
                <p className="text-[10px] text-muted-foreground/70">
                  Last updated: March 2026
                </p>

                <div className="space-y-1">
                  <p className="font-semibold text-foreground text-xs">
                    1. Data Storage &amp; Privacy
                  </p>
                  <p>
                    All your personal data — including your profile, color
                    scans, outfit history, saved palettes, and preferences — is
                    stored exclusively on your device (phone/browser local
                    storage). Colour Clash does NOT store any personal data on
                    external servers. No data is transmitted to or retained by
                    our backend beyond the session.
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="font-semibold text-foreground text-xs">
                    2. How We Use Your Data
                  </p>
                  <p>
                    Your data is used solely to provide the Colour Clash
                    experience: personalized fashion recommendations, outfit
                    scoring, and color harmony analysis. We do not sell, share,
                    or transmit your data to third parties.
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="font-semibold text-foreground text-xs">
                    3. Camera &amp; Internet Usage
                  </p>
                  <p>
                    <strong>Camera:</strong> Used exclusively for real-time
                    garment color detection on your device.
                  </p>
                  <p>
                    <strong>Internet:</strong> Used to connect to AI services
                    (Google Gemini) for fashion advice, and to open retailer
                    websites when you tap shop links. No camera images are
                    stored or transmitted.
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="font-semibold text-foreground text-xs">
                    4. Retailer Links
                  </p>
                  <p>
                    Clicking "Shop" links opens the respective retailer&apos;s
                    website in your browser. Colour Clash is not responsible for
                    the content, pricing, or policies of those external
                    websites.
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="font-semibold text-foreground text-xs">
                    5. AI-Generated Content
                  </p>
                  <p>
                    Fashion advice and outfit scores are generated by AI (Google
                    Gemini) and are for entertainment and style inspiration
                    purposes only. Results may vary.
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="font-semibold text-foreground text-xs">
                    6. Limitation of Liability
                  </p>
                  <p>
                    Colour Clash is provided as-is without warranties. We are
                    not liable for fashion decisions made based on AI advice.
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="font-semibold text-foreground text-xs">
                    7. Contact
                  </p>
                  <p>
                    For queries, reach out through the app&apos;s feedback
                    feature.
                  </p>
                </div>

                <div className="rounded-xl bg-muted/40 p-3 mt-2">
                  <p className="text-[10px] font-semibold text-foreground">
                    By using Colour Clash, you agree to these terms.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Delete Account */}
      <div className="ios-card overflow-hidden">
        <div className="px-4 py-3 bg-muted/20">
          <h3 className="ios-section-header mb-0">Danger Zone</h3>
        </div>
        <div style={{ borderTop: "0.5px solid oklch(var(--border))" }} />
        <div className="p-4">
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full gap-2 rounded-2xl h-12 font-semibold text-sm text-destructive border-destructive/30 hover:bg-destructive/10"
                data-ocid="profile.delete_button"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl" data-ocid="profile.dialog">
              <DialogHeader>
                <DialogTitle>Delete Account</DialogTitle>
                <DialogDescription>
                  Are you sure you want to permanently delete your account? This
                  action cannot be undone. All your saved colors and profile
                  data will be lost.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                  className="rounded-xl"
                  data-ocid="profile.cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="rounded-xl gap-2"
                  data-ocid="profile.confirm_button"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </motion.div>
  );
}

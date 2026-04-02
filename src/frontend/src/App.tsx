import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BookOpen,
  Heart,
  LogOut,
  ScanLine,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
  UserCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import ColourClashLogo from "./components/ColourClashLogo";
import GreetingOverlay from "./components/GreetingOverlay";
import NetflixIntro from "./components/NetflixIntro";
import { FilterProvider } from "./context/FilterContext";
import {
  UserProfileProvider,
  useUserProfile,
} from "./context/UserProfileContext";
import {
  InternetIdentityProvider,
  useInternetIdentity,
} from "./hooks/useInternetIdentity";
import BestDealsPage from "./pages/BestDealsPage";
import FavoritesPage from "./pages/FavoritesPage";
import OutfitScorePage from "./pages/OutfitScorePage";
import ProfilePage from "./pages/ProfilePage";
import ScannerPage from "./pages/ScannerPage";
import SkinTonePage from "./pages/SkinTonePage";
import StyleGuidePage from "./pages/StyleGuidePage";
import TrendRadarPage from "./pages/TrendRadarPage";

const queryClient = new QueryClient();

type Tab =
  | "scanner"
  | "favorites"
  | "style"
  | "profile"
  | "score"
  | "trends"
  | "skintone"
  | "deals";

const NAV_TABS: {
  id: Tab;
  label: string;
  Icon: React.FC<{ className?: string; strokeWidth?: number }>;
}[] = [
  { id: "scanner", label: "Home", Icon: ScanLine },
  { id: "favorites", label: "Favorites", Icon: Heart },
  { id: "score", label: "Score", Icon: Star },
  { id: "trends", label: "Trends", Icon: TrendingUp },
  { id: "deals" as const, label: "Deals", Icon: Tag },
];

// --- Login Welcome Modal ---
function LoginWelcomeModal({
  open,
  onClose,
  onSignIn,
}: {
  open: boolean;
  onClose: () => void;
  onSignIn: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          data-ocid="auth.modal"
        >
          <motion.div
            className="absolute inset-0 bg-black/55 backdrop-blur-md"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            className="relative z-10 w-full max-w-sm bg-card rounded-3xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.88, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <div
              className="h-1.5 w-full"
              style={{
                background:
                  "linear-gradient(90deg, #FF6B6B, #FBBF24, #34D399, #60A5FA, #818CF8, #F472B6)",
              }}
            />
            <div className="flex flex-col items-center gap-5 px-7 py-8">
              <div className="relative flex items-center justify-center w-20 h-20 mb-1">
                <div
                  className="absolute w-14 h-14 rounded-full opacity-80"
                  style={{
                    background:
                      "conic-gradient(#FF6B6B, #FBBF24, #34D399, #60A5FA, #818CF8, #F472B6, #FF6B6B)",
                    filter: "blur(2px)",
                  }}
                />
                <div className="relative w-12 h-12 rounded-full bg-card flex items-center justify-center shadow-md">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ColourClashLogo size="lg" />
                <span className="text-[11px] italic text-muted-foreground tracking-wide font-medium">
                  just fly with it...
                </span>
              </div>
              <div className="text-center space-y-2">
                <h2 className="font-display font-bold text-xl text-foreground leading-tight">
                  To immerse in the Colour Clash world, we need your presence
                </h2>
                <p className="text-sm text-muted-foreground">
                  Sign up / Sign in to unlock personalized fashion advice,
                  colour scanning &amp; your style profile.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSignIn();
                }}
                className="w-full py-3.5 rounded-2xl font-bold text-sm text-primary-foreground transition-all active:scale-95 shadow-lg"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.55 0.22 250), oklch(0.48 0.20 260))",
                  boxShadow: "0 8px 24px -6px oklch(0.55 0.22 250 / 0.45)",
                }}
                data-ocid="auth.primary_button"
              >
                ✨ Sign In / Sign Up
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                data-ocid="auth.cancel_button"
              >
                Maybe Later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function UserArea({ onProfileClick }: { onProfileClick: () => void }) {
  const { identity, login, clear, isLoggingIn, isInitializing } =
    useInternetIdentity();
  const { userProfile } = useUserProfile();
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(() =>
    localStorage.getItem("profilePhotoUrl"),
  );
  const [streak, setStreak] = useState(1);
  const [localDisplayName, setLocalDisplayName] = useState(
    () => localStorage.getItem("colourclash_displayName") || "",
  );

  useEffect(() => {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem("colourClash_streakDate");
    const storedCount = Number.parseInt(
      localStorage.getItem("colourClash_streakCount") || "1",
      10,
    );
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    let newCount = 1;
    if (lastDate === today) {
      newCount = storedCount;
    } else if (lastDate === yesterday) {
      newCount = storedCount + 1;
    }
    localStorage.setItem("colourClash_streakDate", today);
    localStorage.setItem("colourClash_streakCount", String(newCount));
    setStreak(newCount);
  }, []);

  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const handler = () =>
      setProfilePhotoUrl(localStorage.getItem("profilePhotoUrl"));
    window.addEventListener("profilePhotoUpdated", handler);
    return () => window.removeEventListener("profilePhotoUpdated", handler);
  }, []);

  useEffect(() => {
    const handler = () =>
      setLocalDisplayName(
        localStorage.getItem("colourclash_displayName") || "",
      );
    window.addEventListener("profileNameUpdated", handler);
    return () => window.removeEventListener("profileNameUpdated", handler);
  }, []);

  const isLoggedIn = identity && !identity.getPrincipal().isAnonymous();

  const resolvedDisplayName = userProfile?.displayName
    ? userProfile.displayName.split(" ")[0]
    : localDisplayName
      ? localDisplayName.split(" ")[0]
      : null;

  if (isInitializing) {
    return <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />;
  }

  if (!isLoggedIn) {
    return (
      <>
        <LoginWelcomeModal
          open={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSignIn={login}
        />
        <button
          type="button"
          onClick={() => setShowLoginModal(true)}
          disabled={isLoggingIn}
          className="flex flex-col items-center gap-0.5 group"
          data-ocid="auth.open_modal_button"
          aria-label="Login"
        >
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center border border-border transition-all group-hover:border-primary/50">
            <UserCircle
              className={`w-5 h-5 transition-colors ${
                isLoggingIn
                  ? "text-muted-foreground animate-pulse"
                  : "text-muted-foreground group-hover:text-primary"
              }`}
            />
          </div>
          <span className="text-[9px] font-medium text-muted-foreground group-hover:text-primary transition-colors">
            {isLoggingIn ? "..." : "Login"}
          </span>
        </button>
      </>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex flex-col items-center gap-0.5 group"
          data-ocid="auth.toggle"
          aria-label="User menu"
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center transition-all group-hover:bg-primary/30 overflow-hidden">
              {profilePhotoUrl ? (
                <img
                  src={profilePhotoUrl}
                  alt="profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserCircle className="w-5 h-5 text-primary" />
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-background" />
            {streak >= 2 && (
              <span className="absolute -top-1.5 -right-1.5 text-[8px] leading-none bg-orange-500 text-white rounded-full px-1 py-0.5 font-black border border-background">
                {streak}
              </span>
            )}
          </div>
          {resolvedDisplayName && (
            <span className="text-[9px] font-semibold text-primary">
              {resolvedDisplayName}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-56 p-0 overflow-hidden border-border/60 shadow-2xl"
        data-ocid="auth.popover"
      >
        <div className="flex items-center gap-3 p-4 bg-muted/30">
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center overflow-hidden">
              {profilePhotoUrl ? (
                <img
                  src={profilePhotoUrl}
                  alt="profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserCircle className="w-6 h-6 text-primary" />
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-popover" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {userProfile?.displayName || localDisplayName || "Logged In"}
            </p>
          </div>
        </div>
        <div className="ios-separator" />
        <div className="p-2 flex flex-col gap-1">
          <button
            type="button"
            onClick={onProfileClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-muted/60 transition-colors"
            data-ocid="auth.secondary_button"
          >
            <UserCircle className="w-4 h-4 text-primary" />
            <span>View Profile</span>
          </button>
          <button
            type="button"
            onClick={clear}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors"
            data-ocid="auth.delete_button"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AppContent() {
  const [showIntro, setShowIntro] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("scanner");
  const [homeKey, setHomeKey] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [showHoiBanner, setShowHoiBanner] = useState(
    () => localStorage.getItem("hoi_banner_dismissed") !== "1",
  );

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
  }, []);

  const resetApp = useCallback(() => {
    setActiveTab("scanner");
    setHomeKey((k) => k + 1);
    setShowProfile(false);
  }, []);

  const pageTitles: Record<Tab, { subtitle: string }> = {
    scanner: { subtitle: "Color Scanner" },
    favorites: { subtitle: "Saved palettes" },
    style: { subtitle: "Colour theory" },
    profile: { subtitle: "Your profile" },
    score: { subtitle: "AI outfit score" },
    trends: { subtitle: "2026 trends" },
    skintone: { subtitle: "Skin tone analysis" },
    deals: { subtitle: "Best deals today" },
  };

  const current = pageTitles[activeTab];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Netflix-style intro -- always shows on app open */}
      {showIntro && <NetflixIntro onComplete={handleIntroComplete} />}

      {/* Greeting overlay -- shown immediately even during intro */}
      <GreetingOverlay />

      {/* iOS-style Header */}
      <header
        className="sticky top-0 z-40 ios-glass"
        style={{ borderBottom: "0.5px solid oklch(var(--border))" }}
      >
        <div className="max-w-lg mx-auto px-5 pt-4 pb-3 flex items-center gap-3">
          {/* Logo -- click to hard reset */}
          <button
            type="button"
            onClick={resetApp}
            className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center transition-all active:scale-90 hover:bg-primary/30"
            aria-label="Go to home"
            data-ocid="nav.home.button"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="Colour Clash logo"
            >
              <circle cx="10" cy="10" r="4" fill="#FF6B6B" />
              <circle cx="18" cy="10" r="4" fill="#818CF8" />
              <circle cx="10" cy="18" r="4" fill="#34D399" />
              <circle cx="18" cy="18" r="4" fill="#FBBF24" />
              <circle cx="14" cy="14" r="3" fill="oklch(0.97 0.005 250)" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.18 }}
              >
                <button
                  type="button"
                  onClick={resetApp}
                  className="flex flex-col items-start leading-none gap-0.5 text-left"
                  aria-label="Colour Clash - go home"
                >
                  <ColourClashLogo size="md" />
                  <span className="text-[9px] italic text-muted-foreground tracking-wide font-medium">
                    just fly with it...
                  </span>
                </button>
                <p className="text-xs text-muted-foreground">
                  {current.subtitle}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="ml-auto">
            <UserArea onProfileClick={() => setShowProfile(true)} />
          </div>
        </div>
      </header>

      {/* House of Indya promotional banner */}
      {showHoiBanner && (
        <a
          href="https://www.houseofindya.com/Colourclash"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-gradient-to-r from-rose-600 to-pink-500 text-white py-2 px-4 relative z-30"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("button")) e.preventDefault();
          }}
          data-ocid="hoi.banner"
        >
          <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-xs font-bold shrink-0">
                🏷️ House of Indya
              </span>
              <span className="text-xs text-white/90 truncate">
                Use <strong>CCFLY</strong> for 5% off at checkout!
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowHoiBanner(false);
                localStorage.setItem("hoi_banner_dismissed", "1");
              }}
              className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white text-xs"
              aria-label="Dismiss banner"
              data-ocid="hoi.close_button"
            >
              ×
            </button>
          </div>
        </a>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-5 pb-36 overflow-y-auto">
        <div className="relative">
          <div className={activeTab === "scanner" ? "block" : "hidden"}>
            <ScannerPage key={homeKey} />
          </div>
          <div className={activeTab === "favorites" ? "block" : "hidden"}>
            <FavoritesPage onNavigate={(tab) => setActiveTab(tab as Tab)} />
          </div>
          <div className={activeTab === "score" ? "block" : "hidden"}>
            <OutfitScorePage
              onNavigateToSkinTone={() => setActiveTab("skintone")}
            />
          </div>
          <div className={activeTab === "trends" ? "block" : "hidden"}>
            <TrendRadarPage />
          </div>
          <div className={activeTab === "deals" ? "block" : "hidden"}>
            <BestDealsPage />
          </div>
          <div className={activeTab === "style" ? "block" : "hidden"}>
            <StyleGuidePage />
          </div>
          <div className={activeTab === "skintone" ? "block" : "hidden"}>
            <SkinTonePage />
          </div>
        </div>
      </main>

      {/* iOS Bottom Tab Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 ios-glass"
        style={{
          borderTop: "0.5px solid oklch(var(--border))",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="max-w-lg mx-auto flex">
          {NAV_TABS.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className="flex-1 flex flex-col items-center gap-1 pt-2.5 pb-2 transition-all active:scale-95"
                data-ocid={`nav.${id}.tab`}
                style={{ minHeight: 83 }}
              >
                <motion.div
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={`w-7 h-7 flex items-center justify-center ${
                    isActive
                      ? id === "favorites"
                        ? "text-pink-400"
                        : "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  <Icon
                    className="w-6 h-6"
                    strokeWidth={isActive ? 2.2 : 1.6}
                  />
                </motion.div>
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    isActive
                      ? id === "favorites"
                        ? "text-pink-400"
                        : "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
        <div
          className="text-center py-1.5"
          style={{ borderTop: "0.5px solid oklch(var(--border) / 0.5)" }}
        >
          <p className="text-[10px] text-muted-foreground/60">
            © {new Date().getFullYear()} Built with ❤️{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/70 hover:text-primary transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </nav>

      {/* Full-screen Profile Takeover */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 70,
          opacity: showProfile ? 1 : 0,
          pointerEvents: showProfile ? "auto" : "none",
          transform: showProfile ? "scale(1)" : "scale(0.97)",
          transition: "opacity 0.25s ease, transform 0.25s ease",
          background: "oklch(var(--background))",
          overflowY: "auto",
        }}
        aria-hidden={!showProfile}
      >
        {/* Back button */}
        <div
          className="sticky top-0 z-10 ios-glass"
          style={{ borderBottom: "0.5px solid oklch(var(--border))" }}
        >
          <div className="max-w-lg mx-auto px-5 pt-4 pb-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowProfile(false)}
              className="flex items-center gap-2 text-sm font-semibold text-primary hover:opacity-80 transition-opacity"
              data-ocid="profile.close_button"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-base font-bold text-foreground">Profile</h1>
          </div>
        </div>
        <div className="max-w-lg mx-auto px-4 pt-4 pb-24">
          {showProfile && <ProfilePage onClose={() => setShowProfile(false)} />}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <InternetIdentityProvider>
        <UserProfileProvider>
          <FilterProvider>
            <AppContent />
            <Toaster />
          </FilterProvider>
        </UserProfileProvider>
      </InternetIdentityProvider>
    </QueryClientProvider>
  );
}

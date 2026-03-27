import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 18) return "Good Afternoon";
  return "Good Evening";
}

export default function GreetingOverlay() {
  const [visible, setVisible] = useState(true); // show immediately on mount
  const hasShownRef = useRef(false);
  const [isBirthday, setIsBirthday] = useState(false);
  const [turningAge, setTurningAge] = useState(0);

  // Read name and DOB straight from localStorage — no backend wait
  const firstName = (() => {
    try {
      const name = localStorage.getItem("colourclash_displayName") || "";
      return name.split(" ")[0] || "";
    } catch {
      return "";
    }
  })();

  useEffect(() => {
    // Birthday check
    try {
      const dob = localStorage.getItem("colourclash_dob");
      if (dob) {
        const dobDate = new Date(dob);
        const today = new Date();
        if (
          dobDate.getMonth() === today.getMonth() &&
          dobDate.getDate() === today.getDate()
        ) {
          setIsBirthday(true);
          setTurningAge(today.getFullYear() - dobDate.getFullYear());
        }
      }
    } catch {
      // ignore
    }

    // Show for 2.5 seconds then dismiss
    if (hasShownRef.current) return;
    hasShownRef.current = true;
    const timer = setTimeout(() => setVisible(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={
            isBirthday
              ? { background: "oklch(0.28 0.18 320)" }
              : { background: "oklch(0.28 0.18 255)" }
          }
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className="text-center px-8"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            {isBirthday ? (
              <>
                <p
                  className="font-display text-white/70 text-xl mb-2 tracking-wide"
                  style={{ fontStyle: "italic" }}
                >
                  🎂 Happy Birthday,
                </p>
                <h1 className="font-display font-bold text-white text-5xl tracking-tight">
                  {firstName || "You"}!
                </h1>
                <p className="font-display text-white/80 text-lg mt-3">
                  You&apos;re turning {turningAge} today
                </p>
              </>
            ) : (
              <>
                <p
                  className="font-display text-white/70 text-xl mb-2 tracking-wide"
                  style={{ fontStyle: "italic" }}
                >
                  {getGreeting()}
                  {firstName ? "," : ""}
                </p>
                {firstName && (
                  <h1 className="font-display font-bold text-white text-5xl tracking-tight">
                    {firstName}
                  </h1>
                )}
                {!firstName && (
                  <p className="font-display text-white/60 text-lg mt-2">
                    Welcome to Colour Clash
                  </p>
                )}
              </>
            )}
            <div className="mt-8 flex justify-center gap-2">
              {[
                "#FF3B30",
                "#FF9500",
                "#FFCC00",
                "#34C759",
                "#0A84FF",
                "#BF5AF2",
              ].map((color, i) => (
                <motion.div
                  key={color}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

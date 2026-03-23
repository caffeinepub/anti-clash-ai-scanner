import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useUserProfile } from "../context/UserProfileContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 18) return "Good Afternoon";
  return "Good Evening";
}

export default function GreetingOverlay() {
  const [visible, setVisible] = useState(false);
  const hasShownRef = useRef(false);
  const [isBirthday, setIsBirthday] = useState(false);
  const [turningAge, setTurningAge] = useState(0);
  const { userProfile } = useUserProfile();
  const { identity } = useInternetIdentity();

  const isLoggedIn = identity && !identity.getPrincipal().isAnonymous();
  const firstName = userProfile?.displayName?.split(" ")[0] ?? "";

  useEffect(() => {
    const dob = localStorage.getItem("colourclash_dob");
    if (dob) {
      const dobDate = new Date(dob);
      const today = new Date();
      if (
        dobDate.getMonth() === today.getMonth() &&
        dobDate.getDate() === today.getDate()
      ) {
        setIsBirthday(true);
        const age = today.getFullYear() - dobDate.getFullYear();
        setTurningAge(age);
      }
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !firstName || hasShownRef.current) return;
    hasShownRef.current = true;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 2500);
    return () => clearTimeout(timer);
  }, [isLoggedIn, firstName]);

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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className="text-center px-8"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ delay: 0.15, duration: 0.5 }}
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
                  {firstName}!
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
                  {getGreeting()},
                </p>
                <h1 className="font-display font-bold text-white text-5xl tracking-tight">
                  {firstName}
                </h1>
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
                  transition={{ delay: 0.4 + i * 0.08 }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { createContext, useContext, useEffect, useState } from "react";

export type Gender = "male" | "female";
export type AgeGroup = "kid" | "teenage" | "young" | "adult" | "senior";

interface FilterState {
  gender: Gender;
  age: AgeGroup;
  size: string;
  aiPlatform: string;
  setGender: (g: Gender) => void;
  setAge: (a: AgeGroup) => void;
  setSize: (s: string) => void;
  setAiPlatform: (ai: string) => void;
}

const FilterContext = createContext<FilterState | null>(null);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [gender, setGenderState] = useState<Gender>(() => {
    const saved = localStorage.getItem("cc_filter_gender");
    // Also check profile gender
    const profileGender = localStorage.getItem("cc_profile_gender");
    if (saved === "male" || saved === "female") return saved;
    if (profileGender === "men") return "male";
    if (profileGender === "women") return "female";
    return "male";
  });

  const [age, setAgeState] = useState<AgeGroup>(() => {
    const saved = localStorage.getItem("cc_filter_age");
    if (
      saved === "kid" ||
      saved === "teenage" ||
      saved === "young" ||
      saved === "adult" ||
      saved === "senior"
    )
      return saved;
    return "young";
  });

  const [size, setSizeState] = useState<string>(
    () => localStorage.getItem("cc_filter_size") ?? "M",
  );

  const [aiPlatform, setAiPlatformState] = useState<string>(
    () => localStorage.getItem("cc_filter_ai") ?? "",
  );

  // Sync gender from profile changes
  useEffect(() => {
    const handler = () => {
      const profileGender = localStorage.getItem("cc_profile_gender");
      if (profileGender === "men") setGenderState("male");
      else if (profileGender === "women") setGenderState("female");
    };
    window.addEventListener("profileNameUpdated", handler);
    return () => window.removeEventListener("profileNameUpdated", handler);
  }, []);

  const setGender = (g: Gender) => {
    setGenderState(g);
    localStorage.setItem("cc_filter_gender", g);
  };

  const setAge = (a: AgeGroup) => {
    setAgeState(a);
    localStorage.setItem("cc_filter_age", a);
  };

  const setSize = (s: string) => {
    setSizeState(s);
    localStorage.setItem("cc_filter_size", s);
  };

  const setAiPlatform = (ai: string) => {
    setAiPlatformState(ai);
    localStorage.setItem("cc_filter_ai", ai);
  };

  return (
    <FilterContext.Provider
      value={{
        gender,
        age,
        size,
        aiPlatform,
        setGender,
        setAge,
        setSize,
        setAiPlatform,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters(): FilterState {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters must be used inside FilterProvider");
  return ctx;
}

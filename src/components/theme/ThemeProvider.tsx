"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { updateThemePreference } from "@/lib/actions/goals";
import type { ThemePreference } from "@/lib/preferences";

export type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  resolved: ResolvedTheme;
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function normalizePreference(pref: ThemePreference): ResolvedTheme {
  if (pref === "dark") return "dark";
  return "light";
}

function applyDomTheme(resolved: ResolvedTheme) {
  document.documentElement.classList.toggle("dark", resolved === "dark");
  try {
    localStorage.setItem("tasky-theme", resolved);
  } catch {
    /* ignore */
  }
}

type ThemeProviderProps = {
  initialPreference: ThemePreference;
  children: ReactNode;
};

export function ThemeProvider({ initialPreference, children }: ThemeProviderProps) {
  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    normalizePreference(initialPreference),
  );

  useEffect(() => {
    const next = normalizePreference(initialPreference);
    setResolved(next);
    applyDomTheme(next);
  }, [initialPreference]);

  const toggleTheme = useCallback(() => {
    setResolved((prev) => {
      const next: ResolvedTheme = prev === "dark" ? "light" : "dark";
      applyDomTheme(next);
      void updateThemePreference(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      resolved,
      isDark: resolved === "dark",
      toggleTheme,
    }),
    [resolved, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

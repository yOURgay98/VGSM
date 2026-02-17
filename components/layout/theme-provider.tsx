"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { NavigationSessionTracker } from "@/components/layout/navigation-session-tracker";

type Theme = "light" | "dark" | "gray";
type Accent = "blue" | "teal" | "graphite" | "custom";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: Theme;
  setTheme: (theme: Theme) => void;
  accent: Accent;
  setAccent: (accent: Accent) => void;
  customAccent: string | null;
  setCustomAccent: (accent: string | null) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STORAGE_KEY = "erlc_theme";
const THEME_COOKIE_KEY = "erlc_theme";
const ACCENT_STORAGE_KEY = "erlc_accent";
const ACCENT_COOKIE_KEY = "erlc_accent";
const ACCENT_CUSTOM_STORAGE_KEY = "erlc_accent_custom";
const ACCENT_CUSTOM_COOKIE_KEY = "erlc_accent_custom";

function normalizeTheme(raw: string | null | undefined): Theme {
  return raw === "dark" || raw === "gray" ? raw : "light";
}

function normalizeAccent(raw: string | null | undefined): Accent {
  if (raw === "teal" || raw === "graphite" || raw === "custom") return raw;
  return "blue";
}

function normalizeAccentHex(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  const match = /^#?[0-9a-fA-F]{6}$/.test(value);
  if (!match) return null;
  return value.startsWith("#") ? value.toLowerCase() : `#${value.toLowerCase()}`;
}

export function ThemeProvider({
  children,
  initialTheme,
  initialAccent,
  initialCustomAccent,
}: {
  children: React.ReactNode;
  initialTheme?: Theme;
  initialAccent?: Accent;
  initialCustomAccent?: string | null;
}) {
  const [theme, setThemeState] = useState<Theme>(() => normalizeTheme(initialTheme));
  const [accent, setAccentState] = useState<Accent>(() => normalizeAccent(initialAccent));
  const [customAccent, setCustomAccentState] = useState<string | null>(() =>
    normalizeAccentHex(initialCustomAccent),
  );
  const resolvedTheme = theme;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;

    try {
      localStorage.setItem(THEME_STORAGE_KEY, resolvedTheme);
    } catch {
      // Ignore write errors (private mode / blocked).
    }

    // Persist to a cookie so SSR can render with the correct theme and avoid hydration issues.
    try {
      document.cookie = `${THEME_COOKIE_KEY}=${resolvedTheme}; Path=/; Max-Age=31536000; SameSite=Lax`;
    } catch {
      // Ignore cookie errors.
    }
  }, [resolvedTheme]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.accent = accent;

    if (accent === "custom") {
      const value = normalizeAccentHex(customAccent);
      if (value) {
        root.style.setProperty("--accent", value);
      } else {
        root.style.removeProperty("--accent");
      }
    } else {
      root.style.removeProperty("--accent");
    }

    try {
      localStorage.setItem(ACCENT_STORAGE_KEY, accent);
      if (accent === "custom") {
        if (customAccent) localStorage.setItem(ACCENT_CUSTOM_STORAGE_KEY, customAccent);
        else localStorage.removeItem(ACCENT_CUSTOM_STORAGE_KEY);
      }
    } catch {
      // Ignore.
    }

    try {
      document.cookie = `${ACCENT_COOKIE_KEY}=${accent}; Path=/; Max-Age=31536000; SameSite=Lax`;
      if (accent === "custom" && customAccent) {
        document.cookie = `${ACCENT_CUSTOM_COOKIE_KEY}=${customAccent}; Path=/; Max-Age=31536000; SameSite=Lax`;
      } else {
        document.cookie = `${ACCENT_CUSTOM_COOKIE_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
      }
    } catch {
      // Ignore.
    }
  }, [accent, customAccent]);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme: setThemeState,
      accent,
      setAccent: setAccentState,
      customAccent,
      setCustomAccent: setCustomAccentState,
    }),
    [theme, resolvedTheme, accent, customAccent],
  );

  return (
    <ThemeContext.Provider value={value}>
      <NavigationSessionTracker />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider.");
  }

  return context;
}

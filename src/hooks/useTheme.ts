// Gestioneaza tema (light / dark). Preferinta se salveaza local si persista
// intre sesiuni. Prima data respectam preferinta sistemului de operare.

import { useCallback, useEffect, useState } from "react";
import type { ThemeMode } from "../types";

const STORAGE_KEY = "quicktasks.theme";

function initialTheme(): ThemeMode {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(initialTheme);

  // Aplicam tema pe elementul <html> si o salvam.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  return { theme, setTheme, toggle };
}

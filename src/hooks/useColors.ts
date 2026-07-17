// Personalizarea culorilor. Fiecare culoare a interfetei e o variabila CSS;
// aici permitem suprascrierea lor, live, salvata separat pentru tema deschisa
// si cea intunecata. Cand nu exista suprascriere, se foloseste valoarea din
// stylesheet (deci "Reseteaza" readuce culorile originale).

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ThemeMode } from "../types";

const STORAGE_KEY = "quicktasks.colors";

export interface ColorToken {
  key: string; // numele variabilei fara "--"
  labelKey: string; // cheia de traducere
  defaults: Record<ThemeMode, string>;
}

// Elementele personalizabile, cu valorile implicite din styles.css.
export const COLOR_TOKENS: ColorToken[] = [
  { key: "bg", labelKey: "color.bg", defaults: { light: "#fbfbfd", dark: "#131317" } },
  { key: "surface", labelKey: "color.surface", defaults: { light: "#ffffff", dark: "#1c1c22" } },
  { key: "surface-2", labelKey: "color.surface-2", defaults: { light: "#f3f3f8", dark: "#26262e" } },
  { key: "border", labelKey: "color.border", defaults: { light: "#ececf2", dark: "#2a2a33" } },
  { key: "text", labelKey: "color.text", defaults: { light: "#1b1b22", dark: "#ececf2" } },
  { key: "text-muted", labelKey: "color.text-muted", defaults: { light: "#8a8a99", dark: "#82828f" } },
  { key: "accent", labelKey: "color.accent", defaults: { light: "#4f6df5", dark: "#7c90ff" } },
  { key: "xp-fill", labelKey: "color.xp-fill", defaults: { light: "#4f6df5", dark: "#7c90ff" } },
  { key: "done-text", labelKey: "color.done-text", defaults: { light: "#a6a6b2", dark: "#6a6a76" } },
  { key: "warn", labelKey: "color.warn", defaults: { light: "#d98a25", dark: "#e9a94a" } },
  { key: "danger", labelKey: "color.danger", defaults: { light: "#e5484d", dark: "#f16a6e" } },
];

type Overrides = Record<string, string>;
type Store = Record<ThemeMode, Overrides>;

function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        light: parsed.light ?? {},
        dark: parsed.dark ?? {},
      };
    }
  } catch {
    /* ignoram valori corupte */
  }
  return { light: {}, dark: {} };
}

/** Transforma #rrggbb intr-un rgba() translucid, pentru variantele "soft". */
function hexToRgba(hex: string, alpha: number): string {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function useColors(theme: ThemeMode) {
  const [store, setStore] = useState<Store>(loadStore);

  // Aplica pe <html> suprascrierile temei curente; sterge cele fara valoare
  // (ca sa cada pe valoarea implicita din CSS).
  useEffect(() => {
    const root = document.documentElement;
    const ov = store[theme];
    for (const token of COLOR_TOKENS) {
      const val = ov[token.key];
      if (val) {
        root.style.setProperty(`--${token.key}`, val);
        if (token.key === "accent")
          root.style.setProperty("--accent-soft", hexToRgba(val, 0.14));
        if (token.key === "danger")
          root.style.setProperty("--danger-soft", hexToRgba(val, 0.15));
      } else {
        root.style.removeProperty(`--${token.key}`);
        if (token.key === "accent") root.style.removeProperty("--accent-soft");
        if (token.key === "danger") root.style.removeProperty("--danger-soft");
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store, theme]);

  // Culoarea efectiva a unui element (suprascriere sau implicit), pentru picker.
  const getColor = useCallback(
    (key: string): string => {
      const ov = store[theme][key];
      if (ov) return ov;
      const token = COLOR_TOKENS.find((t) => t.key === key);
      return token ? token.defaults[theme] : "#000000";
    },
    [store, theme]
  );

  const setColor = useCallback(
    (key: string, hex: string) => {
      setStore((s) => ({ ...s, [theme]: { ...s[theme], [key]: hex } }));
    },
    [theme]
  );

  const resetColors = useCallback(() => {
    setStore((s) => ({ ...s, [theme]: {} }));
  }, [theme]);

  const customized = useMemo(
    () => Object.keys(store[theme]).length > 0,
    [store, theme]
  );

  return { tokens: COLOR_TOKENS, getColor, setColor, resetColors, customized };
}

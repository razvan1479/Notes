// Contextul de limba. Ofera limba curenta, functia de traducere t(), locale-ul
// pentru formatarea datelor si setarea limbii (salvata local, implicit engleza).

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { translations, type Lang } from "./translations";

const STORAGE_KEY = "quicktasks.lang";

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  locale: string; // pentru toLocaleString (ex. "en-US" / "ro-RO")
}

const I18nContext = createContext<I18nValue | null>(null);

function initialLang(): Lang {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "en" || saved === "ro") return saved;
  return "en"; // implicit engleza
}

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) =>
    k in vars ? String(vars[k]) : `{${k}}`
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = translations[lang] ?? translations.en;
      const str = dict[key] ?? translations.en[key] ?? key;
      return interpolate(str, vars);
    },
    [lang]
  );

  const locale = lang === "ro" ? "ro-RO" : "en-US";

  const value = useMemo<I18nValue>(
    () => ({ lang, setLang, t, locale }),
    [lang, setLang, t, locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n trebuie folosit in interiorul <I18nProvider>");
  return ctx;
}

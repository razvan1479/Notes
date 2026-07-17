// Personalizarea scrisului: fontul si marimea textului din note.
// Se aplica prin variabile CSS si se salveaza local (persista intre sesiuni).
// Fonturile sunt doar din cele deja instalate in Windows, ca sa ramanem offline.

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "quicktasks.type";

export interface FontOption {
  id: string;
  label: string;
  stack: string; // gol pentru fontul implicit al aplicatiei
}

export const FONT_OPTIONS: FontOption[] = [
  { id: "system", label: "System", stack: "" },
  { id: "verdana", label: "Verdana", stack: "Verdana, Geneva, sans-serif" },
  { id: "georgia", label: "Georgia", stack: "Georgia, 'Times New Roman', serif" },
  { id: "consolas", label: "Consolas", stack: "Consolas, 'Courier New', monospace" },
  { id: "comic", label: "Comic Sans", stack: "'Comic Sans MS', 'Comic Sans', cursive" },
];

export const MIN_SIZE = 14;
export const MAX_SIZE = 24;
const DEFAULT_SIZE = 17;

interface TypeState {
  font: string; // id-ul fontului
  size: number; // px
}

function loadState(): TypeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        font: typeof p.font === "string" ? p.font : "system",
        size: typeof p.size === "number" ? p.size : DEFAULT_SIZE,
      };
    }
  } catch {
    /* ignoram */
  }
  return { font: "system", size: DEFAULT_SIZE };
}

export function useTypography() {
  const [state, setState] = useState<TypeState>(loadState);

  useEffect(() => {
    const root = document.documentElement;
    const opt = FONT_OPTIONS.find((f) => f.id === state.font);
    if (opt && opt.stack) root.style.setProperty("--app-font", opt.stack);
    else root.style.removeProperty("--app-font"); // fontul implicit din CSS
    root.style.setProperty("--task-font-size", `${state.size}px`);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setFont = useCallback((font: string) => {
    setState((s) => ({ ...s, font }));
  }, []);

  const setSize = useCallback((size: number) => {
    setState((s) => ({ ...s, size }));
  }, []);

  const reset = useCallback(() => {
    setState({ font: "system", size: DEFAULT_SIZE });
  }, []);

  return { ...state, fonts: FONT_OPTIONS, setFont, setSize, reset };
}

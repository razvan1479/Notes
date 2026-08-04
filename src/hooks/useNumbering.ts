// Stilul de numerotare a task-urilor active. Persista local.
//   "off"   -> fara numere (implicit)
//   "plain" -> numar simplu, discret, in stanga
//   "badge" -> bulina cu numar, in accent
//   "ghost" -> numar mare, foarte discret (fantoma)

import { useEffect, useState } from "react";

export type NumberingStyle = "off" | "plain" | "badge" | "ghost";

const STORAGE_KEY = "quicktasks.numbering";

function initial(): NumberingStyle {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "plain" || saved === "badge" || saved === "ghost" || saved === "off") {
    return saved;
  }
  return "off";
}

export function useNumbering() {
  const [numbering, setNumbering] = useState<NumberingStyle>(initial);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, numbering);
  }, [numbering]);

  return { numbering, setNumbering };
}

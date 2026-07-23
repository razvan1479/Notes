// Tine minte pana la ce versiune a citit utilizatorul noutatile.
//
// Retinem O SINGURA versiune ("cea mai noua vazuta"), nu o lista. Asa, cand
// adaugam in istoric versiuni vechi, ele NU devin brusc "necitite" — se arata
// doar ce e mai nou decat ce a vazut deja.

import { useCallback, useEffect, useState } from "react";
import { CHANGELOG } from "../changelog";

const STORAGE_KEY = "quicktasks.changelog.seen";
const LEGACY_KEY = "quicktasks.changelog.read"; // formatul vechi (lista)

/** Compara doua versiuni de forma X.Y.Z. >0 daca a e mai noua decat b. */
function cmpVersion(a: string, b: string): number {
  const pa = a.split(".").map((n) => Number(n) || 0);
  const pb = b.split(".").map((n) => Number(n) || 0);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

const newestVersion = (): string | null =>
  CHANGELOG.length ? CHANGELOG[0].version : null;

function loadSeen(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as string;

    // Migrare din formatul vechi: luam cea mai noua versiune din lista citita.
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const arr = JSON.parse(legacy);
      if (Array.isArray(arr) && arr.length) {
        return arr.map(String).sort(cmpVersion).slice(-1)[0];
      }
    }
  } catch {
    /* ignoram */
  }
  // Instalare noua: pornim de la versiunea curenta, ca sa nu apara un pop-up
  // cu tot istoricul la prima deschidere.
  return newestVersion();
}

export function useChangelog() {
  const [seen, setSeen] = useState<string | null>(loadSeen);

  useEffect(() => {
    if (seen != null) localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
  }, [seen]);

  /** Doar versiunile mai noi decat ce a vazut deja utilizatorul. */
  const unread = CHANGELOG.filter(
    (e) => seen == null || cmpVersion(e.version, seen) > 0
  );
  const unreadCount = unread.length;

  const isRead = useCallback(
    (version: string) => seen != null && cmpVersion(version, seen) <= 0,
    [seen]
  );

  /** Marcheaza totul ca citit (dupa "Am inteles"). */
  const markAllRead = useCallback(() => {
    const newest = newestVersion();
    if (newest) setSeen(newest);
  }, []);

  return { isRead, unread, unreadCount, markAllRead };
}

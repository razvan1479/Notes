// Tine minte ce versiuni din istoric au fost citite, ca la mesaje: cele
// necitite au bulina. Se salveaza local si persista intre sesiuni.

import { useCallback, useEffect, useState } from "react";
import { CHANGELOG } from "../changelog";

const STORAGE_KEY = "quicktasks.changelog.read";

function loadRead(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    }
  } catch {
    /* ignoram */
  }
  return [];
}

export function useChangelog() {
  const [read, setRead] = useState<string[]>(loadRead);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(read));
  }, [read]);

  const isRead = useCallback((version: string) => read.includes(version), [read]);

  /** Versiunile inca necitite (pentru pop-up-ul de dupa update). */
  const unread = CHANGELOG.filter((e) => !read.includes(e.version));
  const unreadCount = unread.length;

  /** Marcheaza toate versiunile ca citite (la deschiderea istoricului). */
  const markAllRead = useCallback(() => {
    setRead(CHANGELOG.map((e) => e.version));
  }, []);

  return { isRead, unread, unreadCount, markAllRead };
}

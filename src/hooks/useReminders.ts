// Verifica periodic daca vreun task are un reminder ajuns la scadenta. Cand da,
// cheama onDue cu task-urile respective (pentru pop-up-ul in stil Outlook) si
// trimite si o notificare nativa (utila cand fereastra e ascunsa in tray).
// Nu re-declanseaza acelasi memento cat timp e inca "activ"; dupa ce e rezolvat
// (Inchis = reminder null, Amanat = data viitoare), poate fi declansat din nou.

import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import type { Task } from "../types";

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

const CHECK_MS = 15_000;

export function useReminders(
  tasksRef: MutableRefObject<Task[]>,
  onDue: (tasks: Task[]) => void,
  title: string
) {
  const surfacedRef = useRef<Set<number>>(new Set());
  const grantedRef = useRef(false);

  useEffect(() => {
    if (!isTauri()) return;
    (async () => {
      try {
        grantedRef.current = await isPermissionGranted();
        if (!grantedRef.current)
          grantedRef.current = (await requestPermission()) === "granted";
      } catch {
        /* ignoram */
      }
    })();

    const check = () => {
      const now = Date.now();
      const tasks = tasksRef.current;
      const surfaced = surfacedRef.current;

      // Scoatem din "surfaced" mementourile care nu mai sunt scadente (rezolvate,
      // amanate in viitor sau task-ul a disparut) — ca sa poata reaparea ulterior.
      for (const id of Array.from(surfaced)) {
        const t = tasks.find((x) => x.id === id);
        if (!t || t.completed || t.reminderAt == null || t.reminderAt > now) {
          surfaced.delete(id);
        }
      }

      const newly = tasks.filter(
        (t) =>
          t.reminderAt != null &&
          t.reminderAt <= now &&
          !t.completed &&
          !surfaced.has(t.id)
      );
      if (newly.length) {
        for (const t of newly) {
          surfaced.add(t.id);
          if (grantedRef.current) {
            try {
              sendNotification({ title, body: t.text || "…" });
            } catch {
              /* ignoram */
            }
          }
        }
        onDue(newly);
      }
    };

    const interval = window.setInterval(check, CHECK_MS);
    const initial = window.setTimeout(check, 1500);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(initial);
    };
  }, [tasksRef, onDue, title]);
}

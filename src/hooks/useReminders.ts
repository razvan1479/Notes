// Verifica periodic daca vreun task are un reminder ajuns la scadenta si
// declanseaza o notificare nativa Windows. Dupa declansare, reminderul e sters
// (memento unic). Cere permisiunea de notificari o singura data, la pornire.

import { useEffect } from "react";
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
  onFired: (id: number) => void,
  title: string
) {
  useEffect(() => {
    if (!isTauri()) return;

    let granted = false;
    (async () => {
      try {
        granted = await isPermissionGranted();
        if (!granted) granted = (await requestPermission()) === "granted";
      } catch {
        /* ignoram */
      }
    })();

    const check = () => {
      const now = Date.now();
      const due = tasksRef.current.filter(
        (t) => t.reminderAt != null && t.reminderAt <= now && !t.completed
      );
      for (const task of due) {
        if (granted) {
          try {
            sendNotification({ title, body: task.text || "…" });
          } catch {
            /* ignoram erorile de notificare */
          }
        }
        onFired(task.id); // sterge reminderul (unic)
      }
    };

    const id = window.setInterval(check, CHECK_MS);
    // O verificare imediata la pornire (memento-uri ratate cat a fost inchisa).
    const t = window.setTimeout(check, 1500);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(t);
    };
  }, [tasksRef, onFired, title]);
}

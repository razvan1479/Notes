// Scurtaturi globale de tastatura. Cele care ar interfera cu scrisul
// (Delete, Space) sunt ignorate cand cursorul e intr-un camp editabil.

import { useEffect } from "react";

interface HotkeyHandlers {
  onNewTask: () => void; // Ctrl + N
  onSearch: () => void; // Ctrl + F
  onDeleteSelected: () => void; // Delete
  onToggleSelected: () => void; // Space
}

function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
}

export function useHotkeys(handlers: HotkeyHandlers) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      // Ctrl + N -> task nou (functioneaza oriunde).
      if (ctrl && e.key.toLowerCase() === "n") {
        e.preventDefault();
        handlers.onNewTask();
        return;
      }
      // Ctrl + F -> cautare (functioneaza oriunde).
      if (ctrl && e.key.toLowerCase() === "f") {
        e.preventDefault();
        handlers.onSearch();
        return;
      }

      // De aici in jos, ignoram daca utilizatorul scrie intr-un camp.
      if (isEditableTarget(e.target)) return;

      // Delete -> sterge task-ul selectat.
      if (e.key === "Delete") {
        e.preventDefault();
        handlers.onDeleteSelected();
        return;
      }
      // Space -> bifeaza / debifeaza task-ul selectat.
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        handlers.onToggleSelected();
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlers]);
}

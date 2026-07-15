// Hook central care gestioneaza toata starea task-urilor:
// incarcare, adaugare, editare, bifare, stergere, reordonare si
// "maturarea" automata a task-urilor bifate mai vechi de 8h.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Task } from "../types";
import {
  addTask as dbAdd,
  deleteExpiredTasks,
  deleteTask as dbDelete,
  getAllTasks,
  persistOrder,
  setTaskCompleted,
  setTaskPriority,
  updateTaskText,
} from "../db/database";
import { isExpired } from "../lib/time";

/** Cat de des verificam expirarea si actualizam countdown-urile (ms). */
const TICK_MS = 10_000;

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  /** "Ceasul" partajat; schimbarea lui reactualizeaza countdown-urile din UI. */
  const [now, setNow] = useState<number>(Date.now());

  // Incarcarea initiala: mai intai curatam ce a expirat cat a fost aplicatia
  // inchisa, apoi aducem lista din baza de date.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await deleteExpiredTasks();
        const all = await getAllTasks();
        if (alive) setTasks(all);
      } catch (err) {
        console.error("Eroare la incarcarea task-urilor:", err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Bataia de ceas: la fiecare TICK_MS actualizam "now" (pentru countdown)
  // si stergem task-urile care tocmai au depasit 8h. Ruleaza si cand
  // fereastra e ascunsa in tray, pentru ca webview-ul ramane activ.
  useEffect(() => {
    const tick = () => {
      const t = Date.now();
      setNow(t);
      setTasks((prev) => {
        const survivors = prev.filter((task) => !isExpired(task.completedAt, t));
        if (survivors.length !== prev.length) {
          // Curatam si in baza de date (fire-and-forget, acelasi prag de timp).
          void deleteExpiredTasks(t);
          return survivors;
        }
        return prev;
      });
    };
    const id = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  const add = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const task = await dbAdd(trimmed);
    setTasks((prev) => [...prev, task]);
  }, []);

  const editText = useCallback(async (id: number, text: string) => {
    const trimmed = text.trim();
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, text: trimmed } : t)));
    await updateTaskText(id, trimmed);
  }, []);

  const toggle = useCallback(async (id: number) => {
    let nextCompleted = false;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        nextCompleted = !t.completed;
        return {
          ...t,
          completed: nextCompleted,
          completedAt: nextCompleted ? Date.now() : null,
        };
      })
    );
    await setTaskCompleted(id, nextCompleted);
  }, []);

  const remove = useCallback(async (id: number) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await dbDelete(id);
  }, []);

  const togglePriority = useCallback(async (id: number) => {
    let next = false;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        next = !t.priority;
        return { ...t, priority: next };
      })
    );
    await setTaskPriority(id, next);
  }, []);

  /** Reordoneaza task-urile active dupa drag & drop si salveaza pozitiile. */
  const reorderActive = useCallback(
    async (orderedActiveIds: number[]) => {
      // Reconstruim lista completa: intai activele in noua ordine, apoi cele bifate.
      setTasks((prev) => {
        const byId = new Map(prev.map((t) => [t.id, t]));
        const reordered = orderedActiveIds
          .map((id) => byId.get(id))
          .filter((t): t is Task => Boolean(t));
        const completed = prev.filter((t) => t.completed);
        const merged = [...reordered, ...completed].map((t, i) => ({ ...t, position: i }));
        // Persistam ordinea completa in fundal.
        void persistOrder(merged.map((t) => t.id));
        return merged;
      });
    },
    []
  );

  // Pastram o referinta la ultimele task-uri pentru consumatori care au
  // nevoie de valoarea curenta fara sa declanseze re-render.
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  return {
    tasks,
    loading,
    now,
    add,
    editText,
    toggle,
    remove,
    togglePriority,
    reorderActive,
    tasksRef,
  };
}

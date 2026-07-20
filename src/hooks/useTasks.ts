// Hook central care gestioneaza toata starea task-urilor:
// incarcare, adaugare, editare, bifare, stergere, reordonare si
// "maturarea" automata a task-urilor bifate mai vechi de 4h.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Task } from "../types";
import {
  addTask as dbAdd,
  deleteExpiredTasks,
  deleteAllTasks,
  deleteTask as dbDelete,
  getAllTasks,
  persistOrder,
  setTaskCompleted,
  setTaskPriority,
  setTaskReminder,
  setTaskScheduled,
  updateTaskText,
} from "../db/database";
import { isExpired } from "../lib/time";

/** Cat de des verificam expirarea si actualizam countdown-urile (ms). */
const TICK_MS = 10_000;

export function useTasks(onBonus?: (count: number) => void) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  /** "Ceasul" partajat; schimbarea lui reactualizeaza countdown-urile din UI. */
  const [now, setNow] = useState<number>(Date.now());

  // Referinta mereu-actuala la lista de task-uri. O folosim ca sa citim
  // valoarea curenta SINCRON in handlere, fara sa depindem de momentul in care
  // ruleaza functia de actualizare a starii (care ruleaza mai tarziu, la render).
  const tasksRef = useRef<Task[]>([]);
  tasksRef.current = tasks;

  // Callback pentru bonusul de angajament, tinut intr-un ref ca sa fie mereu actual.
  const onBonusRef = useRef<((count: number) => void) | undefined>(onBonus);
  onBonusRef.current = onBonus;

  // Incarcarea initiala: mai intai curatam ce a expirat cat a fost aplicatia
  // inchisa (acordand bonusul pentru cele eligibile), apoi aducem lista.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const bonus = await deleteExpiredTasks();
        if (bonus > 0) onBonusRef.current?.(bonus);
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
  // si stergem task-urile care tocmai au depasit 4h. Ruleaza si cand
  // fereastra e ascunsa in tray, pentru ca webview-ul ramane activ.
  useEffect(() => {
    const tick = async () => {
      const t = Date.now();
      setNow(t);
      const survivors = tasksRef.current.filter(
        (task) => !isExpired(task.completedAt, t)
      );
      if (survivors.length !== tasksRef.current.length) {
        const bonus = await deleteExpiredTasks(t);
        if (bonus > 0) onBonusRef.current?.(bonus);
        setTasks(survivors);
      }
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

  /** Adauga un task programat pe o data (pentru calendar, FARA alarma/pop-up)
      si, optional, prioritar. */
  const addScheduled = useCallback(
    async (text: string, scheduledAt: number, priority = false) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const task = await dbAdd(trimmed);
      await setTaskScheduled(task.id, scheduledAt);
      if (priority) await setTaskPriority(task.id, true);
      setTasks((prev) => [...prev, { ...task, scheduledAt, priority }]);
    },
    []
  );

  /** Adauga un task cu memento (alarma + pop-up) la un moment exact si, optional,
      prioritar (din calendar, cand pui semnul exclamarii). */
  const addWithReminder = useCallback(
    async (text: string, reminderAt: number, priority = false) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const task = await dbAdd(trimmed);
      await setTaskReminder(task.id, reminderAt);
      if (priority) await setTaskPriority(task.id, true);
      setTasks((prev) => [...prev, { ...task, reminderAt, priority }]);
    },
    []
  );

  const editText = useCallback(async (id: number, text: string) => {
    const trimmed = text.trim();
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, text: trimmed } : t)));
    await updateTaskText(id, trimmed);
  }, []);

  const toggle = useCallback(async (id: number) => {
    // Calculam valoarea urmatoare din starea CURENTA (sincron), apoi o folosim
    // atat pentru UI cat si pentru baza de date. Asa DB-ul primeste valoarea corecta.
    const current = tasksRef.current.find((t) => t.id === id);
    if (!current) return;
    const nextCompleted = !current.completed;
    const completedAt = nextCompleted ? Date.now() : null;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, completed: nextCompleted, completedAt } : t
      )
    );
    await setTaskCompleted(id, nextCompleted);
  }, []);

  const togglePriority = useCallback(async (id: number) => {
    const current = tasksRef.current.find((t) => t.id === id);
    if (!current) return;
    const next = !current.priority;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, priority: next } : t)));
    await setTaskPriority(id, next);
  }, []);

  /** Seteaza sau sterge (null) reminderul unui task. */
  const setReminder = useCallback(async (id: number, reminderAt: number | null) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, reminderAt } : t)));
    await setTaskReminder(id, reminderAt);
  }, []);

  const remove = useCallback(async (id: number) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await dbDelete(id);
  }, []);

  /** Sterge toate task-urile (reset total). */
  const resetAll = useCallback(async () => {
    setTasks([]);
    await deleteAllTasks();
  }, []);

  /** Reordoneaza task-urile active dupa drag & drop si salveaza pozitiile. */
  const reorderActive = useCallback(async (orderedActiveIds: number[]) => {
    const prev = tasksRef.current;
    const byId = new Map(prev.map((t) => [t.id, t]));
    const reordered = orderedActiveIds
      .map((id) => byId.get(id))
      .filter((t): t is Task => Boolean(t));
    const completed = prev.filter((t) => t.completed);
    const merged = [...reordered, ...completed].map((t, i) => ({ ...t, position: i }));
    setTasks(merged);
    await persistOrder(merged.map((t) => t.id));
  }, []);

  return {
    tasks,
    loading,
    now,
    add,
    addScheduled,
    addWithReminder,
    editText,
    toggle,
    remove,
    togglePriority,
    setReminder,
    resetAll,
    reorderActive,
    tasksRef,
  };
}

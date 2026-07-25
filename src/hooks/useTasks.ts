// Hook central care gestioneaza toata starea task-urilor:
// incarcare, adaugare, editare, bifare, stergere, reordonare si
// "maturarea" automata a task-urilor bifate mai vechi de 3h.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Task, Recurrence } from "../types";
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
  setTaskNote,
  setTaskRecurrence,
  addSubtask as dbAddSubtask,
  setSubtaskDone,
  updateSubtaskText,
  deleteSubtask as dbDeleteSubtask,
  bumpDailyCompleted,
  updateTaskText,
} from "../db/database";
import { isExpired } from "../lib/time";

/** Cat de des actualizam "now" (countdown live, din secunda in secunda). */
const TICK_MS = 1000;


/** Ziua locala ca YYYY-MM-DD (pentru statistici). */
function localDay(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Urmatoarea data pentru un task recurent, pornind de la data curenta. */
/**
 * Urmatoarea data pentru un task recurent.
 * - daily / weekly: +1 zi / +7 zile.
 * - monthly: pastreaza ziua ORIGINALA (anchorDay). Daca luna urmatoare nu are
 *   ziua respectiva (ex. 31 in februarie), cade pe ultima zi a lunii; cand o
 *   luna are din nou ziua originala, revine la ea (ex. 31 ian -> 28/29 feb ->
 *   31 mar). anchorDay implicit = ziua din data `from`.
 */
function nextRecurrence(from: number, rec: Recurrence, anchorDay?: number): number {
  const d = new Date(from);
  if (rec === "daily") {
    d.setDate(d.getDate() + 1);
  } else if (rec === "weekly") {
    d.setDate(d.getDate() + 7);
  } else if (rec === "monthly") {
    const day = anchorDay ?? d.getDate();
    const y = d.getFullYear();
    const m = d.getMonth() + 1; // luna urmatoare (0-index -> +1)
    const lastDay = new Date(y, m + 1, 0).getDate(); // ultima zi a lunii urmatoare
    d.setFullYear(y, m, Math.min(day, lastDay));
  }
  return d.getTime();
}

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
  // si stergem task-urile care tocmai au depasit 3h. Ruleaza si cand
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
    async (
      text: string,
      scheduledAt: number,
      priority = false,
      recurrence: Recurrence | null = null
    ) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const task = await dbAdd(trimmed);
      await setTaskScheduled(task.id, scheduledAt);
      if (priority) await setTaskPriority(task.id, true);
      const anchor = recurrence === "monthly" ? new Date(scheduledAt).getDate() : null;
      if (recurrence) await setTaskRecurrence(task.id, recurrence, anchor);
      setTasks((prev) => [
        ...prev,
        { ...task, scheduledAt, priority, recurrence, recurAnchor: anchor },
      ]);
    },
    []
  );

  /** Adauga un task cu memento (alarma + pop-up) la un moment exact si, optional,
      prioritar (din calendar, cand pui semnul exclamarii). scheduledAt tine
      task-ul ascuns din lista principala pana ii vine ziua. */
  const addWithReminder = useCallback(
    async (
      text: string,
      reminderAt: number,
      priority = false,
      scheduledAt: number | null = null,
      recurrence: Recurrence | null = null
    ) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const task = await dbAdd(trimmed);
      await setTaskReminder(task.id, reminderAt);
      if (scheduledAt != null) await setTaskScheduled(task.id, scheduledAt);
      if (priority) await setTaskPriority(task.id, true);
      const anchor = recurrence === "monthly" ? new Date(reminderAt).getDate() : null;
      if (recurrence) await setTaskRecurrence(task.id, recurrence, anchor);
      setTasks((prev) => [
        ...prev,
        { ...task, reminderAt, scheduledAt, priority, recurrence, recurAnchor: anchor },
      ]);
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

    if (nextCompleted) {
      // Statistici: numaram o terminare pentru ziua de azi.
      void bumpDailyCompleted(localDay(Date.now()));

      // Recurenta: daca task-ul se repeta, cream automat urmatoarea aparitie
      // (nebifata), programata pe data urmatoare. Cel bifat se sterge normal la 3h.
      if (current.recurrence) {
        const base = current.scheduledAt ?? current.reminderAt ?? Date.now();
        // Ziua-ancora pentru recurenta lunara: prima data setata, ca sa nu se
        // "erodeze" spre 28 dupa o luna scurta. Daca lipseste, o luam din base.
        const anchor = current.recurAnchor ?? new Date(base).getDate();
        const nextAt = nextRecurrence(base, current.recurrence, anchor);
        const hadReminder = current.reminderAt != null;
        const clone = await dbAdd(current.text);
        await setTaskRecurrence(clone.id, current.recurrence, anchor);
        if (current.priority) await setTaskPriority(clone.id, true);
        if (current.note) await setTaskNote(clone.id, current.note);
        let scheduledAt: number | null = null;
        let reminderAt: number | null = null;
        if (hadReminder) {
          reminderAt = nextAt;
          const d = new Date(nextAt);
          scheduledAt = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
          await setTaskReminder(clone.id, reminderAt);
          await setTaskScheduled(clone.id, scheduledAt);
        } else {
          const d = new Date(nextAt);
          scheduledAt = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
          await setTaskScheduled(clone.id, scheduledAt);
        }
        const newTask: Task = {
          ...clone,
          priority: current.priority,
          note: current.note,
          recurrence: current.recurrence,
          recurAnchor: anchor,
          reminderAt,
          scheduledAt,
        };
        setTasks((prev) => [...prev, newTask]);
      }
    }
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

  const setNote = useCallback(async (id: number, note: string | null) => {
    const clean = note && note.trim() ? note : null;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, note: clean } : t)));
    await setTaskNote(id, clean);
  }, []);

  const setRecurrence = useCallback(async (id: number, recurrence: Recurrence | null) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, recurrence } : t)));
    await setTaskRecurrence(id, recurrence);
  }, []);

  const addSubtask = useCallback(async (taskId: number, text: string) => {
    if (!text.trim()) return;
    const sub = await dbAddSubtask(taskId, text);
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, subtasks: [...t.subtasks, sub] } : t))
    );
  }, []);

  const toggleSubtask = useCallback(async (taskId: number, subId: number) => {
    const task = tasksRef.current.find((t) => t.id === taskId);
    const sub = task?.subtasks.find((s) => s.id === subId);
    if (!sub) return;
    const done = !sub.done;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: t.subtasks.map((s) => (s.id === subId ? { ...s, done } : s)) }
          : t
      )
    );
    await setSubtaskDone(subId, done);
  }, []);

  const editSubtask = useCallback(async (taskId: number, subId: number, text: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: t.subtasks.map((s) => (s.id === subId ? { ...s, text } : s)) }
          : t
      )
    );
    await updateSubtaskText(subId, text);
  }, []);

  const removeSubtask = useCallback(async (taskId: number, subId: number) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subId) } : t
      )
    );
    await dbDeleteSubtask(subId);
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
    const inList = new Set(orderedActiveIds);
    const reordered = orderedActiveIds
      .map((id) => byId.get(id))
      .filter((t): t is Task => Boolean(t));
    // Task-uri active care NU erau in lista trasa (ex. programate in viitor,
    // deci ascunse din lista principala). Trebuie pastrate, altfel dispar.
    const untouched = prev.filter((t) => !t.completed && !inList.has(t.id));
    const completed = prev.filter((t) => t.completed);
    const merged = [...reordered, ...untouched, ...completed].map((t, i) => ({
      ...t,
      position: i,
    }));
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
    setNote,
    setRecurrence,
    addSubtask,
    toggleSubtask,
    editSubtask,
    removeSubtask,
    resetAll,
    reorderActive,
    tasksRef,
  };
}

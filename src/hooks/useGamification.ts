// XP-ul e calculat LIVE din task-urile terminate care inca exista:
//   xp = suma valorilor task-urilor bifate (10, +5 daca sunt prioritare).
// Astfel: complete -> creste, debifare -> scade, stergere (manuala sau automata)
// -> scade, totul automat, fara evenimente separate.
//
// Realizarile si numarul total de task-uri terminate (pentru badge-uri) sunt
// pastrate separat si NU scad — sunt repere permanente, salvate local.

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Task } from "../types";
import {
  ACHIEVEMENTS,
  currentBadge,
  isUnlocked,
  levelInfo,
} from "../gamification/achievements";

const STORAGE_KEY = "quicktasks.game";
const XP_BASE = 10;
const XP_PRIORITY_BONUS = 5;
const MAX_REWARDED = 1000;

function taskValue(t: Task): number {
  return XP_BASE + (t.priority ? XP_PRIORITY_BONUS : 0);
}

interface GameState {
  lifetimeCompleted: number; // total terminate vreodata (nu scade) — pentru badge-uri
  rewarded: number[]; // id-uri numarate deja in lifetimeCompleted
  unlocked: string[]; // realizari deblocate (permanente)
}

function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        lifetimeCompleted: Number(p.lifetimeCompleted ?? p.completed) || 0,
        rewarded: Array.isArray(p.rewarded) ? p.rewarded : [],
        unlocked: Array.isArray(p.unlocked) ? p.unlocked : [],
      };
    }
  } catch {
    /* ignoram */
  }
  return { lifetimeCompleted: 0, rewarded: [], unlocked: [] };
}

export function useGamification(tasks: Task[]) {
  const [state, setState] = useState<GameState>(loadState);
  const [toast, setToast] = useState<string | null>(null);

  // XP live din task-urile terminate existente.
  const xp = useMemo(
    () => tasks.reduce((sum, t) => sum + (t.completed ? taskValue(t) : 0), 0),
    [tasks]
  );
  const info = levelInfo(xp);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Curata toast-ul dupa cateva secunde.
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [toast]);

  // Deblocarea realizarilor (permanenta), pe baza totalului terminat si a nivelului.
  useEffect(() => {
    const newly = ACHIEVEMENTS.filter(
      (a) =>
        !state.unlocked.includes(a.id) &&
        isUnlocked(a, { completed: state.lifetimeCompleted, level: info.level })
    );
    if (newly.length) {
      setState((s) => ({
        ...s,
        unlocked: Array.from(new Set([...s.unlocked, ...newly.map((a) => a.id)])),
      }));
      setToast(newly[0].id);
    }
  }, [state.lifetimeCompleted, state.unlocked, info.level]);

  // Se apeleaza cand un task trece in "terminat"; creste doar contorul permanent
  // (o singura data per task). XP-ul se ocupa singur, fiind derivat din task-uri.
  const award = useCallback((task: Task) => {
    setState((s) => {
      if (s.rewarded.includes(task.id)) return s;
      let rewarded = [...s.rewarded, task.id];
      if (rewarded.length > MAX_REWARDED) rewarded = rewarded.slice(-MAX_REWARDED);
      return { ...s, lifetimeCompleted: s.lifetimeCompleted + 1, rewarded };
    });
  }, []);

  const achievements = ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: state.unlocked.includes(a.id),
  }));

  return {
    xp,
    completed: state.lifetimeCompleted,
    ...info,
    achievements,
    badge: currentBadge(state.unlocked),
    award,
    toast,
    dismissToast: () => setToast(null),
  };
}

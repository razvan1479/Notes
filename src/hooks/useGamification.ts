// Gestioneaza XP-ul, nivelul, task-urile terminate si realizarile deblocate.
// Totul e salvat local si persista intre sesiuni. XP se acorda o singura data
// per task (prima data cand e terminat), ca sa nu se poata "farmui".

import { useCallback, useEffect, useRef, useState } from "react";
import type { Task } from "../types";
import {
  ACHIEVEMENTS,
  isUnlocked,
  levelInfo,
  type LevelInfo,
} from "../gamification/achievements";

const STORAGE_KEY = "quicktasks.game";
const XP_BASE = 10;
const XP_PRIORITY_BONUS = 5;
const MAX_REWARDED = 1000;

interface GameState {
  xp: number;
  completed: number;
  rewarded: number[]; // id-uri deja recompensate
  unlocked: string[]; // id-uri realizari deblocate
}

function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        xp: Number(p.xp) || 0,
        completed: Number(p.completed) || 0,
        rewarded: Array.isArray(p.rewarded) ? p.rewarded : [],
        unlocked: Array.isArray(p.unlocked) ? p.unlocked : [],
      };
    }
  } catch {
    /* ignoram */
  }
  return { xp: 0, completed: 0, rewarded: [], unlocked: [] };
}

export function useGamification() {
  const [state, setState] = useState<GameState>(loadState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Curata toast-ul dupa cateva secunde.
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [toast]);

  const award = useCallback((task: Task) => {
    const s = stateRef.current;
    if (s.rewarded.includes(task.id)) return; // deja recompensat

    const gain = XP_BASE + (task.priority ? XP_PRIORITY_BONUS : 0);
    const xp = s.xp + gain;
    const completed = s.completed + 1;
    const level = levelInfo(xp).level;

    let rewarded = [...s.rewarded, task.id];
    if (rewarded.length > MAX_REWARDED) rewarded = rewarded.slice(-MAX_REWARDED);

    const newly = ACHIEVEMENTS.filter(
      (a) => !s.unlocked.includes(a.id) && isUnlocked(a, { completed, level })
    ).map((a) => a.id);
    const unlocked = newly.length ? [...s.unlocked, ...newly] : s.unlocked;

    setState({ xp, completed, rewarded, unlocked });
    if (newly.length) setToast(newly[0]);
  }, []);

  const info: LevelInfo = levelInfo(state.xp);
  const achievements = ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: state.unlocked.includes(a.id),
  }));

  return {
    xp: state.xp,
    completed: state.completed,
    ...info,
    achievements,
    award,
    toast,
    dismissToast: () => setToast(null),
  };
}

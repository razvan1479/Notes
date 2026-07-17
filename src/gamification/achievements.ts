// Definitii pentru sistemul de gamificare: curba de niveluri si realizarile.

export interface Achievement {
  id: string;
  type: "completed" | "level";
  threshold: number;
  color: string;
}

// Realizari (badge-uri). Numele/descrierile sunt traduse dupa id (ach.<id>.name).
// Ordinea = de la usor la greu; ultimul deblocat e "badge-ul curent".
export const ACHIEVEMENTS: Achievement[] = [
  { id: "first", type: "completed", threshold: 1, color: "#cd7f32" },
  { id: "ten", type: "completed", threshold: 10, color: "#9aa0a6" },
  { id: "fifty", type: "completed", threshold: 50, color: "#f4b400" },
  { id: "hundred", type: "completed", threshold: 100, color: "#34a0c8" },
  { id: "level5", type: "level", threshold: 5, color: "#7c5cff" },
  { id: "level10", type: "level", threshold: 10, color: "#e5484d" },
];

/** Badge-ul curent = ultima realizare deblocata (cea mai "inalta"). */
export function currentBadge(unlockedIds: string[]): Achievement | null {
  let best: Achievement | null = null;
  for (const a of ACHIEVEMENTS) {
    if (unlockedIds.includes(a.id)) best = a;
  }
  return best;
}

export interface LevelInfo {
  level: number;
  into: number; // XP acumulat in nivelul curent
  need: number; // XP necesar pentru nivelul urmator
  progress: number; // 0..1
}

/** XP necesar pentru a trece de la nivelul L la L+1 (creste treptat). */
function reqForLevel(level: number): number {
  return 100 + (level - 1) * 50;
}

/** Calculeaza nivelul si progresul din XP-ul total. */
export function levelInfo(xp: number): LevelInfo {
  let level = 1;
  let remaining = Math.max(0, xp);
  let req = reqForLevel(level);
  while (remaining >= req) {
    remaining -= req;
    level++;
    req = reqForLevel(level);
  }
  return { level, into: remaining, need: req, progress: req > 0 ? remaining / req : 0 };
}

export function isUnlocked(
  a: Achievement,
  ctx: { completed: number; level: number }
): boolean {
  return a.type === "completed"
    ? ctx.completed >= a.threshold
    : ctx.level >= a.threshold;
}

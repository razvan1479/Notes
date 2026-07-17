// Definitii pentru sistemul de gamificare: curba de niveluri si realizarile.

export interface Achievement {
  id: string;
  type: "completed" | "level";
  threshold: number;
  color: string;
}

// Realizari (badge-uri). Numele/descrierile sunt traduse dupa id (ach.<id>.name).
// Ordinea = de la usor la greu; ultimul deblocat e "badge-ul curent".
// Realizari (badge-uri) — o singura scara, dupa numarul TOTAL de task-uri
// terminate (valoare care doar creste). Astfel se deblocheaza strict in ordine,
// niciodata nu "sar" peste una si niciodata nu se pierd.
export const ACHIEVEMENTS: Achievement[] = [
  { id: "c1", type: "completed", threshold: 1, color: "#c0c0c8" },
  { id: "c10", type: "completed", threshold: 10, color: "#cd7f32" },
  { id: "c25", type: "completed", threshold: 25, color: "#f4b400" },
  { id: "c50", type: "completed", threshold: 50, color: "#2bb673" },
  { id: "c100", type: "completed", threshold: 100, color: "#34a0c8" },
  { id: "c200", type: "completed", threshold: 200, color: "#4f6df5" },
  { id: "c350", type: "completed", threshold: 350, color: "#7c5cff" },
  { id: "c500", type: "completed", threshold: 500, color: "#b26bff" },
  { id: "c750", type: "completed", threshold: 750, color: "#e0457b" },
  { id: "c1000", type: "completed", threshold: 1000, color: "#ff5c8a" },
  { id: "c1500", type: "completed", threshold: 1500, color: "#ff8a3d" },
  { id: "c2500", type: "completed", threshold: 2500, color: "#00c2b8" },
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

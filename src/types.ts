// Tipuri partajate in intreaga aplicatie.

export interface Task {
  id: number;
  text: string;
  completed: boolean;
  /** Momentul crearii, in milisecunde epoch (Date.now()). */
  createdAt: number;
  /** Momentul bifarii, in ms epoch. null daca task-ul e activ. */
  completedAt: number | null;
  /** Pozitia manuala pentru drag & drop (mai mic = mai sus). */
  position: number;
}

/** Forma bruta a randului din SQLite (numere in loc de boolean). */
export interface TaskRow {
  id: number;
  text: string;
  completed: number;
  created_at: number;
  completed_at: number | null;
  position: number;
}

export type ThemeMode = "light" | "dark";

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
  /** Task prioritar (afiseaza semnul exclamarii). */
  priority: boolean;
  /** Momentul (ms) la care sa se declanseze un reminder (cu pop-up), sau null. */
  reminderAt: number | null;
  /** Data programata pentru calendar (fara alarma), sau null. */
  scheduledAt: number | null;
  /** Nota libera (detalii, linkuri), sau null. */
  note: string | null;
  /** Recurenta: "daily" | "weekly" | "monthly", sau null daca nu se repeta. */
  recurrence: Recurrence | null;
  /** Ziua-ancora pentru recurenta lunara (1-31), sau null. */
  recurAnchor: number | null;
  /** Sub-task-urile (pasii). Se incarca odata cu task-ul. */
  subtasks: Subtask[];
}

export type Recurrence = "daily" | "weekly" | "monthly";

export interface Subtask {
  id: number;
  taskId: number;
  text: string;
  done: boolean;
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
  priority: number;
  reminder_at: number | null;
  scheduled_at: number | null;
  note: string | null;
  recurrence: string | null;
  recur_anchor: number | null;
}

export interface SubtaskRow {
  id: number;
  task_id: number;
  text: string;
  done: number;
  position: number;
}

export type ThemeMode = "light" | "dark";

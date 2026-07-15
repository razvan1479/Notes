// Stratul de acces la date. Foloseste tauri-plugin-sql (SQLite) pentru
// stocare 100% locala. Baza de date traieste in directorul de config al
// aplicatiei (ex: %APPDATA%\com.quicktasks.app pe Windows), deci datele
// persista peste inchiderea aplicatiei, restart sau oprirea calculatorului.

import Database from "@tauri-apps/plugin-sql";
import type { Task, TaskRow } from "../types";
import { AUTO_DELETE_MS } from "../lib/time";

const DB_URL = "sqlite:quicktasks.db";

let dbPromise: Promise<Database> | null = null;

/** Singleton: deschide (o singura data) conexiunea si asigura schema. */
async function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await Database.load(DB_URL);
      await db.execute(`
        CREATE TABLE IF NOT EXISTS tasks (
          id           INTEGER PRIMARY KEY AUTOINCREMENT,
          text         TEXT    NOT NULL DEFAULT '',
          completed    INTEGER NOT NULL DEFAULT 0,
          created_at   INTEGER NOT NULL,
          completed_at INTEGER,
          position     INTEGER NOT NULL DEFAULT 0,
          priority     INTEGER NOT NULL DEFAULT 0,
          reminder_at  INTEGER
        );
      `);
      // Migrari pentru bazele create inainte de coloanele noi.
      // SQLite nu are ADD COLUMN IF NOT EXISTS, deci ignoram eroarea daca exista deja.
      try {
        await db.execute(
          `ALTER TABLE tasks ADD COLUMN priority INTEGER NOT NULL DEFAULT 0;`
        );
      } catch {
        /* coloana exista deja */
      }
      try {
        await db.execute(`ALTER TABLE tasks ADD COLUMN reminder_at INTEGER;`);
      } catch {
        /* coloana exista deja */
      }
      // Index pentru sortare rapida chiar si cu multe task-uri.
      await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_tasks_position ON tasks(position);`
      );
      return db;
    })();
  }
  return dbPromise;
}

/** Transforma randul brut din SQLite in obiectul Task tipizat.
 *  Folosim conversii tolerante (Number(...)) fiindca driver-ul SQLite poate
 *  intoarce valorile ca numar, sir ("1") sau bigint. O comparatie stricta
 *  (=== 1) ar rata cazul sir si ar face task-urile bifate sa reapara active
 *  dupa repornire. */
function rowToTask(r: TaskRow): Task {
  return {
    id: Number(r.id),
    text: r.text ?? "",
    completed: Number(r.completed) === 1,
    createdAt: Number(r.created_at),
    completedAt: r.completed_at == null ? null : Number(r.completed_at),
    position: Number(r.position),
    priority: Number(r.priority) === 1,
    reminderAt: r.reminder_at == null ? null : Number(r.reminder_at),
  };
}

/** Toate task-urile, ordonate dupa pozitia manuala. */
export async function getAllTasks(): Promise<Task[]> {
  const db = await getDb();
  const rows = await db.select<TaskRow[]>(
    `SELECT * FROM tasks ORDER BY position ASC, id ASC;`
  );
  return rows.map(rowToTask);
}

/** Adauga un task nou la finalul listei si returneaza obiectul creat. */
export async function addTask(text: string): Promise<Task> {
  const db = await getDb();
  const now = Date.now();
  // Punem noul task dupa toate celelalte.
  const maxRows = await db.select<{ maxPos: number | null }[]>(
    `SELECT MAX(position) AS maxPos FROM tasks;`
  );
  const nextPos = (maxRows[0]?.maxPos ?? -1) + 1;
  const res = await db.execute(
    `INSERT INTO tasks (text, completed, created_at, completed_at, position)
     VALUES ($1, 0, $2, NULL, $3);`,
    [text, now, nextPos]
  );
  return {
    id: res.lastInsertId as number,
    text,
    completed: false,
    createdAt: now,
    completedAt: null,
    position: nextPos,
    priority: false,
    reminderAt: null,
  };
}

/** Actualizeaza textul unui task. */
export async function updateTaskText(id: number, text: string): Promise<void> {
  const db = await getDb();
  await db.execute(`UPDATE tasks SET text = $1 WHERE id = $2;`, [text, id]);
}

/**
 * Bifeaza / debifeaza un task.
 * - La bifare setam completed_at = acum (porneste cronometrul de 4h).
 * - La debifare setam completed_at = NULL (reseteaza complet cronometrul).
 */
export async function setTaskCompleted(id: number, completed: boolean): Promise<void> {
  const db = await getDb();
  const completedAt = completed ? Date.now() : null;
  await db.execute(
    `UPDATE tasks SET completed = $1, completed_at = $2 WHERE id = $3;`,
    [completed ? 1 : 0, completedAt, id]
  );
}

/** Seteaza (sau sterge, cu null) momentul de reminder pentru un task. */
export async function setTaskReminder(id: number, reminderAt: number | null): Promise<void> {
  const db = await getDb();
  await db.execute(`UPDATE tasks SET reminder_at = $1 WHERE id = $2;`, [reminderAt, id]);
}

/** Marcheaza / demarcheaza un task ca prioritar. */
export async function setTaskPriority(id: number, priority: boolean): Promise<void> {
  const db = await getDb();
  await db.execute(`UPDATE tasks SET priority = $1 WHERE id = $2;`, [
    priority ? 1 : 0,
    id,
  ]);
}

/** Sterge definitiv un task. */
export async function deleteTask(id: number): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM tasks WHERE id = $1;`, [id]);
}

/**
 * Sterge toate task-urile bifate care au depasit cele 4h.
 * Calculul se face pe baza timestamp-ului salvat, deci ramane corect
 * indiferent cat timp a fost aplicatia inchisa.
 * @returns numarul de task-uri sterse.
 */
export async function deleteExpiredTasks(now: number = Date.now()): Promise<number> {
  const db = await getDb();
  const cutoff = now - AUTO_DELETE_MS;
  const res = await db.execute(
    `DELETE FROM tasks WHERE completed = 1 AND completed_at IS NOT NULL AND completed_at <= $1;`,
    [cutoff]
  );
  return res.rowsAffected;
}

/** Salveaza o noua ordine (drag & drop). Primeste id-urile in ordinea dorita. */
export async function persistOrder(orderedIds: number[]): Promise<void> {
  const db = await getDb();
  // O singura tranzactie pentru actualizarea tuturor pozitiilor.
  await db.execute("BEGIN TRANSACTION;");
  try {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.execute(`UPDATE tasks SET position = $1 WHERE id = $2;`, [i, orderedIds[i]]);
    }
    await db.execute("COMMIT;");
  } catch (e) {
    await db.execute("ROLLBACK;");
    throw e;
  }
}

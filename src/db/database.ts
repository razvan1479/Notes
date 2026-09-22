// Stratul de acces la date. Foloseste tauri-plugin-sql (SQLite) pentru
// stocare 100% locala. Baza de date traieste in directorul de config al
// aplicatiei (ex: %APPDATA%\com.quicktasks.app pe Windows), deci datele
// persista peste inchiderea aplicatiei, restart sau oprirea calculatorului.

import Database from "@tauri-apps/plugin-sql";
import type { Task, TaskRow, Subtask, SubtaskRow, Recurrence } from "../types";
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
          reminder_at  INTEGER,
          unchecked_once INTEGER NOT NULL DEFAULT 0,
          scheduled_at INTEGER,
          note         TEXT,
          recurrence   TEXT,
          recur_anchor INTEGER,
          image        TEXT
        );
        CREATE TABLE IF NOT EXISTS subtasks (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id    INTEGER NOT NULL,
          text       TEXT    NOT NULL DEFAULT '',
          done       INTEGER NOT NULL DEFAULT 0,
          position   INTEGER NOT NULL DEFAULT 0,
          image      TEXT
        );
        CREATE TABLE IF NOT EXISTS stats_daily (
          day        TEXT    PRIMARY KEY,
          completed  INTEGER NOT NULL DEFAULT 0
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
      try {
        await db.execute(
          `ALTER TABLE tasks ADD COLUMN unchecked_once INTEGER NOT NULL DEFAULT 0;`
        );
      } catch {
        /* coloana exista deja */
      }
      try {
        await db.execute(`ALTER TABLE tasks ADD COLUMN scheduled_at INTEGER;`);
      } catch {
        /* coloana exista deja */
      }
      try {
        await db.execute(`ALTER TABLE tasks ADD COLUMN note TEXT;`);
      } catch {
        /* coloana exista deja */
      }
      try {
        await db.execute(`ALTER TABLE tasks ADD COLUMN recurrence TEXT;`);
      } catch {
        /* coloana exista deja */
      }
      try {
        await db.execute(`ALTER TABLE tasks ADD COLUMN recur_anchor INTEGER;`);
      } catch {
        /* coloana exista deja */
      }
      try {
        await db.execute(`ALTER TABLE tasks ADD COLUMN image TEXT;`);
      } catch {
        /* coloana exista deja */
      }
      try {
        await db.execute(`ALTER TABLE subtasks ADD COLUMN image TEXT;`);
      } catch {
        /* coloana exista deja */
      }
      // Tabele noi (sub-task-uri si statistici) — sigure daca deja exista.
      try {
        await db.execute(
          `CREATE TABLE IF NOT EXISTS subtasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER NOT NULL,
            text TEXT NOT NULL DEFAULT '',
            done INTEGER NOT NULL DEFAULT 0,
            position INTEGER NOT NULL DEFAULT 0
          );`
        );
        await db.execute(
          `CREATE TABLE IF NOT EXISTS stats_daily (
            day TEXT PRIMARY KEY,
            completed INTEGER NOT NULL DEFAULT 0
          );`
        );
      } catch {
        /* deja exista */
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
    scheduledAt: r.scheduled_at == null ? null : Number(r.scheduled_at),
    note: r.note ?? null,
    recurrence: (r.recurrence as Recurrence | null) ?? null,
    recurAnchor: r.recur_anchor == null ? null : Number(r.recur_anchor),
    image: r.image ?? null,
    subtasks: [],
  };
}

/** Toate task-urile, ordonate dupa pozitia manuala. */
export async function getAllTasks(): Promise<Task[]> {
  const db = await getDb();
  const rows = await db.select<TaskRow[]>(
    `SELECT * FROM tasks ORDER BY position ASC, id ASC;`
  );
  const tasks = rows.map(rowToTask);
  const subs = await db.select<SubtaskRow[]>(
    `SELECT * FROM subtasks ORDER BY position ASC, id ASC;`
  );
  const byTask = new Map<number, Subtask[]>();
  for (const r of subs) {
    const st: Subtask = {
      id: Number(r.id),
      taskId: Number(r.task_id),
      text: r.text ?? "",
      done: Number(r.done) === 1,
      position: Number(r.position),
      image: r.image ?? null,
    };
    const arr = byTask.get(st.taskId) ?? [];
    arr.push(st);
    byTask.set(st.taskId, arr);
  }
  for (const t of tasks) t.subtasks = byTask.get(t.id) ?? [];
  return tasks;
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
    scheduledAt: null,
    note: null,
    recurrence: null,
    recurAnchor: null,
    image: null,
    subtasks: [],
  };
}

/** Actualizeaza textul unui task. */
export async function updateTaskText(id: number, text: string): Promise<void> {
  const db = await getDb();
  await db.execute(`UPDATE tasks SET text = $1 WHERE id = $2;`, [text, id]);
}

/**
 * Bifeaza / debifeaza un task.
 * - La bifare setam completed_at = acum (porneste cronometrul de 3h).
 * - La debifare setam completed_at = NULL (reseteaza complet cronometrul).
 */
export async function setTaskCompleted(id: number, completed: boolean): Promise<void> {
  const db = await getDb();
  const completedAt = completed ? Date.now() : null;
  if (completed) {
    await db.execute(
      `UPDATE tasks SET completed = 1, completed_at = $1 WHERE id = $2;`,
      [completedAt, id]
    );
  } else {
    // La debifare marcam permanent task-ul ca "debifat o data" — pierde dreptul
    // la bonusul de angajament, chiar daca il rebifezi ulterior.
    await db.execute(
      `UPDATE tasks SET completed = 0, completed_at = NULL, unchecked_once = 1 WHERE id = $1;`,
      [id]
    );
  }
}

/** Seteaza (sau sterge, cu null) data programata (pentru calendar; fara alarma). */
export async function setTaskScheduled(id: number, scheduledAt: number | null): Promise<void> {
  const db = await getDb();
  await db.execute(`UPDATE tasks SET scheduled_at = $1 WHERE id = $2;`, [scheduledAt, id]);
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

/** Sterge TOATE task-urile (folosit de resetarea totala). */
export async function deleteAllTasks(): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM subtasks;`);
  await db.execute(`DELETE FROM tasks;`);
}

/** Sterge definitiv un task. */
export async function deleteTask(id: number): Promise<void> {
  const db = await getDb();
  await deleteSubtasksForTask(id);
  await db.execute(`DELETE FROM tasks WHERE id = $1;`, [id]);
}

/**
 * Sterge toate task-urile bifate care au depasit cele 3h.
 * Calculul se face pe baza timestamp-ului salvat, deci ramane corect
 * indiferent cat timp a fost aplicatia inchisa.
 * @returns numarul de task-uri sterse.
 */
/**
 * Sterge task-urile bifate care au depasit cele 3h si intoarce cate dintre ele
 * erau eligibile pentru bonusul de angajament (bifate si niciodata debifate).
 */
export async function deleteExpiredTasks(now: number = Date.now()): Promise<number> {
  const db = await getDb();
  const cutoff = now - AUTO_DELETE_MS;
  // Numaram intai cate expira eligibile pentru bonus (unchecked_once = 0).
  const rows = await db.select<{ n: number }[]>(
    `SELECT COUNT(*) AS n FROM tasks
     WHERE completed = 1 AND completed_at IS NOT NULL AND completed_at <= $1
       AND unchecked_once = 0;`,
    [cutoff]
  );
  const bonusCount = rows.length ? Number(rows[0].n) : 0;
  await db.execute(
    `DELETE FROM subtasks WHERE task_id IN (
       SELECT id FROM tasks WHERE completed = 1 AND completed_at IS NOT NULL AND completed_at <= $1
     );`,
    [cutoff]
  );
  await db.execute(
    `DELETE FROM tasks WHERE completed = 1 AND completed_at IS NOT NULL AND completed_at <= $1;`,
    [cutoff]
  );
  return bonusCount;
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

// ---------- Note & recurenta ----------

export async function setTaskNote(id: number, note: string | null): Promise<void> {
  const db = await getDb();
  await db.execute(`UPDATE tasks SET note = $1 WHERE id = $2;`, [note && note.trim() ? note : null, id]);
}

export async function setTaskRecurrence(
  id: number,
  recurrence: Recurrence | null,
  anchor: number | null = null
): Promise<void> {
  const db = await getDb();
  await db.execute(`UPDATE tasks SET recurrence = $1, recur_anchor = $2 WHERE id = $3;`, [
    recurrence,
    anchor,
    id,
  ]);
}

// ---------- Sub-task-uri ----------

export async function addSubtask(taskId: number, text: string): Promise<Subtask> {
  const db = await getDb();
  const rows = await db.select<{ maxPos: number | null }[]>(
    `SELECT MAX(position) AS maxPos FROM subtasks WHERE task_id = $1;`,
    [taskId]
  );
  const nextPos = (rows[0]?.maxPos == null ? -1 : Number(rows[0].maxPos)) + 1;
  const res = await db.execute(
    `INSERT INTO subtasks (task_id, text, done, position) VALUES ($1, $2, 0, $3);`,
    [taskId, text.trim(), nextPos]
  );
  return {
    id: Number(res.lastInsertId),
    taskId,
    text: text.trim(),
    done: false,
    position: nextPos,
    image: null,
  };
}

export async function setSubtaskDone(id: number, done: boolean): Promise<void> {
  const db = await getDb();
  await db.execute(`UPDATE subtasks SET done = $1 WHERE id = $2;`, [done ? 1 : 0, id]);
}

export async function updateSubtaskText(id: number, text: string): Promise<void> {
  const db = await getDb();
  await db.execute(`UPDATE subtasks SET text = $1 WHERE id = $2;`, [text.trim(), id]);
}

export async function deleteSubtask(id: number): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM subtasks WHERE id = $1;`, [id]);
}

async function deleteSubtasksForTask(taskId: number): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM subtasks WHERE task_id = $1;`, [taskId]);
}

// ---------- Statistici ----------

/** Incrementeaza contorul de task-uri terminate pentru ziua data (YYYY-MM-DD). */
export async function bumpDailyCompleted(day: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO stats_daily (day, completed) VALUES ($1, 1)
     ON CONFLICT(day) DO UPDATE SET completed = completed + 1;`,
    [day]
  );
}

export interface DailyStat {
  day: string;
  completed: number;
}

/** Statistici pe ultimele N zile (inclusiv azi), ordonate crescator dupa data. */
export async function getDailyStats(days: number): Promise<DailyStat[]> {
  const db = await getDb();
  const rows = await db.select<{ day: string; completed: number }[]>(
    `SELECT day, completed FROM stats_daily ORDER BY day DESC LIMIT $1;`,
    [days]
  );
  return rows
    .map((r) => ({ day: r.day, completed: Number(r.completed) }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

// ---------- Rapoarte lunare ----------
// Un raport per luna (cheie "YYYY-MM"), cu cele 4 sectiuni ca text.

export interface MonthlyReport {
  month: string; // "YYYY-MM"
  highlights: string;
  lowlights: string;
  risks: string;
  outlook: string;
}

async function ensureReportsTable(): Promise<void> {
  const db = await getDb();
  await db.execute(
    `CREATE TABLE IF NOT EXISTS reports (
      month     TEXT PRIMARY KEY,
      highlights TEXT NOT NULL DEFAULT '',
      lowlights  TEXT NOT NULL DEFAULT '',
      risks      TEXT NOT NULL DEFAULT '',
      outlook    TEXT NOT NULL DEFAULT ''
    );`
  );
}

/** Lunile care au deja un raport, cele mai noi primele. */
export async function getReportMonths(): Promise<string[]> {
  await ensureReportsTable();
  const db = await getDb();
  const rows = await db.select<{ month: string }[]>(
    `SELECT month FROM reports ORDER BY month DESC;`
  );
  return rows.map((r) => r.month);
}

/** Raportul unei luni, sau null daca nu exista inca. */
export async function getReport(month: string): Promise<MonthlyReport | null> {
  await ensureReportsTable();
  const db = await getDb();
  const rows = await db.select<MonthlyReport[]>(
    `SELECT month, highlights, lowlights, risks, outlook FROM reports WHERE month = $1;`,
    [month]
  );
  return rows[0] ?? null;
}

/** Salveaza (sau actualizeaza) raportul unei luni. */
export async function saveReport(r: MonthlyReport): Promise<void> {
  await ensureReportsTable();
  const db = await getDb();
  await db.execute(
    `INSERT INTO reports (month, highlights, lowlights, risks, outlook)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT(month) DO UPDATE SET
       highlights = excluded.highlights,
       lowlights  = excluded.lowlights,
       risks      = excluded.risks,
       outlook    = excluded.outlook;`,
    [r.month, r.highlights, r.lowlights, r.risks, r.outlook]
  );
}

/** Sterge raportul unei luni. */
export async function deleteReport(month: string): Promise<void> {
  await ensureReportsTable();
  const db = await getDb();
  await db.execute(`DELETE FROM reports WHERE month = $1;`, [month]);
}

// ---------- Poza atasata unui task ----------

/** Salveaza (sau sterge, cu null) poza unui task, ca data URL base64. */
export async function setTaskImage(id: number, image: string | null): Promise<void> {
  const db = await getDb();
  await db.execute(`UPDATE tasks SET image = $1 WHERE id = $2;`, [image, id]);
}

// ---------- Transfer poza catre fereastra de vizualizare ----------
// Poza e prea mare pentru a fi trecuta prin adresa ferestrei, asa ca o punem
// intr-un tabel temporar sub o cheie; fereastra noua o citeste dupa cheie.

async function ensureImageBufferTable(): Promise<void> {
  const db = await getDb();
  await db.execute(
    `CREATE TABLE IF NOT EXISTS image_buffer (
      key  TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );`
  );
}

/** Pune poza in buffer si intoarce cheia de folosit in adresa ferestrei. */
export async function putImagePayload(dataUrl: string): Promise<string> {
  await ensureImageBufferTable();
  const db = await getDb();
  const key = "img_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  // Curatam intrari vechi (peste 20), ca sa nu se adune.
  await db.execute(
    `DELETE FROM image_buffer WHERE key NOT IN (
       SELECT key FROM image_buffer ORDER BY key DESC LIMIT 20
     );`
  );
  await db.execute(`INSERT INTO image_buffer (key, data) VALUES ($1, $2);`, [key, dataUrl]);
  return key;
}

/** Citeste poza din buffer dupa cheie (folosit de fereastra de imagine). */
export async function getImagePayload(key: string): Promise<string | null> {
  await ensureImageBufferTable();
  const db = await getDb();
  const rows = await db.select<{ data: string }[]>(
    `SELECT data FROM image_buffer WHERE key = $1;`,
    [key]
  );
  return rows[0]?.data ?? null;
}

/** Salveaza sau sterge (null) poza unui sub-task. */
export async function setSubtaskImage(id: number, image: string | null): Promise<void> {
  const db = await getDb();
  await db.execute(`UPDATE subtasks SET image = $1 WHERE id = $2;`, [image, id]);
}

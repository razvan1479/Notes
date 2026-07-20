// Componenta radacina. Leaga starea (task-uri + tema), cautarea, selectia
// si scurtaturile de tastatura, si asambleaza interfata.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Header } from "./components/Header";
import { TaskInput } from "./components/TaskInput";
import { SearchBar } from "./components/SearchBar";
import { TaskList } from "./components/TaskList";
import { Settings } from "./components/Settings";
import { UpdatePopup } from "./components/UpdatePopup";
import { ReminderDialog } from "./components/ReminderDialog";
import { CalendarModal } from "./components/CalendarModal";
import { ReminderAlert } from "./components/ReminderAlert";
import { GamificationBar } from "./components/GamificationBar";
import { AchievementsModal } from "./components/AchievementsModal";
import { useTasks } from "./hooks/useTasks";
import { useTheme } from "./hooks/useTheme";
import { useHotkeys } from "./hooks/useHotkeys";
import { useUpdate } from "./hooks/useUpdate";
import { useColors } from "./hooks/useColors";
import { useReminders } from "./hooks/useReminders";
import { playReminderSound } from "./lib/sound";
import type { Task } from "./types";
import { useGamification } from "./hooks/useGamification";
import { useI18n } from "./i18n/i18n";

/** Normalizeaza pentru cautare fara diacritice si case-insensitive. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function App() {
  const bonusRef = useRef<(count: number) => void>(() => {});
  const onBonus = useCallback((count: number) => bonusRef.current(count), []);
  const { tasks, loading, now, add, addScheduled, addWithReminder, editText, toggle, remove, togglePriority, setReminder, resetAll, reorderActive, tasksRef } = useTasks(onBonus);
  const { theme, setTheme, toggle: toggleTheme } = useTheme();
  const update = useUpdate();
  const colors = useColors(theme);
  const game = useGamification(tasks);
  bonusRef.current = game.addBonus;
  const { t } = useI18n();
  // Cand un memento devine scadent: sunet, aducem fereastra in fata si aratam pop-up-ul.
  const handleDue = useCallback(
    (tasks: Task[]) => {
      setDueReminders((prev) => {
        const ids = new Set(prev.map((x) => x.id));
        return [...prev, ...tasks.filter((x) => !ids.has(x.id))];
      });
      playReminderSound();
      if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
        import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
          const w = getCurrentWindow();
          w.show().catch(() => {});
          w.unminimize().catch(() => {});
          w.setFocus().catch(() => {});
        });
      }
    },
    []
  );
  useReminders(tasksRef, handleDue, t("reminder.title"));

  const resolveReminder = useCallback(
    (id: number, snooze: boolean) => {
      setReminder(id, snooze ? Date.now() + 5 * 60 * 1000 : null);
      setDueReminders((prev) => prev.filter((x) => x.id !== id));
    },
    [setReminder]
  );

  // Reset total: sterge task-urile si progresul, si curata starea din UI.
  const handleReset = useCallback(async () => {
    await resetAll();
    game.reset();
    setSelectedId(null);
    setDueReminders([]);
  }, [resetAll, game]);

  // Adaugare din calendar: cu "!" -> memento (alarma+pop-up) la ora exacta si prioritar;
  // fara "!" -> doar programat pe zi la 00:00, fara alarma.
  const handleCalendarAdd = useCallback(
    (text: string, ts: number, priority: boolean) => {
      if (priority) addWithReminder(text, ts, true);
      else addScheduled(text, ts, false);
    },
    [addWithReminder, addScheduled]
  );

  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updateForced, setUpdateForced] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [reminderTaskId, setReminderTaskId] = useState<number | null>(null);
  const [dueReminders, setDueReminders] = useState<Task[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Doar daca update-ul e gasit la PORNIRE deschidem pop-up-ul obligatoriu (care
  // blocheaza aplicatia). Daca apare cat aplicatia e deja deschisa, NU blocam —
  // se aprinde doar "!"-ul pe buton, iar userul actualizeaza manual.
  useEffect(() => {
    if (update.startupHasUpdate) {
      setUpdateForced(true);
      setUpdateOpen(true);
    }
  }, [update.startupHasUpdate]);

  const addInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Ref pentru selectie, ca handlerele de scurtaturi sa ramana stabile.
  const selectedRef = useRef<number | null>(null);
  selectedRef.current = selectedId;

  // Filtrare instantanee dupa cautare.
  // Task-urile programate din calendar stau ASCUNSE in lista principala pana
  // le vine ziua: apar abia cand data programata e azi sau in trecut. In
  // calendar se vad oricand, la data lor. Folosim "now" ca ceas, deci la miezul
  // noptii task-ul zilei apare singur, fara restart.
  const visibleTasks = useMemo(
    () => tasks.filter((t) => t.scheduledAt == null || t.scheduledAt <= now),
    [tasks, now]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return visibleTasks;
    const q = norm(query);
    return visibleTasks.filter((t) => norm(t.text).includes(q));
  }, [visibleTasks, query]);

  const activeCount = useMemo(
    () => visibleTasks.filter((t) => !t.completed).length,
    [visibleTasks]
  );

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    // Asteptam randarea inainte de focus.
    requestAnimationFrame(() => searchInputRef.current?.focus());
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setQuery("");
  }, []);

  const focusAdd = useCallback(() => {
    addInputRef.current?.focus();
  }, []);

  // Bifarea unui task acorda XP (o singura data per task, la trecerea in "terminat").
  const handleToggle = useCallback(
    (id: number) => {
      const task = tasksRef.current.find((t) => t.id === id);
      toggle(id);
      if (task && !task.completed) game.award(task);
    },
    [toggle, game, tasksRef]
  );

  // Scurtaturi globale (handlere stabile, citesc selectia din ref).
  const hotkeyHandlers = useMemo(
    () => ({
      onNewTask: focusAdd,
      onSearch: openSearch,
      onDeleteSelected: () => {
        const id = selectedRef.current;
        if (id != null) {
          remove(id);
          setSelectedId(null);
        }
      },
      onToggleSelected: () => {
        const id = selectedRef.current;
        if (id != null) handleToggle(id);
      },
    }),
    [focusAdd, openSearch, remove, handleToggle]
  );
  useHotkeys(hotkeyHandlers);

  // Cand se schimba lista, deselectam daca task-ul selectat nu mai exista.
  useEffect(() => {
    if (selectedId != null && !tasks.some((t) => t.id === selectedId)) {
      setSelectedId(null);
    }
  }, [tasks, selectedId]);

  return (
    <div className="app">
      <Header
        activeCount={activeCount}
        theme={theme}
        updateAvailable={update.status.kind === "available"}
        onToggleSearch={() => (searchOpen ? closeSearch() : openSearch())}
        onToggleTheme={toggleTheme}
        onOpenCalendar={() => setCalendarOpen(true)}
        onCheckUpdate={() => {
          setUpdateForced(false);
          setUpdateOpen(true);
          update.checkNow(false);
        }}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <GamificationBar
        level={game.level}
        into={game.into}
        need={game.need}
        progress={game.progress}
        badge={game.badge}
        toast={game.toast}
        onOpen={() => setAchievementsOpen(true)}
      />

      <TaskInput ref={addInputRef} onAdd={add} />

      {searchOpen && (
        <SearchBar ref={searchInputRef} value={query} onChange={setQuery} onClose={closeSearch} />
      )}

      {loading ? (
        <div className="empty">
          <p>Se incarca…</p>
        </div>
      ) : (
        <TaskList
          tasks={filtered}
          now={now}
          selectedId={selectedId}
          hasQuery={query.trim().length > 0}
          onSelect={setSelectedId}
          onToggle={handleToggle}
          onEditText={editText}
          onDelete={remove}
          onTogglePriority={togglePriority}
          onOpenReminder={(id) => setReminderTaskId(id)}
          onReorderActive={reorderActive}
        />
      )}

      {settingsOpen && (
        <Settings
          theme={theme}
          onSetTheme={setTheme}
          onClose={() => setSettingsOpen(false)}
          colors={colors}
          onReset={handleReset}
        />
      )}

      {updateOpen && (
        <UpdatePopup
          status={update.status}
          forced={updateForced}
          onInstall={update.install}
          onClose={() => setUpdateOpen(false)}
          onRetry={() => update.checkNow(false)}
        />
      )}

      {calendarOpen && (
        <CalendarModal tasks={tasks} onAdd={handleCalendarAdd} onEdit={editText} onDelete={remove} onClose={() => setCalendarOpen(false)} />
      )}

      {achievementsOpen && (
        <AchievementsModal
          level={game.level}
          xp={game.xp}
          completed={game.completed}
          achievements={game.achievements}
          onClose={() => setAchievementsOpen(false)}
        />
      )}

      {dueReminders.length > 0 && (
        <ReminderAlert
          tasks={dueReminders}
          onSnooze={(id) => resolveReminder(id, true)}
          onDismiss={(id) => resolveReminder(id, false)}
          onDismissAll={() => {
            dueReminders.forEach((x) => setReminder(x.id, null));
            setDueReminders([]);
          }}
        />
      )}

      {reminderTaskId != null && (() => {
        const task = tasks.find((t) => t.id === reminderTaskId);
        if (!task) return null;
        return (
          <ReminderDialog
            task={task}
            onSet={setReminder}
            onClear={(id) => setReminder(id, null)}
            onClose={() => setReminderTaskId(null)}
          />
        );
      })()}
    </div>
  );
}

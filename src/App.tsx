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
import { useTasks } from "./hooks/useTasks";
import { useTheme } from "./hooks/useTheme";
import { useHotkeys } from "./hooks/useHotkeys";
import { useUpdate } from "./hooks/useUpdate";
import { useColors } from "./hooks/useColors";
import { useReminders } from "./hooks/useReminders";
import { useI18n } from "./i18n/i18n";

/** Normalizeaza pentru cautare fara diacritice si case-insensitive. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function App() {
  const { tasks, loading, now, add, editText, toggle, remove, togglePriority, setReminder, reorderActive, tasksRef } = useTasks();
  const { theme, setTheme, toggle: toggleTheme } = useTheme();
  const update = useUpdate();
  const colors = useColors(theme);
  const { t } = useI18n();
  const clearReminder = useCallback((id: number) => setReminder(id, null), [setReminder]);
  useReminders(tasksRef, clearReminder, t("reminder.title"));

  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [reminderTaskId, setReminderTaskId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Cand se gaseste un update (inclusiv la verificarea automata de la pornire),
  // deschidem singuri pop-up-ul obligatoriu.
  useEffect(() => {
    if (update.status.kind === "available") setUpdateOpen(true);
  }, [update.status.kind]);

  const addInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Ref pentru selectie, ca handlerele de scurtaturi sa ramana stabile.
  const selectedRef = useRef<number | null>(null);
  selectedRef.current = selectedId;

  // Filtrare instantanee dupa cautare.
  const filtered = useMemo(() => {
    if (!query.trim()) return tasks;
    const q = norm(query);
    return tasks.filter((t) => norm(t.text).includes(q));
  }, [tasks, query]);

  const activeCount = useMemo(() => tasks.filter((t) => !t.completed).length, [tasks]);

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
        if (id != null) toggle(id);
      },
    }),
    [focusAdd, openSearch, remove, toggle]
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
          setUpdateOpen(true);
          update.checkNow(false);
        }}
        onOpenSettings={() => setSettingsOpen(true)}
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
          onToggle={toggle}
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
        />
      )}

      {updateOpen && (
        <UpdatePopup
          status={update.status}
          onInstall={update.install}
          onClose={() => setUpdateOpen(false)}
          onRetry={() => update.checkNow(false)}
        />
      )}

      {calendarOpen && (
        <CalendarModal tasks={tasks} onClose={() => setCalendarOpen(false)} />
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

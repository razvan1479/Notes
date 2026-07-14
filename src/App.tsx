// Componenta radacina. Leaga starea (task-uri + tema), cautarea, selectia
// si scurtaturile de tastatura, si asambleaza interfata.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Header } from "./components/Header";
import { TaskInput } from "./components/TaskInput";
import { SearchBar } from "./components/SearchBar";
import { TaskList } from "./components/TaskList";
import { Settings } from "./components/Settings";
import { UpdateBanner } from "./components/UpdateBanner";
import { useTasks } from "./hooks/useTasks";
import { useTheme } from "./hooks/useTheme";
import { useHotkeys } from "./hooks/useHotkeys";
import { useUpdate } from "./hooks/useUpdate";

/** Normalizeaza pentru cautare fara diacritice si case-insensitive. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function App() {
  const { tasks, loading, now, add, editText, toggle, remove, reorderActive } = useTasks();
  const { theme, setTheme, toggle: toggleTheme } = useTheme();
  const update = useUpdate();

  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

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
        onToggleSearch={() => (searchOpen ? closeSearch() : openSearch())}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <UpdateBanner status={update.status} onInstall={update.install} />

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
          onReorderActive={reorderActive}
        />
      )}

      {settingsOpen && (
        <Settings
          theme={theme}
          onSetTheme={setTheme}
          onClose={() => setSettingsOpen(false)}
          update={update}
        />
      )}
    </div>
  );
}

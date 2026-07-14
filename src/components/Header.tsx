// Antetul aplicatiei: titlu, numar de task-uri active si butoanele de
// cautare, comutare tema si setari.

import type { ThemeMode } from "../types";

interface Props {
  activeCount: number;
  theme: ThemeMode;
  onToggleSearch: () => void;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
}

export function Header({ activeCount, theme, onToggleSearch, onToggleTheme, onOpenSettings }: Props) {
  return (
    <header className="header">
      <div className="header__title">
        <h1>Task-uri</h1>
        <span className="header__count">
          {activeCount} {activeCount === 1 ? "activ" : "active"}
        </span>
      </div>

      <div className="header__actions">
        <button className="icon-btn" onClick={onToggleSearch} aria-label="Cauta (Ctrl+F)" title="Cauta (Ctrl+F)">
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="13.5" y1="13.5" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <button
          className="icon-btn"
          onClick={onToggleTheme}
          aria-label="Schimba tema"
          title="Schimba tema"
        >
          {theme === "dark" ? (
            // soare
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
              <circle cx="10" cy="10" r="4" fill="currentColor" />
              <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="10" y1="1" x2="10" y2="3.5" />
                <line x1="10" y1="16.5" x2="10" y2="19" />
                <line x1="1" y1="10" x2="3.5" y2="10" />
                <line x1="16.5" y1="10" x2="19" y2="10" />
                <line x1="3.9" y1="3.9" x2="5.6" y2="5.6" />
                <line x1="14.4" y1="14.4" x2="16.1" y2="16.1" />
                <line x1="16.1" y1="3.9" x2="14.4" y2="5.6" />
                <line x1="5.6" y1="14.4" x2="3.9" y2="16.1" />
              </g>
            </svg>
          ) : (
            // luna
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
              <path
                d="M16 12.5A6.5 6.5 0 0 1 7.5 4a6.5 6.5 0 1 0 8.5 8.5z"
                fill="currentColor"
              />
            </svg>
          )}
        </button>

        <button className="icon-btn" onClick={onOpenSettings} aria-label="Setari" title="Setari">
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <circle cx="10" cy="10" r="2.6" fill="none" stroke="currentColor" strokeWidth="2" />
            <path
              d="M10 1.5v2M10 16.5v2M18.5 10h-2M3.5 10h-2M15.8 4.2l-1.4 1.4M5.6 14.4l-1.4 1.4M15.8 15.8l-1.4-1.4M5.6 5.6L4.2 4.2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}

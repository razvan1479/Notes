// Antetul aplicatiei: titlu, numar de task-uri active si butoanele de
// cautare, comutare tema si setari.

import type { ThemeMode } from "../types";
import { useI18n } from "../i18n/i18n";

interface Props {
  activeCount: number;
  theme: ThemeMode;
  updateAvailable: boolean;
  onToggleSearch: () => void;
  onToggleTheme: () => void;
  onOpenCalendar: () => void;
  settingsDot: boolean;
  onCheckUpdate: () => void;
  onOpenSettings: () => void;
}

export function Header({
  activeCount,
  theme,
  updateAvailable,
  onToggleSearch,
  onToggleTheme,
  onOpenCalendar,
  settingsDot,
  onCheckUpdate,
  onOpenSettings,
}: Props) {
  const { t } = useI18n();
  return (
    <header className="header">
      <div className="header__title">
        <h1>{t("header.title")}</h1>
        <span className="header__count">
          {t(activeCount === 1 ? "header.active_one" : "header.active_other", { n: activeCount })}
        </span>
      </div>

      <div className="header__actions">
        <button className="icon-btn" onClick={onToggleSearch} aria-label={t("header.search")} title={t("header.search")}>
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="13.5" y1="13.5" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <button
          className="icon-btn"
          onClick={onToggleTheme}
          aria-label={t("header.theme")}
          title={t("header.theme")}
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

        <button
          className="icon-btn"
          onClick={onOpenCalendar}
          aria-label={t("header.calendar")}
          title={t("header.calendar")}
        >
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <rect x="2.5" y="4" width="15" height="13.5" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="2.5" y1="8" x2="17.5" y2="8" stroke="currentColor" strokeWidth="2" />
            <line x1="6.5" y1="2.5" x2="6.5" y2="5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="13.5" y1="2.5" x2="13.5" y2="5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <button
          className="icon-btn icon-btn--update"
          onClick={onCheckUpdate}
          aria-label={t("header.update")}
          title={t("header.update")}
        >
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <path
              d="M16.5 6.5A7 7 0 1 0 17 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M16.5 3v3.7h-3.7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {updateAvailable && (
            <span className="icon-btn__badge" aria-hidden="true">!</span>
          )}
        </button>

        <button className="icon-btn" onClick={onOpenSettings} aria-label={t("header.settings")} title={t("header.settings")}>
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <circle cx="10" cy="10" r="2.6" fill="none" stroke="currentColor" strokeWidth="2" />
            <path
              d="M10 1.5v2M10 16.5v2M18.5 10h-2M3.5 10h-2M15.8 4.2l-1.4 1.4M5.6 14.4l-1.4 1.4M15.8 15.8l-1.4-1.4M5.6 5.6L4.2 4.2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          {settingsDot && <span className="cl__dot cl__dot--corner" aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
}

// Vedere de calendar (lunara). Marcheaza zilele cu memento-uri si, la click pe
// o zi, listeaza task-urile cu memento in acea zi.

import { useMemo, useState } from "react";
import type { Task } from "../types";
import { useI18n } from "../i18n/i18n";
import { formatTime } from "../lib/time";

interface Props {
  tasks: Task[];
  onClose: () => void;
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function CalendarModal({ tasks, onClose }: Props) {
  const { t, locale } = useI18n();
  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selected, setSelected] = useState<number>(startOfDay(today));

  // Grupam task-urile cu reminder pe ziua (00:00) respectiva.
  const byDay = useMemo(() => {
    const map = new Map<number, Task[]>();
    for (const task of tasks) {
      if (task.reminderAt == null) continue;
      const key = startOfDay(new Date(task.reminderAt));
      const arr = map.get(key) ?? [];
      arr.push(task);
      map.set(key, arr);
    }
    return map;
  }, [tasks]);

  // Construim grila lunii (incepe de luni).
  const firstOfMonth = new Date(view.year, view.month, 1);
  const monthLabel = firstOfMonth.toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // luni = 0
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(view.year, view.month, d));

  // Numele zilelor saptamanii (scurte), in limba curenta.
  const weekdays: string[] = [];
  const ref = new Date(2024, 0, 1); // 1 ian 2024 = luni
  for (let i = 0; i < 7; i++) {
    const d = new Date(ref);
    d.setDate(ref.getDate() + i);
    weekdays.push(d.toLocaleDateString(locale, { weekday: "short" }));
  }

  const prevMonth = () =>
    setView((v) => (v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 }));
  const nextMonth = () =>
    setView((v) => (v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 }));
  const goToday = () => {
    setView({ year: today.getFullYear(), month: today.getMonth() });
    setSelected(startOfDay(today));
  };

  const selectedTasks = (byDay.get(selected) ?? []).sort(
    (a, b) => (a.reminderAt ?? 0) - (b.reminderAt ?? 0)
  );
  const todayKey = startOfDay(today);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="calendar" onClick={(e) => e.stopPropagation()}>
        <div className="calendar__head">
          <button className="icon-btn" onClick={prevMonth} aria-label="‹">‹</button>
          <div className="calendar__title">
            <h2>{monthLabel}</h2>
            <button className="calendar__today" onClick={goToday}>
              {t("calendar.today")}
            </button>
          </div>
          <button className="icon-btn" onClick={nextMonth} aria-label="›">›</button>
          <button className="icon-btn calendar__close" onClick={onClose} aria-label={t("calendar.close")}>
            ×
          </button>
        </div>

        <div className="calendar__grid calendar__weekdays">
          {weekdays.map((w, i) => (
            <span key={i} className="calendar__weekday">{w}</span>
          ))}
        </div>

        <div className="calendar__grid">
          {cells.map((date, i) => {
            if (!date) return <span key={i} className="calendar__cell calendar__cell--empty" />;
            const key = startOfDay(date);
            const has = byDay.has(key);
            const classes = [
              "calendar__cell",
              key === selected ? "calendar__cell--selected" : "",
              key === todayKey ? "calendar__cell--today" : "",
            ].filter(Boolean).join(" ");
            return (
              <button key={i} className={classes} onClick={() => setSelected(key)}>
                {date.getDate()}
                {has && <span className="calendar__dot" />}
              </button>
            );
          })}
        </div>

        <div className="calendar__list">
          {selectedTasks.length === 0 ? (
            <p className="calendar__empty">{t("calendar.none")}</p>
          ) : (
            selectedTasks.map((task) => (
              <div key={task.id} className="calendar__item">
                <span className="calendar__time">{formatTime(task.reminderAt!, locale)}</span>
                <span className="calendar__text">{task.text || "…"}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

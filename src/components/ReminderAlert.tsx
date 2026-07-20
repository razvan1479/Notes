// Pop-up in stil Outlook: apare cand un memento e scadent. Listeaza task-urile
// scadente, cu optiuni Amana (5 min) si Inchide per task, plus Inchide toate.

import type { Task } from "../types";
import { useI18n } from "../i18n/i18n";
import { formatTime } from "../lib/time";

interface Props {
  tasks: Task[];
  onSnooze: (id: number) => void;
  onDismiss: (id: number) => void;
  onDismissAll: () => void;
}

export function ReminderAlert({ tasks, onSnooze, onDismiss, onDismissAll }: Props) {
  const { t, locale } = useI18n();

  return (
    <div className="overlay">
      <div className="popup popup--alert" onClick={(e) => e.stopPropagation()}>
        <div className="alert__head">
          <span className="alert__bell" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path
                d="M12 3a5 5 0 0 0-5 5c0 4.5-2 6-2 6h14s-2-1.5-2-6a5 5 0 0 0-5-5zM10 19a2 2 0 0 0 4 0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <h2 className="popup__title">{t("reminder.title")}</h2>
        </div>

        <div className="alert__list">
          {tasks.map((task) => (
            <div key={task.id} className="alert__item">
              <div className="alert__text">
                <span className="alert__task">{task.text || "…"}</span>
                {task.reminderAt != null && (
                  <span className="alert__time">{formatTime(task.reminderAt, locale)}</span>
                )}
              </div>
              <div className="alert__actions">
                <button className="popup__btn" onClick={() => onSnooze(task.id)}>
                  {t("reminder.snooze")}
                </button>
                <button className="popup__btn popup__btn--primary" onClick={() => onDismiss(task.id)}>
                  {t("reminder.dismiss")}
                </button>
              </div>
            </div>
          ))}
        </div>

        {tasks.length > 1 && (
          <button className="popup__btn alert__dismiss-all" onClick={onDismissAll}>
            {t("reminder.dismiss_all")}
          </button>
        )}
      </div>
    </div>
  );
}

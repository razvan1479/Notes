// Dialog pentru setarea unui memento pe un task, cu data + ora complet custom
// (input nativ datetime-local). Permite si stergerea memento-ului existent.

import { useState } from "react";
import type { Task } from "../types";
import { useI18n } from "../i18n/i18n";

interface Props {
  task: Task;
  onSet: (id: number, reminderAt: number) => void;
  onClear: (id: number) => void;
  onClose: () => void;
}

/** ms -> "YYYY-MM-DDTHH:mm" in ora locala (pentru input datetime-local). */
function toInputValue(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function ReminderDialog({ task, onSet, onClear, onClose }: Props) {
  const { t } = useI18n();
  const initial = task.reminderAt ?? Date.now() + 60 * 60 * 1000; // +1h implicit
  const [value, setValue] = useState<string>(toInputValue(initial));

  const handleSet = () => {
    if (!value) return;
    const ms = new Date(value).getTime();
    if (Number.isNaN(ms)) return;
    onSet(task.id, ms);
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="popup popup--reminder" onClick={(e) => e.stopPropagation()}>
        <h2 className="popup__title">{t("reminder.dialog_title")}</h2>
        <p className="popup__msg reminder__task">{task.text || "…"}</p>

        <label className="reminder__field">
          <span className="type-field__label">{t("reminder.when")}</span>
          <input
            type="datetime-local"
            className="reminder__input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </label>

        <div className="popup__actions">
          <button className="popup__btn popup__btn--primary" onClick={handleSet}>
            {t("reminder.set")}
          </button>
          {task.reminderAt != null && (
            <button
              className="popup__btn"
              onClick={() => {
                onClear(task.id);
                onClose();
              }}
            >
              {t("reminder.clear")}
            </button>
          )}
          <button className="popup__btn" onClick={onClose}>
            {t("reminder.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

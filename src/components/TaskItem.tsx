// Un singur rand-task: checkbox, text editabil (dublu-click), datele de
// creare/finalizare si indicatorul circular de expirare (semnatura app-ului).

import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n/i18n";
import type { Task } from "../types";
import {
  AUTO_DELETE_MS,
  WARNING_MS,
  formatCountdown,
  formatDateTime,
  msUntilExpiry,
} from "../lib/time";

interface Props {
  task: Task;
  now: number;
  selected: boolean;
  onSelect: (id: number) => void;
  onToggle: (id: number) => void;
  onEditText: (id: number, text: string) => void;
  onDelete: (id: number) => void;
  onTogglePriority: (id: number) => void;
  onOpenReminder: (id: number) => void;
  // Drag & drop (doar pentru task-urile active).
  draggable?: boolean;
  onDragStart?: (id: number) => void;
  onDragOver?: (id: number) => void;
  onDrop?: () => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
}

/** Inel circular care arata cat din cele 3h a trecut, plus timpul ramas. */
function ExpiryIndicator({ completedAt, now }: { completedAt: number; now: number }) {
  const { t } = useI18n();
  const remaining = msUntilExpiry(completedAt, now) ?? 0;
  const fraction = Math.max(0, Math.min(1, remaining / AUTO_DELETE_MS));
  const warning = remaining <= WARNING_MS;

  const R = 8;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - fraction);

  return (
    <span
      className={`expiry ${warning ? "expiry--warning" : ""}`}
      title={t("task.autodelete", { time: formatCountdown(remaining) })}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
        <circle className="expiry__track" cx="10" cy="10" r={R} />
        <circle
          className="expiry__value"
          cx="10"
          cy="10"
          r={R}
          strokeDasharray={C}
          strokeDashoffset={offset}
          transform="rotate(-90 10 10)"
        />
      </svg>
      <span className="expiry__label">{formatCountdown(remaining)}</span>
    </span>
  );
}

export function TaskItem(props: Props) {
  const { t, locale } = useI18n();
  const { task, now, selected } = props;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.text);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cand intram in editare, focalizam si selectam textul.
  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  // Daca task-ul se schimba din afara cat nu edit, sincronizam draftul.
  useEffect(() => {
    if (!editing) setDraft(task.text);
  }, [task.text, editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft.trim() !== task.text) {
      props.onEditText(task.id, draft);
    } else {
      setDraft(task.text);
    }
  };

  const cancel = () => {
    setDraft(task.text);
    setEditing(false);
  };

  return (
    <div
      className={[
        "task",
        task.completed ? "task--done" : "",
        task.priority ? "task--priority" : "",
        selected ? "task--selected" : "",
        props.isDragging ? "task--dragging" : "",
        props.isDragOver ? "task--dragover" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      draggable={props.draggable && !editing}
      onClick={() => props.onSelect(task.id)}
      onDragStart={(e) => {
        // Necesar ca drag-ul sa porneasca fiabil in WebView/Chromium.
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(task.id));
        props.onDragStart?.(task.id);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        props.onDragOver?.(task.id);
      }}
      onDrop={(e) => {
        e.preventDefault();
        props.onDrop?.();
      }}
      onDragEnd={() => props.onDragEnd?.()}
    >
      <button
        className="task__check"
        role="checkbox"
        aria-checked={task.completed}
        aria-label={task.completed ? t("task.uncheck") : t("task.check")}
        onClick={(e) => {
          e.stopPropagation();
          props.onToggle(task.id);
        }}
      >
        {task.completed && (
          <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
            <path
              d="M3.5 8.5l3 3 6-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {task.priority && (
        <span className="task__prio" title={t("task.priority_mark")} aria-label={t("task.priority_mark")}>
          !
        </span>
      )}

      <div className="task__body">
        {editing ? (
          <input
            ref={inputRef}
            className="task__edit"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancel();
              }
            }}
          />
        ) : (
          <span
            className="task__text"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
          >
            {task.text || <span className="task__placeholder">{t("task.empty_placeholder")}</span>}
          </span>
        )}

        <div className="task__meta">
          <span title={t("task.created_title", { date: formatDateTime(task.createdAt, locale) })}>
            {t("task.created", { date: formatDateTime(task.createdAt, locale) })}
          </span>
          {task.completed && task.completedAt != null && (
            <>
              <span className="task__meta-sep">·</span>
              <span title={t("task.completed_title", { date: formatDateTime(task.completedAt, locale) })}>
                {t("task.completed", { date: formatDateTime(task.completedAt, locale) })}
              </span>
            </>
          )}
          {task.reminderAt != null && !task.completed && (
            <>
              <span className="task__meta-sep">·</span>
              <span className="task__reminder" title={t("task.reminder_at", { date: formatDateTime(task.reminderAt, locale) })}>
                <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
                  <path d="M8 2a3.2 3.2 0 0 0-3.2 3.2c0 3-1.3 4-1.3 4h9c0 0-1.3-1-1.3-4A3.2 3.2 0 0 0 8 2zM6.6 12a1.4 1.4 0 0 0 2.8 0" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {formatDateTime(task.reminderAt, locale)}
              </span>
            </>
          )}
        </div>
      </div>

      {task.completed && task.completedAt != null && (
        <ExpiryIndicator completedAt={task.completedAt} now={now} />
      )}

      {!task.completed && (
        <button
          className={`task__prio-btn ${task.reminderAt != null ? "task__prio-btn--on" : ""}`}
          style={task.reminderAt != null ? { color: "var(--accent)" } : undefined}
          aria-label={t("task.reminder")}
          title={t("task.reminder")}
          onClick={(e) => {
            e.stopPropagation();
            props.onOpenReminder(task.id);
          }}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path
              d="M8 1.6a3.6 3.6 0 0 0-3.6 3.6c0 3.4-1.5 4.4-1.5 4.4h10.2c0 0-1.5-1-1.5-4.4A3.6 3.6 0 0 0 8 1.6zM6.4 12.4a1.6 1.6 0 0 0 3.2 0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {!task.completed && (
        <button
          className={`task__prio-btn ${task.priority ? "task__prio-btn--on" : ""}`}
          aria-label={task.priority ? t("task.priority_on") : t("task.priority_off")}
          aria-pressed={task.priority}
          title={task.priority ? t("task.priority_on") : t("task.priority_off")}
          onClick={(e) => {
            e.stopPropagation();
            props.onTogglePriority(task.id);
          }}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path
              d="M4 14V2.5M4 3h7.5l-1.5 2.5 1.5 2.5H4"
              fill={task.priority ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      <button
        className="task__delete"
        aria-label={t("task.delete")}
        title={t("task.delete")}
        onClick={(e) => {
          e.stopPropagation();
          props.onDelete(task.id);
        }}
      >
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path
            d="M2.75 4h10.5M6 4V2.75h4V4M4.25 4l.5 9.25a1 1 0 0 0 1 .95h4.5a1 1 0 0 0 1-.95l.5-9.25M6.5 6.5v5M9.5 6.5v5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

// Un singur rand-task: checkbox, text editabil (dublu-click), datele de
// creare/finalizare si indicatorul circular de expirare (semnatura app-ului).

import { useEffect, useRef, useState } from "react";
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
  // Drag & drop (doar pentru task-urile active).
  draggable?: boolean;
  onDragStart?: (id: number) => void;
  onDragOver?: (id: number) => void;
  onDrop?: () => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
}

/** Inel circular care arata cat din cele 8h a trecut, plus timpul ramas. */
function ExpiryIndicator({ completedAt, now }: { completedAt: number; now: number }) {
  const remaining = msUntilExpiry(completedAt, now) ?? 0;
  const fraction = Math.max(0, Math.min(1, remaining / AUTO_DELETE_MS));
  const warning = remaining <= WARNING_MS;

  const R = 8;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - fraction);

  return (
    <span
      className={`expiry ${warning ? "expiry--warning" : ""}`}
      title={`Se sterge automat in ${formatCountdown(remaining)}`}
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
        selected ? "task--selected" : "",
        props.isDragging ? "task--dragging" : "",
        props.isDragOver ? "task--dragover" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      draggable={props.draggable && !editing}
      onClick={() => props.onSelect(task.id)}
      onDragStart={() => props.onDragStart?.(task.id)}
      onDragOver={(e) => {
        e.preventDefault();
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
        aria-label={task.completed ? "Debifeaza" : "Bifeaza"}
        onClick={(e) => {
          e.stopPropagation();
          props.onToggle(task.id);
        }}
      >
        {task.completed && (
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
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
            {task.text || <span className="task__placeholder">(gol — dublu-click pentru editare)</span>}
          </span>
        )}

        <div className="task__meta">
          <span title={`Creat: ${formatDateTime(task.createdAt)}`}>
            Creat {formatDateTime(task.createdAt)}
          </span>
          {task.completed && task.completedAt != null && (
            <>
              <span className="task__meta-sep">·</span>
              <span title={`Finalizat: ${formatDateTime(task.completedAt)}`}>
                Finalizat {formatDateTime(task.completedAt)}
              </span>
            </>
          )}
        </div>
      </div>

      {task.completed && task.completedAt != null && (
        <ExpiryIndicator completedAt={task.completedAt} now={now} />
      )}
    </div>
  );
}

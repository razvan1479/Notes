// Lista de task-uri. Activele apar primele (reordonabile prin drag & drop),
// task-urile bifate apar dedesubt, sub un separator.

import { useMemo, useState } from "react";
import type { Task, Recurrence } from "../types";
import type { NumberingStyle } from "../hooks/useNumbering";
import { TaskItem } from "./TaskItem";
import { useI18n } from "../i18n/i18n";

interface Props {
  tasks: Task[]; // deja filtrate dupa cautare
  now: number;
  selectedId: number | null;
  hasQuery: boolean;
  onSelect: (id: number | null) => void;
  onToggle: (id: number) => void;
  onEditText: (id: number, text: string) => void;
  onDelete: (id: number) => void;
  onTogglePriority: (id: number) => void;
  onOpenReminder: (id: number) => void;
  onAddSubtask: (taskId: number, text: string) => void;
  onAddSubtaskImage: (taskId: number, image: string) => void;
  onSetSubtaskImage: (taskId: number, subId: number, image: string | null) => void;
  onToggleSubtask: (taskId: number, subId: number) => void;
  onEditSubtask: (taskId: number, subId: number, text: string) => void;
  onDeleteSubtask: (taskId: number, subId: number) => void;
  onSetNote: (id: number, note: string | null) => void;
  onSetRecurrence: (id: number, rec: Recurrence | null) => void;
  onSetImage: (id: number, image: string | null) => void;
  numbering: NumberingStyle;
  onReorderActive: (orderedActiveIds: number[]) => void;
}

export function TaskList(props: Props) {
  const { t } = useI18n();
  const { tasks } = props;
  const [dragId, setDragId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);

  const active = useMemo(() => {
    // Task-urile cu prioritate stau mereu deasupra celor normale. In interiorul
    // fiecarui grup pastram ordinea existenta (position). Cand un task primeste
    // prioritate, urca automat sus; cand o pierde, coboara intre cele normale.
    const list = tasks.filter((t) => !t.completed);
    return list
      .map((t, i) => ({ t, i }))
      .sort((a, b) => {
        if (a.t.priority !== b.t.priority) return a.t.priority ? -1 : 1;
        return a.i - b.i;
      })
      .map((x) => x.t);
  }, [tasks]);
  const completed = useMemo(() => tasks.filter((t) => t.completed), [tasks]);

  const handleDrop = () => {
    if (dragId == null || overId == null || dragId === overId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const ids = active.map((t) => t.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(overId);
    if (from !== -1 && to !== -1) {
      ids.splice(to, 0, ids.splice(from, 1)[0]);
      props.onReorderActive(ids);
    }
    setDragId(null);
    setOverId(null);
  };

  const renderItem = (task: Task, allowDrag: boolean, number: number | null) => (
    <TaskItem
      key={task.id}
      task={task}
      now={props.now}
      selected={props.selectedId === task.id}
      number={number}
      numbering={props.numbering}
      onSelect={props.onSelect}
      onToggle={props.onToggle}
      onEditText={props.onEditText}
      onDelete={props.onDelete}
      onTogglePriority={props.onTogglePriority}
      onOpenReminder={props.onOpenReminder}
      onAddSubtask={props.onAddSubtask}
      onAddSubtaskImage={props.onAddSubtaskImage}
      onSetSubtaskImage={props.onSetSubtaskImage}
      onToggleSubtask={props.onToggleSubtask}
      onEditSubtask={props.onEditSubtask}
      onDeleteSubtask={props.onDeleteSubtask}
      onSetNote={props.onSetNote}
      onSetRecurrence={props.onSetRecurrence}
      onSetImage={props.onSetImage}
      draggable={allowDrag}
      onDragStart={setDragId}
      onDragOver={setOverId}
      onDrop={handleDrop}
      onDragEnd={() => {
        setDragId(null);
        setOverId(null);
      }}
      isDragging={dragId === task.id}
      isDragOver={overId === task.id && dragId !== task.id}
    />
  );

  const empty = tasks.length === 0;

  return (
    <div className="list">
      {empty && (
        <div className="empty">
          {props.hasQuery ? (
            <p>{t("list.empty_search")}</p>
          ) : (
            <>
              <p className="empty__title">{t("list.empty_title")}</p>
              <p className="empty__hint">{t("list.empty_hint")}</p>
            </>
          )}
        </div>
      )}

      {active.length > 0 && (
        <section className="list__section">
          {active.map((t, i) => renderItem(t, !props.hasQuery, props.numbering === "off" ? null : i + 1))}
        </section>
      )}

      {completed.length > 0 && (
        <section className="list__section">
          <div className="list__divider">
            <span>{t("list.completed")}</span>
            <span className="list__count">{completed.length}</span>
          </div>
          {completed.map((t) => renderItem(t, false, null))}
        </section>
      )}
    </div>
  );
}

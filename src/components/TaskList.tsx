// Lista de task-uri. Activele apar primele (reordonabile prin drag & drop),
// task-urile bifate apar dedesubt, sub un separator.

import { useMemo, useState } from "react";
import type { Task } from "../types";
import { TaskItem } from "./TaskItem";

interface Props {
  tasks: Task[]; // deja filtrate dupa cautare
  now: number;
  selectedId: number | null;
  hasQuery: boolean;
  onSelect: (id: number) => void;
  onToggle: (id: number) => void;
  onEditText: (id: number, text: string) => void;
  onDelete: (id: number) => void;
  onReorderActive: (orderedActiveIds: number[]) => void;
}

export function TaskList(props: Props) {
  const { tasks } = props;
  const [dragId, setDragId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);

  const active = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
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

  const renderItem = (task: Task, allowDrag: boolean) => (
    <TaskItem
      key={task.id}
      task={task}
      now={props.now}
      selected={props.selectedId === task.id}
      onSelect={props.onSelect}
      onToggle={props.onToggle}
      onEditText={props.onEditText}
      onDelete={props.onDelete}
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
            <p>Niciun task nu se potriveste cautarii.</p>
          ) : (
            <>
              <p className="empty__title">Nimic de facut deocamdata</p>
              <p className="empty__hint">Scrie mai sus si apasa Enter ca sa adaugi primul task.</p>
            </>
          )}
        </div>
      )}

      {active.length > 0 && (
        <section className="list__section">
          {active.map((t) => renderItem(t, !props.hasQuery))}
        </section>
      )}

      {completed.length > 0 && (
        <section className="list__section">
          <div className="list__divider">
            <span>Finalizate</span>
            <span className="list__count">{completed.length}</span>
          </div>
          {completed.map((t) => renderItem(t, false))}
        </section>
      )}
    </div>
  );
}

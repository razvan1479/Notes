// Campul de adaugare rapida. Enter adauga task-ul si golește campul,
// gata pentru urmatorul (flux rapid de tip "brain dump").

import { forwardRef, useState } from "react";

interface Props {
  onAdd: (text: string) => void;
}

export const TaskInput = forwardRef<HTMLInputElement, Props>(({ onAdd }, ref) => {
  const [value, setValue] = useState("");

  const submit = () => {
    const text = value.trim();
    if (!text) return;
    onAdd(text);
    setValue("");
  };

  return (
    <div className="add">
      <span className="add__plus" aria-hidden="true">
        +
      </span>
      <input
        ref={ref}
        className="add__input"
        type="text"
        placeholder="Adauga un task si apasa Enter…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
      />
    </div>
  );
});

TaskInput.displayName = "TaskInput";

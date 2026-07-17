// Campul de adaugare rapida. Enter adauga task-ul si golește campul,
// gata pentru urmatorul (flux rapid de tip "brain dump").

import { forwardRef, useState } from "react";
import { useI18n } from "../i18n/i18n";

interface Props {
  onAdd: (text: string) => void;
}

export const TaskInput = forwardRef<HTMLInputElement, Props>(({ onAdd }, ref) => {
  const { t } = useI18n();
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
        placeholder={t("input.placeholder")}
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

// Campul de adaugare rapida. Enter adauga task-ul si golește campul,
// gata pentru urmatorul (flux rapid de tip "brain dump").
// Poti si lipi un screenshot (Ctrl+V) ca sa creezi un task cu poza.

import { forwardRef, useState } from "react";
import { useI18n } from "../i18n/i18n";
import { readAndCompressImage, findPastedImage } from "../lib/image";

interface Props {
  onAdd: (text: string) => void;
  onAddImage: (image: string, text?: string) => void;
}

export const TaskInput = forwardRef<HTMLInputElement, Props>(
  ({ onAdd, onAddImage }, ref) => {
    const { t } = useI18n();
    const [value, setValue] = useState("");

    const submit = () => {
      const text = value.trim();
      if (!text) return;
      onAdd(text);
      setValue("");
    };

    const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
      const img = findPastedImage(e.clipboardData);
      if (!img) return; // nu e imagine -> lasa lipirea normala de text
      e.preventDefault();
      const text = value.trim();
      try {
        const dataUrl = await readAndCompressImage(img);
        onAddImage(dataUrl, text);
        setValue("");
      } catch {
        /* imagine invalida, ignoram */
      }
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
          onPaste={handlePaste}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
      </div>
    );
  }
);

TaskInput.displayName = "TaskInput";

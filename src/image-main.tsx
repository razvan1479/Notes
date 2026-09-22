// Fereastra SEPARATA de vizualizare a unei poze de task.
// Poza (data URL) e trimisa prin baza de date sub o cheie temporara, ca sa nu
// depinda de lungimea adresei. Suporta zoom (scroll / butoane) si pan (drag).

import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import { getImagePayload } from "./db/database";
import "./styles.css";

const THEME_KEY = "quicktasks.theme";

function ImageWindow() {
  const [src, setSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    document.documentElement.dataset.theme = saved === "dark" ? "dark" : "light";
  }, []);

  // Cheia poentru poza vine prin adresa (?k=...); continutul din baza de date.
  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("k");
    if (!key) return;
    getImagePayload(key)
      .then((data) => setSrc(data))
      .catch(() => setSrc(null));
  }, []);

  const zoomBy = (factor: number) =>
    setZoom((z) => Math.min(8, Math.max(0.2, z * factor)));

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    zoomBy(e.deltaY < 0 ? 1.15 : 1 / 1.15);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag.current) return;
    setOffset({
      x: drag.current.ox + (e.clientX - drag.current.x),
      y: drag.current.oy + (e.clientY - drag.current.y),
    });
  };
  const endDrag = () => {
    drag.current = null;
  };

  return (
    <div className="imgwin" onWheel={onWheel}>
      <div
        className="imgwin__stage"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onDoubleClick={reset}
      >
        {src ? (
          <img
            src={src}
            alt=""
            className="imgwin__img"
            draggable={false}
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              cursor: zoom > 1 ? "grab" : "default",
            }}
          />
        ) : (
          <div className="imgwin__empty">…</div>
        )}
      </div>

      <div className="imgwin__bar">
        <button className="imgwin__btn" onClick={() => zoomBy(1 / 1.25)} aria-label="-">
          −
        </button>
        <span className="imgwin__zoom">{Math.round(zoom * 100)}%</span>
        <button className="imgwin__btn" onClick={() => zoomBy(1.25)} aria-label="+">
          +
        </button>
        <button className="imgwin__btn imgwin__btn--wide" onClick={reset}>
          100%
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ImageWindow />
  </React.StrictMode>
);

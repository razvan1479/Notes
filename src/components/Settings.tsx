// Panoul de setari. Contine comutatorul de pornire automata cu Windows
// (prin tauri-plugin-autostart) si selectorul de tema.

import { useEffect, useState } from "react";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { UpdateButton } from "./UpdateButton";
import type { ThemeMode } from "../types";

interface Props {
  theme: ThemeMode;
  onSetTheme: (t: ThemeMode) => void;
  onClose: () => void;
}

export function Settings({ theme, onSetTheme, onClose }: Props) {
  const [autostart, setAutostart] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Citim starea reala de la sistem la deschiderea panoului.
  useEffect(() => {
    isEnabled()
      .then(setAutostart)
      .catch((e) => {
        console.error(e);
        setError("Nu am putut citi starea pornirii automate.");
      });
  }, []);

  const toggleAutostart = async () => {
    if (autostart == null || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (autostart) {
        await disable();
        setAutostart(false);
      } else {
        await enable();
        setAutostart(true);
      }
    } catch (e) {
      console.error(e);
      setError("Nu am putut schimba pornirea automata.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="settings" onClick={(e) => e.stopPropagation()}>
        <div className="settings__head">
          <h2>Setari</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Inchide setarile">
            ×
          </button>
        </div>

        <div className="settings__row">
          <div className="settings__label">
            <span className="settings__title">Porneste odata cu Windows</span>
            <span className="settings__desc">
              Aplicatia se deschide automat dupa logare, minimizata in System Tray.
            </span>
          </div>
          <button
            className={`switch ${autostart ? "switch--on" : ""}`}
            role="switch"
            aria-checked={!!autostart}
            disabled={autostart == null || busy}
            onClick={toggleAutostart}
          >
            <span className="switch__knob" />
          </button>
        </div>

        <div className="settings__row">
          <div className="settings__label">
            <span className="settings__title">Tema</span>
            <span className="settings__desc">Alege aspectul deschis sau intunecat.</span>
          </div>
          <div className="segmented">
            <button
              className={theme === "light" ? "segmented__opt segmented__opt--on" : "segmented__opt"}
              onClick={() => onSetTheme("light")}
            >
              Light
            </button>
            <button
              className={theme === "dark" ? "segmented__opt segmented__opt--on" : "segmented__opt"}
              onClick={() => onSetTheme("dark")}
            >
              Dark
            </button>
          </div>
        </div>

        <UpdateButton />

        {error && <p className="settings__error">{error}</p>}

        <p className="settings__foot">
          Task-urile bifate se sterg automat la 8h. Datele sunt salvate local.
        </p>
      </div>
    </div>
  );
}

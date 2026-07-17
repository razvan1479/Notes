// Panoul de setari: limba, pornire automata, tema, scriere (font + marime) si culori.

import { useEffect, useState } from "react";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { getVersion } from "@tauri-apps/api/app";
import { ColorCustomizer } from "./ColorCustomizer";
import { useTypography, MIN_SIZE, MAX_SIZE } from "../hooks/useTypography";
import { useI18n } from "../i18n/i18n";
import { LANGUAGES } from "../i18n/translations";
import type { ThemeMode } from "../types";
import type { useColors } from "../hooks/useColors";

interface Props {
  theme: ThemeMode;
  onSetTheme: (t: ThemeMode) => void;
  onClose: () => void;
  colors: ReturnType<typeof useColors>;
}

export function Settings({ theme, onSetTheme, onClose, colors }: Props) {
  const { t, lang, setLang } = useI18n();
  const [autostart, setAutostart] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const type = useTypography();

  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => setVersion(null)); // in browser/preview nu exista
  }, []);

  useEffect(() => {
    isEnabled()
      .then(setAutostart)
      .catch((e) => {
        console.error(e);
        setError(t("settings.autostart_read_err"));
      });
  }, [t]);

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
      setError(t("settings.autostart_change_err"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="settings" onClick={(e) => e.stopPropagation()}>
        <div className="settings__head">
          <h2>{t("settings.title")}</h2>
          <button className="icon-btn" onClick={onClose} aria-label={t("settings.close")}>
            ×
          </button>
        </div>

        <div className="settings__row">
          <div className="settings__label">
            <span className="settings__title">{t("settings.language_title")}</span>
            <span className="settings__desc">{t("settings.language_desc")}</span>
          </div>
          <div className="segmented">
            {LANGUAGES.map((l) => (
              <button
                key={l.id}
                className={lang === l.id ? "segmented__opt segmented__opt--on" : "segmented__opt"}
                onClick={() => setLang(l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="settings__row">
          <div className="settings__label">
            <span className="settings__title">{t("settings.autostart_title")}</span>
            <span className="settings__desc">{t("settings.autostart_desc")}</span>
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
            <span className="settings__title">{t("settings.theme_title")}</span>
            <span className="settings__desc">{t("settings.theme_desc")}</span>
          </div>
          <div className="segmented">
            <button
              className={theme === "light" ? "segmented__opt segmented__opt--on" : "segmented__opt"}
              onClick={() => onSetTheme("light")}
            >
              {t("settings.theme_light")}
            </button>
            <button
              className={theme === "dark" ? "segmented__opt segmented__opt--on" : "segmented__opt"}
              onClick={() => onSetTheme("dark")}
            >
              {t("settings.theme_dark")}
            </button>
          </div>
        </div>

        <div className="settings__row settings__row--block">
          <span className="settings__title">{t("settings.type_title")}</span>
          <span className="settings__desc">{t("settings.type_desc")}</span>

          <div className="type-field">
            <span className="type-field__label">{t("settings.font")}</span>
            <div className="segmented segmented--wrap">
              {type.fonts.map((f) => (
                <button
                  key={f.id}
                  className={`segmented__opt ${type.font === f.id ? "segmented__opt--on" : ""}`}
                  style={f.stack ? { fontFamily: f.stack } : undefined}
                  onClick={() => type.setFont(f.id)}
                >
                  {f.id === "system" ? t("font.system") : f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="type-field">
            <span className="type-field__label">{t("settings.size", { n: type.size })}</span>
            <input
              className="type-slider"
              type="range"
              min={MIN_SIZE}
              max={MAX_SIZE}
              value={type.size}
              onChange={(e) => type.setSize(Number(e.target.value))}
              aria-label={t("settings.size_aria")}
            />
          </div>
        </div>

        <div className="settings__row settings__row--block">
          <ColorCustomizer colors={colors} theme={theme} />
        </div>

        {error && <p className="settings__error">{error}</p>}

        <p className="settings__foot">
          {t("settings.foot")}
          {version && <span className="settings__version">{t("settings.version", { v: version })}</span>}
        </p>
      </div>
    </div>
  );
}

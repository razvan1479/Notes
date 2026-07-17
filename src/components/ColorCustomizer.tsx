// Grila de personalizare a culorilor. Fiecare rand = un element din interfata
// cu un selector de culoare. Modificarile se vad instant si se salveaza.

import type { useColors } from "../hooks/useColors";
import type { ThemeMode } from "../types";
import { useI18n } from "../i18n/i18n";

interface Props {
  colors: ReturnType<typeof useColors>;
  theme: ThemeMode;
}

export function ColorCustomizer({ colors, theme }: Props) {
  const { t } = useI18n();
  const themeAdj = theme === "dark" ? t("theme.dark_adj") : t("theme.light_adj");

  return (
    <div className="colors">
      <div className="colors__head">
        <span className="settings__title">{t("colors.title")}</span>
        {colors.customized && (
          <button className="colors__reset" onClick={colors.resetColors}>
            {t("colors.reset")}
          </button>
        )}
      </div>
      <span className="settings__desc">{t("colors.desc", { theme: themeAdj })}</span>

      <div className="colors__grid">
        {colors.tokens.map((token) => (
          <label key={token.key} className="color-row">
            <span className="color-row__label">{t(token.labelKey)}</span>
            <span className="color-row__swatch">
              <input
                type="color"
                value={colors.getColor(token.key)}
                onChange={(e) => colors.setColor(token.key, e.target.value)}
                aria-label={t(token.labelKey)}
              />
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

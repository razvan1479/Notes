// Grila de personalizare a culorilor. Fiecare rand = un element din interfata
// cu un selector de culoare. Modificarile se vad instant si se salveaza.

import type { useColors } from "../hooks/useColors";
import type { ThemeMode } from "../types";

interface Props {
  colors: ReturnType<typeof useColors>;
  theme: ThemeMode;
}

export function ColorCustomizer({ colors, theme }: Props) {
  return (
    <div className="colors">
      <div className="colors__head">
        <span className="settings__title">Culori</span>
        {colors.customized && (
          <button className="colors__reset" onClick={colors.resetColors}>
            Reseteaza
          </button>
        )}
      </div>
      <span className="settings__desc">
        Personalizeaza fiecare element. Culorile se salveaza separat pentru tema{" "}
        {theme === "dark" ? "intunecata" : "deschisa"}.
      </span>

      <div className="colors__grid">
        {colors.tokens.map((token) => (
          <label key={token.key} className="color-row">
            <span className="color-row__label">{token.label}</span>
            <span className="color-row__swatch">
              <input
                type="color"
                value={colors.getColor(token.key)}
                onChange={(e) => colors.setColor(token.key, e.target.value)}
                aria-label={token.label}
              />
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

// Bara compacta de gamificare, deasupra campului de adaugare.
// Nivel + bara de XP; click pe ea deschide realizarile. Toast scurt la deblocare.

import { useI18n } from "../i18n/i18n";

interface Props {
  level: number;
  into: number;
  need: number;
  progress: number;
  toast: string | null;
  onOpen: () => void;
}

export function GamificationBar({ level, into, need, progress, toast, onOpen }: Props) {
  const { t } = useI18n();

  return (
    <div className="game-wrap">
      <button className="game" onClick={onOpen} title={t("gam.title")}>
        <span className="game__level">{t("gam.level", { n: level })}</span>
        <span className="game__bar">
          <span
            className="game__fill"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </span>
        <span className="game__xp">{t("gam.xp", { into, need })}</span>
      </button>

      {toast && (
        <div className="game__toast">
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d="M8 1.5l1.8 3.7 4 .6-2.9 2.8.7 4L8 10.9 4.4 12.6l.7-4L2.2 5.8l4-.6z" fill="currentColor" />
          </svg>
          <span>
            {t("gam.unlocked")} <b>{t(`ach.${toast}.name`)}</b>
          </span>
        </div>
      )}
    </div>
  );
}

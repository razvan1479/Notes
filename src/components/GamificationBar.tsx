// Bara compacta de gamificare, deasupra campului de adaugare.
// Badge curent + nivel + bara de XP; click deschide realizarile. Toast la deblocare.

import { useI18n } from "../i18n/i18n";
import type { Achievement } from "../gamification/achievements";

interface Props {
  level: number;
  into: number;
  need: number;
  progress: number;
  badge: Achievement | null;
  toast: string | null;
  onOpen: () => void;
}

function Medal({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" style={{ color }}>
      <path
        d="M12 2l2.6 5.4 6 .9-4.3 4.2 1 6L12 15.8 6.7 18.5l1-6L3.4 8.3l6-.9z"
        fill="currentColor"
      />
    </svg>
  );
}

export function GamificationBar({ level, into, need, progress, badge, toast, onOpen }: Props) {
  const { t } = useI18n();

  return (
    <div className="game-wrap">
      <button className="game" onClick={onOpen} title={t("gam.title")}>
        <span className="game__top">
          <Medal color={badge ? badge.color : "var(--text-muted)"} />
          {badge && (
            <span className="game__badge-name" style={{ color: badge.color }}>
              {t(`ach.${badge.id}.name`)}
            </span>
          )}
        </span>
        <span className="game__row">
          <span className="game__level">{t("gam.level", { n: level })}</span>
          <span className="game__bar">
            <span
              className="game__fill"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </span>
          <span className="game__xp">{t("gam.xp", { into, need })}</span>
        </span>
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

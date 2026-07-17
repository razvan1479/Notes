// Fereastra cu realizarile: rezumat (nivel, XP total, terminate) + grila de
// badge-uri, cele deblocate colorate, cele blocate estompate.

import { useI18n } from "../i18n/i18n";
import type { Achievement } from "../gamification/achievements";

interface Props {
  level: number;
  xp: number;
  completed: number;
  achievements: (Achievement & { unlocked: boolean })[];
  onClose: () => void;
}

export function AchievementsModal({ level, xp, completed, achievements, onClose }: Props) {
  const { t } = useI18n();

  return (
    <div className="overlay" onClick={onClose}>
      <div className="achievements" onClick={(e) => e.stopPropagation()}>
        <div className="settings__head">
          <h2>{t("gam.title")}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="×">×</button>
        </div>

        <div className="ach-summary">
          <div className="ach-summary__level">{t("gam.level", { n: level })}</div>
          <div className="ach-summary__sub">{t("gam.total_xp", { xp, completed })}</div>
        </div>

        <div className="ach-grid">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`ach ${a.unlocked ? "ach--on" : "ach--off"}`}
            >
              <span className="ach__icon">
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                  <path d="M12 2l2.6 5.4 6 .9-4.3 4.2 1 6L12 15.8 6.7 18.5l1-6L3.4 8.3l6-.9z" fill="currentColor" />
                </svg>
              </span>
              <div className="ach__text">
                <span className="ach__name">{t(`ach.${a.id}.name`)}</span>
                <span className="ach__desc">{t(`ach.${a.id}.desc`)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

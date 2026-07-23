// Istoricul versiunilor, in doua moduri:
//  - mode "new": pop-up cu noutatile inca necitite, cu buton "Am inteles".
//    Se inchide DOAR de la buton (altfel reapare la urmatoarea pornire).
//  - mode "all": istoricul complet, deschis oricand din bara de sus.

import { CHANGELOG, type ChangeType, type ChangelogEntry } from "../changelog";
import { useI18n } from "../i18n/i18n";

interface Props {
  mode: "new" | "all";
  entries?: ChangelogEntry[];
  isRead: (version: string) => boolean;
  onAcknowledge: () => void;
  onClose: () => void;
}

const TAG_CLASS: Record<ChangeType, string> = {
  new: "cl__tag--new",
  fix: "cl__tag--fix",
  improved: "cl__tag--imp",
};

export function ChangelogModal({ mode, entries, isRead, onAcknowledge, onClose }: Props) {
  const { t, lang, locale } = useI18n();
  const list = mode === "new" ? entries ?? [] : CHANGELOG;

  const formatDate = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="changelog" onClick={(e) => e.stopPropagation()}>
        <div className="settings__head">
          <h2>{mode === "new" ? t("changelog.new_title") : t("changelog.title")}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="×">×</button>
        </div>

        {mode === "new" && <p className="cl__intro">{t("changelog.new_intro")}</p>}

        {list.map((entry) => {
          const unread = mode === "new" || !isRead(entry.version);
          return (
            <div
              key={entry.version}
              className={`cl__group ${unread ? "cl__group--unread" : "cl__group--read"}`}
            >
              <div className="cl__ver-head">
                {unread && <span className="cl__dot" aria-hidden="true" />}
                <span className="cl__ver-num">v{entry.version}</span>
                <span className="cl__ver-date">{formatDate(entry.date)}</span>
                {unread && <span className="cl__new-pill">{t("changelog.new")}</span>}
              </div>

              <div className="cl__list">
                {entry.changes.map((c, i) => (
                  <div key={i} className="cl__item">
                    <span className={`cl__tag ${TAG_CLASS[c.type]}`}>
                      {t(`changelog.type_${c.type}`)}
                    </span>
                    <span className="cl__text">{lang === "ro" ? c.ro : c.en}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {mode === "new" && (
          <div className="popup__actions">
            <button className="popup__btn popup__btn--primary" onClick={onAcknowledge}>
              {t("changelog.ack")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

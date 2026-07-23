// Istoricul versiunilor: fiecare versiune cu data si lista schimbarilor.
// Versiunile necitite sunt evidentiate (bulina + eticheta "nou"); dupa
// deschidere se marcheaza citite.

import { useEffect } from "react";
import { CHANGELOG, type ChangeType } from "../changelog";
import { useI18n } from "../i18n/i18n";

interface Props {
  isRead: (version: string) => boolean;
  onMarkAllRead: () => void;
  onClose: () => void;
}

const TAG_CLASS: Record<ChangeType, string> = {
  new: "cl__tag--new",
  fix: "cl__tag--fix",
  improved: "cl__tag--imp",
};

export function ChangelogModal({ isRead, onMarkAllRead, onClose }: Props) {
  const { t, lang, locale } = useI18n();

  // La deschidere marcam tot ca citit (dar randam starea de dinainte, ca sa se
  // vada ce era nou in sesiunea asta).
  useEffect(() => {
    onMarkAllRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="changelog" onClick={(e) => e.stopPropagation()}>
        <div className="settings__head">
          <h2>{t("changelog.title")}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="×">×</button>
        </div>

        {CHANGELOG.map((entry) => {
          const unread = !isRead(entry.version);
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
      </div>
    </div>
  );
}

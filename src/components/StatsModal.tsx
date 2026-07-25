// Ecranul de statistici: cateva cifre cheie + un grafic cu ultimele 7 zile.
// Datele vin din tabelul stats_daily (o intrare per zi cu numarul de terminari).

import { useEffect, useState } from "react";
import { useI18n } from "../i18n/i18n";
import { getDailyStats, type DailyStat } from "../db/database";

interface Props {
  level: number;
  onClose: () => void;
}

/** Ziua locala ca YYYY-MM-DD. */
function localDay(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function StatsModal({ level, onClose }: Props) {
  const { t, locale } = useI18n();
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getDailyStats(31)
      .then((rows) => setStats(rows))
      .catch(() => setStats([]))
      .finally(() => setLoaded(true));
  }, []);

  const byDay = new Map(stats.map((s) => [s.day, s.completed]));

  // Ultimele 7 zile (inclusiv azi), in ordine.
  const days: { key: string; date: Date; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = localDay(d);
    days.push({ key, date: d, count: byDay.get(key) ?? 0 });
  }

  const today = days[days.length - 1].count;
  const week = days.reduce((s, d) => s + d.count, 0);
  const maxCount = Math.max(1, ...days.map((d) => d.count));

  // Serie de zile la rand cu cel putin un task terminat, pana azi.
  let streak = 0;
  {
    const d = new Date();
    // Daca azi n-are nimic, seria se numara pana ieri.
    if ((byDay.get(localDay(d)) ?? 0) === 0) d.setDate(d.getDate() - 1);
    while ((byDay.get(localDay(d)) ?? 0) > 0) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
  }

  const dayLabel = (d: Date) =>
    d.toLocaleDateString(locale, { weekday: "short" }).replace(".", "");

  return (
    <div className="overlay" onClick={onClose}>
      <div className="stats-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings__head">
          <h2>{t("stats.title")}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="×">×</button>
        </div>

        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-num">{today}</div>
            <div className="stat-lab">{t("stats.today")}</div>
          </div>
          <div className="stat-card stat-card--streak">
            <div className="stat-num">{streak}</div>
            <div className="stat-lab">{t("stats.streak")}</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{week}</div>
            <div className="stat-lab">{t("stats.week")}</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{level}</div>
            <div className="stat-lab">{t("stats.level")}</div>
          </div>
        </div>

        <div className="stat-chart">
          <h3>{t("stats.last7")}</h3>
          <div className="stat-bars">
            {days.map((d) => (
              <div key={d.key} className="stat-bar-col">
                <div className="stat-bar-wrap">
                  <span className="stat-bar-val">{d.count > 0 ? d.count : ""}</span>
                  <div
                    className="stat-bar"
                    style={{ height: `${Math.round((d.count / maxCount) * 100)}%` }}
                  />
                </div>
                <span className="stat-bar-lab">{dayLabel(d.date)}</span>
              </div>
            ))}
          </div>
        </div>

        {loaded && week === 0 && streak === 0 && (
          <p className="stat-empty">{t("stats.empty")}</p>
        )}
      </div>
    </div>
  );
}

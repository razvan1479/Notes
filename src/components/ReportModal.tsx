// Fereastra de raport lunar: grila cu 4 casete (Highlights last month,
// Lowlights last month, Actual risks, Outlook). Un raport per luna, salvat
// automat. Se poate copia fiecare caseta sau tot raportul; un buton adauga
// buline la textul din caseta.

import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n/i18n";
import {
  getReport,
  getReportMonths,
  saveReport,
  type MonthlyReport,
} from "../db/database";

interface Props {
  onClose?: () => void;
  standalone?: boolean;
}

type SectionKey = "highlights" | "lowlights" | "risks" | "outlook";

const SECTIONS: { key: SectionKey; titleKey: string }[] = [
  { key: "highlights", titleKey: "report.highlights" },
  { key: "lowlights", titleKey: "report.lowlights" },
  { key: "risks", titleKey: "report.risks" },
  { key: "outlook", titleKey: "report.outlook" },
];

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Adauga "• " la inceputul fiecarui rand neinceput deja cu bulina. */
function bulletize(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      const t = line.trim();
      if (!t) return line;
      if (t.startsWith("• ")) return line;
      if (t.startsWith("•")) return line.replace(/•\s?/, "• ");
      return "• " + line.replace(/^\s+/, "");
    })
    .join("\n");
}

const EMPTY = (m: string): MonthlyReport => ({
  month: m,
  highlights: "",
  lowlights: "",
  risks: "",
  outlook: "",
});

export function ReportModal({ onClose, standalone }: Props) {
  const { t, locale } = useI18n();
  const [month, setMonth] = useState<string>(currentMonth());
  const [months, setMonths] = useState<string[]>([]);
  const [report, setReport] = useState<MonthlyReport>(EMPTY(currentMonth()));
  const [copied, setCopied] = useState<string | null>(null);
  const saveTimer = useRef<number | null>(null);

  // Lista lunilor existente (plus luna curenta, mereu disponibila).
  useEffect(() => {
    getReportMonths().then((list) => {
      const set = new Set(list);
      set.add(currentMonth());
      setMonths(Array.from(set).sort((a, b) => b.localeCompare(a)));
    });
  }, []);

  // Incarca raportul cand se schimba luna.
  useEffect(() => {
    let active = true;
    getReport(month).then((r) => {
      if (active) setReport(r ?? EMPTY(month));
    });
    return () => {
      active = false;
    };
  }, [month]);

  // Salvare automata (debounce), cand se schimba textul.
  const persist = (next: MonthlyReport) => {
    setReport(next);
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void saveReport(next);
      setMonths((prev) => (prev.includes(next.month) ? prev : [next.month, ...prev]));
    }, 400);
  };

  const setField = (key: SectionKey, value: string) =>
    persist({ ...report, [key]: value });

  const monthLabel = (m: string) => {
    const [y, mo] = m.split("-").map(Number);
    return new Date(y, mo - 1, 1).toLocaleDateString(locale, {
      month: "long",
      year: "numeric",
    });
  };

  const flash = (id: string) => {
    setCopied(id);
    window.setTimeout(() => setCopied((c) => (c === id ? null : c)), 1200);
  };

  const copyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flash(id);
    } catch {
      /* clipboard indisponibil */
    }
  };

  const copyAll = () => {
    const parts = SECTIONS.map((s) => {
      const body = report[s.key].trim();
      return `${t(s.titleKey)}\n${body}`;
    });
    void copyText(parts.join("\n\n"), "all");
  };

  const body = (
      <div className={standalone ? "report report--full" : "report"} onClick={(e) => e.stopPropagation()}>
        <div className="report__head">
          <h2>{t("report.title")}</h2>
          <div className="report__head-right">
            <select
              className="report__month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </select>
            {!standalone && (
              <button className="icon-btn" onClick={onClose} aria-label="×">
                ×
              </button>
            )}
          </div>
        </div>

        <div className="report__grid">
          {SECTIONS.map((s) => (
            <div key={s.key} className="report__cell">
              <div className="report__cell-head">{t(s.titleKey)}</div>
              <textarea
                className="report__area"
                placeholder={t("report.placeholder")}
                value={report[s.key]}
                onChange={(e) => setField(s.key, e.target.value)}
              />
              <div className="report__cell-actions">
                <button
                  className="report__mini"
                  title={t("report.bullets")}
                  onClick={() => setField(s.key, bulletize(report[s.key]))}
                >
                  {t("report.bullets")}
                </button>
                <button
                  className="report__mini"
                  onClick={() => copyText(report[s.key], s.key)}
                >
                  {copied === s.key ? t("report.copied") : t("report.copy")}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="report__foot">
          <span className="report__hint">{t("report.autosave")}</span>
          <button className="popup__btn popup__btn--primary" onClick={copyAll}>
            {copied === "all" ? t("report.copied") : t("report.copy_all")}
          </button>
        </div>
      </div>
  );

  if (standalone) return body;
  return (
    <div className="overlay" onClick={onClose}>
      {body}
    </div>
  );
}

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

/** Deplaseaza o luna "YYYY-MM" cu delta luni (poate fi negativ sau pozitiv). */
function shiftMonth(m: string, delta: number): string {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Comuta bulina "• " DOAR pe randul unde e cursorul (selectionStart). */
function toggleBulletAtCursor(
  el: HTMLTextAreaElement
): { text: string; caret: number } {
  const value = el.value;
  const pos = el.selectionStart ?? value.length;
  // Gasim inceputul si sfarsitul randului curent.
  const lineStart = value.lastIndexOf("\n", pos - 1) + 1;
  let lineEnd = value.indexOf("\n", pos);
  if (lineEnd === -1) lineEnd = value.length;
  const line = value.slice(lineStart, lineEnd);

  const hasBullet = /^\s*•\s?/.test(line);
  let newLine: string;
  let delta: number;
  if (hasBullet) {
    // Scoatem bulina.
    newLine = line.replace(/^(\s*)•\s?/, "$1");
    delta = newLine.length - line.length;
  } else {
    // Adaugam bulina, pastrand eventuala indentare.
    const indent = line.match(/^\s*/)?.[0] ?? "";
    newLine = indent + "• " + line.slice(indent.length);
    delta = newLine.length - line.length;
  }
  const text = value.slice(0, lineStart) + newLine + value.slice(lineEnd);
  const caret = Math.max(lineStart, pos + delta);
  return { text, caret };
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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState<number>(
    Number(currentMonth().split("-")[0])
  );
  const saveTimer = useRef<number | null>(null);
  const areaRefs = useRef<Record<SectionKey, HTMLTextAreaElement | null>>({
    highlights: null,
    lowlights: null,
    risks: null,
    outlook: null,
  });

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

  const shortMonths = Array.from({ length: 12 }, (_, i) =>
    new Date(2000, i, 1).toLocaleDateString(locale, { month: "short" }).replace(".", "")
  );

  const goMonth = (m: string) => {
    setMonth(m);
    setPickerYear(Number(m.split("-")[0]));
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

  const body = (
      <div className={standalone ? "report report--full" : "report"} onClick={(e) => { e.stopPropagation(); setPickerOpen(false); }}>
        <div className="report__head">
          <h2>{t("report.title")}</h2>
          <div className="report__head-right">
            <div className="monthnav" onClick={(e) => e.stopPropagation()}>
              <button
                className="monthnav__arrow"
                aria-label={t("report.prev_month")}
                title={t("report.prev_month")}
                onClick={() => goMonth(shiftMonth(month, -1))}
              >
                ‹
              </button>
              <button
                className="monthnav__label"
                onClick={() => setPickerOpen((v) => !v)}
                aria-expanded={pickerOpen}
              >
                {monthLabel(month)} ▾
              </button>
              <button
                className="monthnav__arrow"
                aria-label={t("report.next_month")}
                title={t("report.next_month")}
                onClick={() => goMonth(shiftMonth(month, 1))}
              >
                ›
              </button>

              {pickerOpen && (
                <div className="monthpop" onClick={(e) => e.stopPropagation()}>
                  <div className="monthpop__year">
                    <button
                      className="monthpop__ybtn"
                      aria-label="-1"
                      onClick={() => setPickerYear((y) => y - 1)}
                    >
                      ‹
                    </button>
                    <b>{pickerYear}</b>
                    <button
                      className="monthpop__ybtn"
                      aria-label="+1"
                      onClick={() => setPickerYear((y) => y + 1)}
                    >
                      ›
                    </button>
                  </div>
                  <div className="monthpop__grid">
                    {shortMonths.map((name, i) => {
                      const key = `${pickerYear}-${String(i + 1).padStart(2, "0")}`;
                      const isSel = key === month;
                      const hasReport = months.includes(key);
                      return (
                        <button
                          key={key}
                          className={[
                            "monthpop__m",
                            isSel ? "monthpop__m--sel" : "",
                            hasReport ? "monthpop__m--has" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          onClick={() => {
                            goMonth(key);
                            setPickerOpen(false);
                          }}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    className="monthpop__today"
                    onClick={() => {
                      goMonth(currentMonth());
                      setPickerOpen(false);
                    }}
                  >
                    {t("report.this_month")}
                  </button>
                </div>
              )}
            </div>
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
                ref={(el) => (areaRefs.current[s.key] = el)}
                placeholder={t("report.placeholder")}
                value={report[s.key]}
                onChange={(e) => setField(s.key, e.target.value)}
              />
              <div className="report__cell-actions">
                <button
                  className="report__mini"
                  title={t("report.bullets")}
                  onClick={() => {
                    const el = areaRefs.current[s.key];
                    if (!el) return;
                    const { text, caret } = toggleBulletAtCursor(el);
                    setField(s.key, text);
                    // Repunem cursorul pe randul curent, dupa modificare.
                    requestAnimationFrame(() => {
                      el.focus();
                      el.setSelectionRange(caret, caret);
                    });
                  }}
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

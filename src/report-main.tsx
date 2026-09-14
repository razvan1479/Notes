// Punctul de intrare pentru fereastra SEPARATA de raport lunar.
// Ruleaza in propria fereastra Tauri (report.html), foloseste aceeasi baza de
// date si aceleasi traduceri/teme ca aplicatia principala.

import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { ReportModal } from "./components/ReportModal";
import { I18nProvider } from "./i18n/i18n";
import "./styles.css";

const THEME_KEY = "quicktasks.theme";

function ReportWindow() {
  // Aplicam aceeasi tema ca aplicatia principala (salvata in localStorage).
  useEffect(() => {
    const apply = () => {
      const saved = localStorage.getItem(THEME_KEY);
      document.documentElement.dataset.theme = saved === "dark" ? "dark" : "light";
    };
    apply();
    // Daca tema se schimba in fereastra principala, o prindem aici.
    window.addEventListener("storage", apply);
    return () => window.removeEventListener("storage", apply);
  }, []);

  return (
    <div className="report-page">
      <ReportModal standalone />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <I18nProvider>
      <ReportWindow />
    </I18nProvider>
  </React.StrictMode>
);

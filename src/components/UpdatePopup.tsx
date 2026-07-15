// Pop-up de update. Cand exista o versiune noua ("available"/descarcare/
// instalare) devine OBLIGATORIU: nu se poate inchide, nu are "Mai tarziu" —
// doar "Instaleaza acum". Apare singur la pornire daca s-a gasit un update.
// Exceptie de siguranta: daca instalarea da eroare, oferim Reincearca + Inchide.

import type { UpdateStatus } from "../hooks/useUpdate";
import { useI18n } from "../i18n/i18n";

interface Props {
  status: UpdateStatus;
  onInstall: () => void;
  onClose: () => void;
  onRetry: () => void;
}

export function UpdatePopup({ status, onInstall, onClose, onRetry }: Props) {
  const { t } = useI18n();

  const forced =
    status.kind === "available" ||
    status.kind === "downloading" ||
    status.kind === "installing";

  const title = (() => {
    switch (status.kind) {
      case "checking": return t("update.title_checking");
      case "available": return t("update.title_available");
      case "downloading": return t("update.title_downloading");
      case "installing": return t("update.title_installing");
      case "uptodate": return t("update.title_uptodate");
      case "error": return t("update.title_error");
      default: return t("update.title_default");
    }
  })();

  const message = (() => {
    switch (status.kind) {
      case "checking": return t("update.msg_checking");
      case "available": return t("update.msg_available", { v: status.version });
      case "downloading": return t("update.msg_downloading", { p: status.percent });
      case "installing": return t("update.msg_installing");
      case "uptodate": return t("update.msg_uptodate");
      case "error": return status.message;
      default: return "";
    }
  })();

  return (
    <div className="overlay" onClick={forced ? undefined : onClose}>
      <div className="popup" onClick={(e) => e.stopPropagation()}>
        <div className="popup__icon" aria-hidden="true">
          {icon(status)}
        </div>
        <h2 className="popup__title">{title}</h2>
        <p className="popup__msg">{message}</p>

        {status.kind === "downloading" && (
          <div className="popup__bar">
            <div className="popup__bar-fill" style={{ width: `${status.percent}%` }} />
          </div>
        )}

        <div className="popup__actions">
          {status.kind === "available" && (
            <button className="popup__btn popup__btn--primary" onClick={onInstall}>
              {t("update.btn_install")}
            </button>
          )}

          {status.kind === "error" && (
            <>
              <button className="popup__btn popup__btn--primary" onClick={onRetry}>
                {t("update.btn_retry")}
              </button>
              <button className="popup__btn" onClick={onClose}>
                {t("update.btn_close")}
              </button>
            </>
          )}

          {(status.kind === "uptodate" || status.kind === "checking") && (
            <button className="popup__btn" onClick={onClose}>
              {t("update.btn_close")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function icon(status: UpdateStatus) {
  const common = { width: 28, height: 28, viewBox: "0 0 24 24", "aria-hidden": true } as const;
  if (status.kind === "uptodate") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M8 12.5l2.5 2.5 5.5-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status.kind === "error") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7v6M12 16.5v.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 3v11M7.5 9.5L12 14l4.5-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

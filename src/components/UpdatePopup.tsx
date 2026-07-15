// Pop-up de update. Cand exista o versiune noua ("available"/descarcare/
// instalare) devine OBLIGATORIU: nu se poate inchide, nu are "Mai tarziu" —
// doar "Instaleaza acum". Apare singur la pornire daca s-a gasit un update.
// Exceptie de siguranta: daca instalarea da eroare, oferim Reincearca + Inchide,
// ca sa nu ramai blocat pe un release stricat.

import type { UpdateStatus } from "../hooks/useUpdate";

interface Props {
  status: UpdateStatus;
  onInstall: () => void;
  onClose: () => void;
  onRetry: () => void;
}

export function UpdatePopup({ status, onInstall, onClose, onRetry }: Props) {
  // Cat timp exista un update in lucru, pop-up-ul e obligatoriu.
  const forced =
    status.kind === "available" ||
    status.kind === "downloading" ||
    status.kind === "installing";

  return (
    <div className="overlay" onClick={forced ? undefined : onClose}>
      <div className="popup" onClick={(e) => e.stopPropagation()}>
        <div className="popup__icon" aria-hidden="true">
          {icon(status)}
        </div>
        <h2 className="popup__title">{title(status)}</h2>
        <p className="popup__msg">{message(status)}</p>

        {status.kind === "downloading" && (
          <div className="popup__bar">
            <div className="popup__bar-fill" style={{ width: `${status.percent}%` }} />
          </div>
        )}

        <div className="popup__actions">
          {status.kind === "available" && (
            <button className="popup__btn popup__btn--primary" onClick={onInstall}>
              Instaleaza acum
            </button>
          )}

          {status.kind === "error" && (
            <>
              <button className="popup__btn popup__btn--primary" onClick={onRetry}>
                Reincearca
              </button>
              <button className="popup__btn" onClick={onClose}>
                Inchide
              </button>
            </>
          )}

          {(status.kind === "uptodate" || status.kind === "checking") && (
            <button className="popup__btn" onClick={onClose}>
              Inchide
            </button>
          )}

          {/* Pentru downloading / installing nu exista buton: e in curs. */}
        </div>
      </div>
    </div>
  );
}

function title(status: UpdateStatus): string {
  switch (status.kind) {
    case "checking":
      return "Se verifica…";
    case "available":
      return "Update obligatoriu";
    case "downloading":
      return "Se descarca…";
    case "installing":
      return "Se instaleaza…";
    case "uptodate":
      return "Esti la zi";
    case "error":
      return "Ceva n-a mers";
    default:
      return "Actualizare";
  }
}

function message(status: UpdateStatus): string {
  switch (status.kind) {
    case "checking":
      return "Caut versiuni noi pe GitHub.";
    case "available":
      return `A aparut versiunea ${status.version}. Trebuie instalata pentru a continua. Aplicatia se va relansa dupa instalare.`;
    case "downloading":
      return `Descarcare in curs… ${status.percent}%`;
    case "installing":
      return "Aproape gata. Aplicatia se relanseaza singura.";
    case "uptodate":
      return "Ai deja cea mai noua versiune. Nu ai ce actualiza.";
    case "error":
      return status.message;
    default:
      return "";
  }
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

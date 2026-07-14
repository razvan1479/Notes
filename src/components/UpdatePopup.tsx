// Pop-up de update, deschis din butonul de langa Setari. Arata clar starea:
// "esti la zi", "versiune noua disponibila" (cu Instaleaza), progres, eroare.

import type { UpdateStatus } from "../hooks/useUpdate";

interface Props {
  status: UpdateStatus;
  onInstall: () => void;
  onClose: () => void;
}

export function UpdatePopup({ status, onInstall, onClose }: Props) {
  return (
    <div className="overlay" onClick={onClose}>
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
          <button className="popup__btn" onClick={onClose}>
            {status.kind === "available" ? "Mai tarziu" : "Inchide"}
          </button>
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
      return "Versiune noua disponibila";
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
      return `Versiunea ${status.version} e gata de instalat. Aplicatia se va relansa dupa instalare.`;
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
  // available / checking / downloading / installing: sageata de update
  return (
    <svg {...common}>
      <path d="M12 3v11M7.5 9.5L12 14l4.5-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

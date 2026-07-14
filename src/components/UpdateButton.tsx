// Butonul de update din Setari. Foloseste starea partajata (useUpdate),
// aceeasi pe care o vede si bara de sus. Cand exista deja un update gasit,
// butonul devine "Instaleaza acum"; altfel "Verifica update".

import type { UpdateStatus } from "../hooks/useUpdate";

interface Props {
  status: UpdateStatus;
  onCheck: () => void;
  onInstall: () => void;
}

export function UpdateButton({ status, onCheck, onInstall }: Props) {
  const busy =
    status.kind === "checking" ||
    status.kind === "downloading" ||
    status.kind === "installing";

  const available = status.kind === "available";

  return (
    <div className="settings__row">
      <div className="settings__label">
        <span className="settings__title">Actualizare</span>
        <span className="settings__desc">{describe(status)}</span>
      </div>
      <button
        className="btn"
        onClick={available ? onInstall : onCheck}
        disabled={busy}
      >
        {busy ? "…" : available ? "Instaleaza acum" : "Verifica update"}
      </button>
    </div>
  );
}

function describe(status: UpdateStatus): string {
  switch (status.kind) {
    case "idle":
      return "Aplicatia verifica singura la pornire. Poti verifica si acum.";
    case "checking":
      return "Se verifica...";
    case "uptodate":
      return "Ai deja cea mai noua versiune.";
    case "available":
      return `Versiune noua gasita: ${status.version}.`;
    case "downloading":
      return `Se descarca... ${status.percent}%`;
    case "installing":
      return "Se instaleaza. Aplicatia se va relansa.";
    case "error":
      return `Eroare: ${status.message}`;
  }
}

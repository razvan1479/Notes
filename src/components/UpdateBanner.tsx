// Bara discreta afisata sus in aplicatie doar cand exista un update.
// Apare singura (dupa verificarea automata de la pornire).

import type { UpdateStatus } from "../hooks/useUpdate";

interface Props {
  status: UpdateStatus;
  onInstall: () => void;
}

export function UpdateBanner({ status, onInstall }: Props) {
  if (status.kind === "available") {
    return (
      <div className="update-banner">
        <span className="update-banner__text">
          Versiune noua disponibila ({status.version})
        </span>
        <button className="update-banner__btn" onClick={onInstall}>
          Instaleaza
        </button>
      </div>
    );
  }

  if (status.kind === "downloading") {
    return (
      <div className="update-banner">
        <span className="update-banner__text">
          Se descarca update-ul… {status.percent}%
        </span>
      </div>
    );
  }

  if (status.kind === "installing") {
    return (
      <div className="update-banner">
        <span className="update-banner__text">
          Se instaleaza. Aplicatia se va relansa…
        </span>
      </div>
    );
  }

  return null;
}

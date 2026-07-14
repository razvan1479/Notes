// Buton de update in-app.
// Verifica GitHub Releases (prin tauri-plugin-updater), iar daca exista o
// versiune noua semnata, o descarca, o instaleaza si relanseaza aplicatia.
//
// Fluxul de publicare a unui update (din partea dezvoltatorului):
//   1. cresti "version" in src-tauri/tauri.conf.json (ex. 1.0.0 -> 1.0.1)
//   2. faci commit si dai push la un tag: git tag v1.0.1 && git push --tags
//   3. GitHub Actions compileaza, semneaza si publica Release-ul automat
//   4. aici, butonul gaseste noua versiune si o aduce in aplicatie

import { useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

type Status =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "uptodate" }
  | { kind: "available"; version: string }
  | { kind: "downloading"; percent: number }
  | { kind: "installing" }
  | { kind: "error"; message: string };

export function UpdateButton() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const handleCheck = async () => {
    setStatus({ kind: "checking" });
    try {
      const update = await check();

      if (!update) {
        setStatus({ kind: "uptodate" });
        return;
      }

      setStatus({ kind: "available", version: update.version });

      // Descarcare cu progres, apoi instalare.
      let downloaded = 0;
      let total = 0;
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            total = event.data.contentLength ?? 0;
            setStatus({ kind: "downloading", percent: 0 });
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            setStatus({
              kind: "downloading",
              percent: total > 0 ? Math.round((downloaded / total) * 100) : 0,
            });
            break;
          case "Finished":
            setStatus({ kind: "installing" });
            break;
        }
      });

      // Instalarea s-a terminat: relansam aplicatia pe versiunea noua.
      await relaunch();
    } catch (e) {
      console.error(e);
      // In modul browser/dev (fara backend Tauri) check() esueaza; tratam curat.
      const message =
        e instanceof Error ? e.message : "Verificarea update-ului a esuat.";
      setStatus({ kind: "error", message });
    }
  };

  const busy =
    status.kind === "checking" ||
    status.kind === "downloading" ||
    status.kind === "installing";

  return (
    <div className="settings__row">
      <div className="settings__label">
        <span className="settings__title">Actualizare</span>
        <span className="settings__desc">{describe(status)}</span>
      </div>
      <button className="btn" onClick={handleCheck} disabled={busy}>
        {busy ? "…" : "Verifica update"}
      </button>
    </div>
  );
}

function describe(status: Status): string {
  switch (status.kind) {
    case "idle":
      return "Cauta versiuni noi publicate pe GitHub.";
    case "checking":
      return "Se verifica...";
    case "uptodate":
      return "Ai deja cea mai noua versiune.";
    case "available":
      return `Versiune noua gasita: ${status.version}. Se pregateste...`;
    case "downloading":
      return `Se descarca... ${status.percent}%`;
    case "installing":
      return "Se instaleaza. Aplicatia se va relansa.";
    case "error":
      return `Eroare: ${status.message}`;
  }
}

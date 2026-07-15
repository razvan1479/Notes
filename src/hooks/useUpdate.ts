// Logica de update, partajata intre bara de notificare si butonul din Setari.
//  - la pornire verifica automat, silentios (fara sa deranjeze daca esti offline);
//  - expune si o verificare manuala si instalarea cu progres.

import { useCallback, useEffect, useRef, useState } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { useI18n } from "../i18n/i18n";

export type UpdateStatus =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "uptodate" }
  | { kind: "available"; version: string }
  | { kind: "downloading"; percent: number }
  | { kind: "installing" }
  | { kind: "error"; message: string };

/** Adevarat doar cand rulam in aplicatia Tauri (nu in browser/preview). */
function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function useUpdate() {
  const { t } = useI18n();
  const [status, setStatus] = useState<UpdateStatus>({ kind: "idle" });
  const updateRef = useRef<Update | null>(null);

  const checkNow = useCallback(async (silent: boolean) => {
    if (!isTauri()) {
      if (!silent) {
        setStatus({
          kind: "error",
          message: t("update.err_not_installed"),
        });
      }
      return;
    }
    setStatus({ kind: "checking" });
    try {
      const update = await check();
      if (!update) {
        updateRef.current = null;
        setStatus({ kind: "uptodate" });
        return;
      }
      updateRef.current = update;
      setStatus({ kind: "available", version: update.version });
    } catch (e) {
      console.error(e);
      // La pornire (silent) nu aratam erori de retea; ramanem discreti.
      if (silent) setStatus({ kind: "idle" });
      else
        setStatus({
          kind: "error",
          message: e instanceof Error ? e.message : t("update.err_check"),
        });
    }
  }, [t]);

  const install = useCallback(async () => {
    const update = updateRef.current;
    if (!update) return;
    try {
      let downloaded = 0;
      let total = 0;
      setStatus({ kind: "downloading", percent: 0 });
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
      await relaunch();
    } catch (e) {
      console.error(e);
      setStatus({
        kind: "error",
        message: e instanceof Error ? e.message : t("update.err_install"),
      });
    }
  }, [t]);

  // Verificare automata, o data, la pornirea aplicatiei.
  useEffect(() => {
    checkNow(true);
  }, [checkNow]);

  return { status, checkNow, install };
}

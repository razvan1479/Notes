// Utilitare de timp. Toata logica de expirare se bazeaza pe timestamp-uri
// absolute (ms epoch), deci functioneaza corect chiar daca aplicatia a fost
// inchisa intre timp: la repornire recalculam pur si simplu diferenta.

/** Durata dupa care un task bifat se sterge automat: exact 8 ore. */
export const AUTO_DELETE_MS = 4 * 60 * 60 * 1000;

/** Pragul (ultima ora) dupa care afisam indicatorul de expirare in ambru. */
export const WARNING_MS = 60 * 60 * 1000;

/**
 * Momentul exact la care un task bifat va expira.
 * @returns ms epoch, sau null daca task-ul nu e bifat.
 */
export function expiryTime(completedAt: number | null): number | null {
  if (completedAt == null) return null;
  return completedAt + AUTO_DELETE_MS;
}

/**
 * Cat timp a mai ramas pana la stergerea automata.
 * @returns ms ramase (poate fi <= 0 daca a expirat), sau null daca e activ.
 */
export function msUntilExpiry(completedAt: number | null, now: number = Date.now()): number | null {
  const expiry = expiryTime(completedAt);
  if (expiry == null) return null;
  return expiry - now;
}

/** True daca task-ul bifat a depasit cele 4h si trebuie sters. */
export function isExpired(completedAt: number | null, now: number = Date.now()): boolean {
  const remaining = msUntilExpiry(completedAt, now);
  return remaining != null && remaining <= 0;
}

/** Formateaza o durata (ms) ca "23h 12m" sau "4m 30s" pentru countdown. */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return "0s";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/** Data + ora lizibila, in functie de locale (ex. "en-US" / "ro-RO"). */
export function formatDateTime(ms: number, locale = "en-US"): string {
  return new Date(ms).toLocaleString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Doar ora, ex: "09:42". */
export function formatTime(ms: number, locale = "en-US"): string {
  return new Date(ms).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

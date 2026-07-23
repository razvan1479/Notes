// ISTORIC VERSIUNI (changelog).
//
// CUM ADAUGI O VERSIUNE NOUA:
// Pui o intrare noua SUS de tot in lista (cea mai recenta prima).
//   {
//     version: "6.6.0",              // exact versiunea publicata
//     date: "2026-07-25",            // AAAA-LL-ZZ
//     changes: [
//       { type: "new", ro: "...", en: "..." },
//       { type: "fix", ro: "...", en: "..." },
//       { type: "improved", ro: "...", en: "..." },
//     ],
//   },
//
// type poate fi: "new" (nou), "fix" (reparat), "improved" (imbunatatit).

export type ChangeType = "new" | "fix" | "improved";

export interface ChangeItem {
  type: ChangeType;
  ro: string;
  en: string;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: ChangeItem[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "6.6.1",
    date: "2026-07-23",
    changes: [
      {
        type: "fix",
        ro: "Numărul versiunii afișat în istoric nu se potrivea cu versiunea instalată.",
        en: "The version number shown in the history did not match the installed version.",
      },
    ],
  },
  {
    version: "6.6.0",
    date: "2026-07-23",
    changes: [
      {
        type: "new",
        ro: "Secțiune nouă cu istoricul versiunilor, în Setări. Versiunile necitite sunt marcate cu o bulină.",
        en: "New version history section in Settings. Unread versions are marked with a dot.",
      },
      {
        type: "new",
        ro: "Poți edita textul task-urilor direct din calendar (dublu-click pe task).",
        en: "You can edit task text directly in the calendar (double-click a task).",
      },
      {
        type: "new",
        ro: "Buton de ștergere pentru task-urile din calendar, inclusiv cele viitoare.",
        en: "Delete button for calendar tasks, including upcoming ones.",
      },
      {
        type: "fix",
        ro: "Task-urile programate cu „!” nu mai apar în listă înainte de ziua lor.",
        en: "Tasks scheduled with “!” no longer appear in the list before their day.",
      },
    ],
  },
  {
    version: "6.5.0",
    date: "2026-07-21",
    changes: [
      {
        type: "new",
        ro: "Task-urile programate din calendar rămân ascunse și apar în listă abia în ziua lor, la 00:00.",
        en: "Tasks scheduled from the calendar stay hidden and appear in the list only on their day, at 00:00.",
      },
      {
        type: "new",
        ro: "În calendar poți alege ora exactă a mementoului când marchezi task-ul cu „!”.",
        en: "In the calendar you can pick the exact reminder time when you mark a task with “!”.",
      },
      {
        type: "improved",
        ro: "Cronometrul task-urilor bifate se scurge acum secundă cu secundă.",
        en: "The countdown on completed tasks now ticks second by second.",
      },
      {
        type: "improved",
        ro: "Task-urile bifate se șterg automat după 3 ore (în loc de 4).",
        en: "Completed tasks are auto-deleted after 3 hours (instead of 4).",
      },
      {
        type: "improved",
        ro: "Pe task-urile bifate nu mai apar butoanele de prioritate și memento.",
        en: "Priority and reminder buttons no longer show on completed tasks.",
      },
    ],
  },
  {
    version: "6.4.0",
    date: "2026-07-20",
    changes: [
      {
        type: "new",
        ro: "Poți adăuga task-uri direct din calendar, pe ziua selectată.",
        en: "You can add tasks directly from the calendar, on the selected day.",
      },
      {
        type: "improved",
        ro: "Pop-up-ul de update apare doar la pornirea aplicației. Dacă apare o versiune nouă cât lucrezi, vezi doar semnul „!” pe buton și actualizezi când vrei.",
        en: "The update popup only appears at startup. If a new version arrives while you work, you just see the “!” on the button and update when you want.",
      },
      {
        type: "improved",
        ro: "Semnul „!” de pe butonul de update este acum roșu, mai vizibil.",
        en: "The “!” on the update button is now red and more visible.",
      },
      {
        type: "improved",
        ro: "Aplicația verifică singură dacă există versiuni noi, la fiecare 30 de minute.",
        en: "The app checks for new versions on its own, every 30 minutes.",
      },
      {
        type: "improved",
        ro: "Actualizările se instalează complet în fundal, fără fereastră de instalare.",
        en: "Updates install fully in the background, with no installer window.",
      },
    ],
  },
  {
    version: "6.3.0",
    date: "2026-07-19",
    changes: [
      {
        type: "new",
        ro: "Memento-urile deschid un pop-up în stil Outlook, cu sunet, și aduc fereastra în față. Poți amâna 5 minute sau închide.",
        en: "Reminders open an Outlook-style popup with sound and bring the window to front. You can snooze 5 minutes or dismiss.",
      },
      {
        type: "new",
        ro: "Buton de resetare totală în Setări: șterge toate task-urile și progresul, cu confirmare.",
        en: "Full reset button in Settings: deletes all tasks and progress, with confirmation.",
      },
      {
        type: "improved",
        ro: "Badge-urile au acum o singură scară, după numărul de task-uri terminate, deci se deblochează în ordine.",
        en: "Badges now follow a single ladder based on completed tasks, so they unlock in order.",
      },
      {
        type: "improved",
        ro: "Fiecare badge are culoarea lui distinctă și un nume nou, dintr-o scară unitară.",
        en: "Each badge has its own distinct color and a new name from a single coherent ladder.",
      },
    ],
  },
  {
    version: "6.2.0",
    date: "2026-07-18",
    changes: [
      {
        type: "new",
        ro: "Sistem de progres: XP pentru task-urile terminate, niveluri și badge-uri.",
        en: "Progress system: XP for completed tasks, levels and badges.",
      },
      {
        type: "new",
        ro: "Bonus de angajament: +10 XP permanent pentru fiecare task lăsat bifat până se șterge singur.",
        en: "Commitment bonus: a permanent +10 XP for every task left checked until it auto-deletes.",
      },
      {
        type: "new",
        ro: "Bara de progres arată badge-ul curent cu numele lui, deasupra nivelului.",
        en: "The progress bar shows your current badge with its name, above the level.",
      },
      {
        type: "new",
        ro: "Poți alege culoarea barei de XP din Setări.",
        en: "You can pick the XP bar color in Settings.",
      },
      {
        type: "improved",
        ro: "XP-ul reflectă situația reală: crește la bifare și scade la debifare sau ștergere.",
        en: "XP reflects reality: it goes up when you check a task and down when you uncheck or delete it.",
      },
    ],
  },
  {
    version: "6.1.0",
    date: "2026-07-17",
    changes: [
      {
        type: "new",
        ro: "Memento-uri pe task-uri: alegi data și ora exactă și primești o notificare.",
        en: "Task reminders: pick the exact date and time and get a notification.",
      },
      {
        type: "new",
        ro: "Calendar, într-un buton nou lângă temă: vezi lunar ce ai programat și pe ce zile.",
        en: "Calendar, in a new button next to the theme toggle: see monthly what you scheduled and on which days.",
      },
    ],
  },
];

/** Cea mai recenta versiune din istoric (prima din lista). */
export function latestChangelogVersion(): string | null {
  return CHANGELOG.length ? CHANGELOG[0].version : null;
}

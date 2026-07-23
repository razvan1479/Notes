// ISTORIC VERSIUNI (changelog).
//
// CUM ADAUGI O VERSIUNE NOUA:
// Pui o intrare noua SUS de tot in lista (cea mai recenta prima).
//   {
//     version: "6.6.3",              // exact versiunea publicata
//     date: "2026-07-24",            // AAAA-LL-ZZ
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
    version: "6.6.6",
    date: "2026-07-23",
    changes: [
      {
        type: "fix",
        ro: "După o actualizare, butonul de noutăți arată acum doar versiunile noi, nu tot istoricul.",
        en: "After an update, the news button now shows only the new versions, not the whole history.",
      },
    ],
  },
  {
    version: "6.6.5",
    date: "2026-07-23",
    changes: [
      {
        type: "improved",
        ro: "Noutățile se deschid doar din butonul de sus; rândul din Setări a fost scos.",
        en: "News opens only from the top button; the Settings row was removed.",
      },
    ],
  },
  {
    version: "6.6.4",
    date: "2026-07-23",
    changes: [
      {
        type: "new",
        ro: "Istoricul cuprinde acum toate versiunile publicate până acum, de la prima.",
        en: "The history now covers every version published so far, from the very first one.",
      },
    ],
  },
  {
    version: "6.6.3",
    date: "2026-07-23",
    changes: [
      {
        type: "fix",
        ro: "Bulina care marchează noutățile necitite nu se vedea pe buton.",
        en: "The dot marking unread news was not visible on the button.",
      },
      {
        type: "improved",
        ro: "Iconița de noutăți este acum un megafon înclinat, în loc de un difuzor.",
        en: "The news icon is now a tilted megaphone instead of a speaker.",
      },
    ],
  },
  {
    version: "6.6.2",
    date: "2026-07-23",
    changes: [
      {
        type: "new",
        ro: "Buton nou în bara de sus pentru noutăți: deschide istoricul versiunilor de oriunde.",
        en: "New button in the top bar for news: opens the version history from anywhere.",
      },
      {
        type: "new",
        ro: "După o actualizare, butonul de noutăți arată întâi ce s-a schimbat; după „Am înțeles” se deschide istoricul complet.",
        en: "After an update, the news button first shows what changed; after “Got it” the full history opens.",
      },
    ],
  },
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
        ro: "Istoricul versiunilor, cu marcarea celor necitite.",
        en: "Version history, with unread versions marked.",
      },
    ],
  },
  {
    version: "6.5.7",
    date: "2026-07-23",
    changes: [
      {
        type: "fix",
        ro: "Task-urile programate cu „!” apăreau în listă înainte de ziua lor.",
        en: "Tasks scheduled with “!” appeared in the list before their day.",
      },
    ],
  },
  {
    version: "6.5.6",
    date: "2026-07-20",
    changes: [
      {
        type: "new",
        ro: "Poți edita textul task-urilor direct din calendar (dublu-click).",
        en: "You can edit task text directly in the calendar (double-click).",
      },
      {
        type: "new",
        ro: "Buton de ștergere pentru task-urile din calendar, inclusiv cele viitoare.",
        en: "Delete button for calendar tasks, including upcoming ones.",
      },
    ],
  },
  {
    version: "6.5.4",
    date: "2026-07-20",
    changes: [
      {
        type: "new",
        ro: "Task-urile programate din calendar rămân ascunse și apar în listă abia în ziua lor, la 00:00.",
        en: "Tasks scheduled from the calendar stay hidden and appear in the list only on their day, at 00:00.",
      },
    ],
  },
  {
    version: "6.5.3",
    date: "2026-07-20",
    changes: [
      {
        type: "improved",
        ro: "Task-urile bifate se șterg automat după 3 ore, în loc de 4.",
        en: "Completed tasks are auto-deleted after 3 hours instead of 4.",
      },
    ],
  },
  {
    version: "6.5.2",
    date: "2026-07-20",
    changes: [
      {
        type: "improved",
        ro: "Pe task-urile bifate nu mai apar butoanele de prioritate și memento.",
        en: "Priority and reminder buttons no longer show on completed tasks.",
      },
    ],
  },
  {
    version: "6.5.1",
    date: "2026-07-20",
    changes: [
      {
        type: "improved",
        ro: "Cronometrul task-urilor bifate se scurge acum secundă cu secundă.",
        en: "The countdown on completed tasks now ticks second by second.",
      },
      {
        type: "improved",
        ro: "Pop-up-ul de update apare doar la pornire. Dacă apare o versiune nouă cât lucrezi, vezi doar semnul „!” pe buton.",
        en: "The update popup only appears at startup. If a new version arrives while you work, you just see the “!” on the button.",
      },
    ],
  },
  {
    version: "6.5.0",
    date: "2026-07-20",
    changes: [
      {
        type: "new",
        ro: "Poți adăuga task-uri direct din calendar, pe ziua selectată.",
        en: "You can add tasks directly from the calendar, on the selected day.",
      },
      {
        type: "new",
        ro: "Cu „!” alegi și ora exactă la care vrei mementoul.",
        en: "With “!” you also pick the exact time you want the reminder.",
      },
    ],
  },
  {
    version: "6.4.0",
    date: "2026-07-20",
    changes: [
      {
        type: "new",
        ro: "Buton de resetare totală în Setări: șterge toate task-urile și progresul, cu confirmare.",
        en: "Full reset button in Settings: deletes all tasks and progress, with confirmation.",
      },
    ],
  },
  {
    version: "6.3.1",
    date: "2026-07-20",
    changes: [
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
    ],
  },
  {
    version: "6.3.0",
    date: "2026-07-20",
    changes: [
      {
        type: "new",
        ro: "Memento-urile deschid un pop-up cu sunet și aduc fereastra în față. Poți amâna 5 minute sau închide.",
        en: "Reminders open a popup with sound and bring the window to front. You can snooze 5 minutes or dismiss.",
      },
    ],
  },
  {
    version: "6.2.2",
    date: "2026-07-17",
    changes: [
      {
        type: "improved",
        ro: "Culorile primelor două badge-uri au fost schimbate între ele.",
        en: "The colors of the first two badges were swapped.",
      },
    ],
  },
  {
    version: "6.2.1",
    date: "2026-07-17",
    changes: [
      {
        type: "improved",
        ro: "Badge-urile urmează acum o singură scară, după numărul de task-uri terminate, deci se deblochează în ordine.",
        en: "Badges now follow a single ladder based on completed tasks, so they unlock in order.",
      },
      {
        type: "improved",
        ro: "Fiecare badge are culoarea lui distinctă și un nume nou.",
        en: "Each badge has its own distinct color and a new name.",
      },
    ],
  },
  {
    version: "6.2.0",
    date: "2026-07-17",
    changes: [
      {
        type: "new",
        ro: "Bonus de angajament: +10 XP permanent pentru fiecare task lăsat bifat până se șterge singur.",
        en: "Commitment bonus: a permanent +10 XP for every task left checked until it auto-deletes.",
      },
    ],
  },
  {
    version: "6.1.1",
    date: "2026-07-17",
    changes: [
      {
        type: "new",
        ro: "Praguri noi de badge-uri, până la niveluri înalte.",
        en: "New badge thresholds, up to high levels.",
      },
      {
        type: "improved",
        ro: "În fereastra de realizări, badge-urile obținute apar în culoarea lor.",
        en: "In the achievements window, earned badges show in their own color.",
      },
    ],
  },
  {
    version: "6.1.0",
    date: "2026-07-17",
    changes: [
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
    version: "1.0.17",
    date: "2026-07-17",
    changes: [
      {
        type: "new",
        ro: "Sistem de progres: XP pentru task-urile terminate, niveluri și badge-uri.",
        en: "Progress system: XP for completed tasks, levels and badges.",
      },
    ],
  },
  {
    version: "1.0.16",
    date: "2026-07-16",
    changes: [
      {
        type: "improved",
        ro: "Ajustări la comportamentul ferestrei.",
        en: "Adjustments to window behavior.",
      },
    ],
  },
  {
    version: "1.0.15",
    date: "2026-07-15",
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
  {
    version: "1.0.14",
    date: "2026-07-15",
    changes: [
      {
        type: "improved",
        ro: "Task-urile bifate se șterg automat după 4 ore.",
        en: "Completed tasks are auto-deleted after 4 hours.",
      },
    ],
  },
  {
    version: "1.0.13",
    date: "2026-07-15",
    changes: [
      {
        type: "improved",
        ro: "Fereastra se așază pe marginea din dreapta, pe toată înălțimea utilă a ecranului, fără să acopere bara de activități.",
        en: "The window docks to the right edge, spanning the usable screen height without covering the taskbar.",
      },
    ],
  },
  {
    version: "1.0.12",
    date: "2026-07-15",
    changes: [
      {
        type: "new",
        ro: "Versiunea aplicației este afișată în Setări.",
        en: "The app version is shown in Settings.",
      },
    ],
  },
  {
    version: "1.0.11",
    date: "2026-07-15",
    changes: [
      {
        type: "fix",
        ro: "Bifarea și marcarea ca prioritar nu se salvau corect de fiecare dată.",
        en: "Checking a task and marking it as priority were not always saved correctly.",
      },
    ],
  },
  {
    version: "1.0.10",
    date: "2026-07-15",
    changes: [
      {
        type: "fix",
        ro: "Corecții interne la salvarea datelor și la fereastră.",
        en: "Internal fixes to data saving and to the window.",
      },
    ],
  },
  {
    version: "1.0.9",
    date: "2026-07-15",
    changes: [
      {
        type: "new",
        ro: "Aplicația este disponibilă în engleză și română, cu selector în Setări.",
        en: "The app is available in English and Romanian, with a selector in Settings.",
      },
    ],
  },
  {
    version: "1.0.8",
    date: "2026-07-15",
    changes: [
      {
        type: "improved",
        ro: "Ajustări la fereastră și la pornirea aplicației.",
        en: "Adjustments to the window and app startup.",
      },
    ],
  },
  {
    version: "1.0.7",
    date: "2026-07-15",
    changes: [
      {
        type: "improved",
        ro: "Când există o versiune nouă, pop-up-ul de update apare singur.",
        en: "When a new version exists, the update popup appears on its own.",
      },
    ],
  },
  {
    version: "1.0.6",
    date: "2026-07-15",
    changes: [
      {
        type: "new",
        ro: "Poți marca task-urile ca prioritare, cu semnul exclamării.",
        en: "You can mark tasks as priority, with an exclamation mark.",
      },
      {
        type: "new",
        ro: "Setări pentru font și mărimea textului.",
        en: "Settings for font and text size.",
      },
    ],
  },
  {
    version: "1.0.5",
    date: "2026-07-15",
    changes: [
      {
        type: "new",
        ro: "Îți poți alege culorile aplicației, separat pentru tema luminoasă și cea întunecată.",
        en: "You can pick the app colors, separately for the light and dark themes.",
      },
    ],
  },
  {
    version: "1.0.4",
    date: "2026-07-14",
    changes: [
      {
        type: "fix",
        ro: "Corecție de configurare.",
        en: "Configuration fix.",
      },
    ],
  },
  {
    version: "1.0.3",
    date: "2026-07-14",
    changes: [
      {
        type: "fix",
        ro: "Corecție la compilarea aplicației.",
        en: "Fix to the app build.",
      },
    ],
  },
  {
    version: "1.0.2",
    date: "2026-07-14",
    changes: [
      {
        type: "new",
        ro: "Buton de ștergere pe fiecare task.",
        en: "Delete button on each task.",
      },
    ],
  },
  {
    version: "1.0.1",
    date: "2026-07-14",
    changes: [
      {
        type: "new",
        ro: "Actualizări automate: aplicația anunță singură când există o versiune nouă.",
        en: "Automatic updates: the app tells you when a new version is available.",
      },
    ],
  },
  {
    version: "1.0.0",
    date: "2026-07-14",
    changes: [
      {
        type: "new",
        ro: "Prima versiune: adaugi task-uri, le bifezi, le cauți, schimbi tema, iar totul se salvează local.",
        en: "First version: add tasks, check them off, search them, switch the theme, and everything is saved locally.",
      },
    ],
  },
]

/** Cea mai recenta versiune din istoric (prima din lista). */
export function latestChangelogVersion(): string | null {
  return CHANGELOG.length ? CHANGELOG[0].version : null;
}

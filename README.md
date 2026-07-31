# QuickTasks

A minimalist **To-Do / Sticky Notes** desktop app for Windows.
Local, fast, offline. Completed tasks auto-delete after exactly **3 hours**.

Built with **Tauri 2 + React + TypeScript + SQLite** — small binary, low resource usage.

---

## Contents
- [Features](#features)
- [Requirements (one-time)](#requirements-one-time)
- [Running in development](#running-in-development)
- [Building the Windows installer](#building-the-windows-installer)
- [How the key pieces work](#how-the-key-pieces-work)
- [Project structure](#project-structure)
- [Where data is stored](#where-data-is-stored)
- [Releasing & auto-update](#releasing--auto-update)
- [Troubleshooting](#troubleshooting)

---

## Features

**Core tasks**
- Quick add (type + **Enter**).
- Each task has a checkbox, editable text (double-click), and creation/completion timestamps.
- On completion the text is struck through, stays visible, and **auto-deletes after exactly 3 hours**.
- Unchecking before the 3 hours resets the countdown. The countdown is shown live, ticking every second.
- The 3-hour timer is computed from the stored timestamp, so it stays correct even if the app was closed.
- Priority flag (`!`) and drag-and-drop reordering. Active tasks on top, completed below.

**Reminders & calendar**
- Per-task reminders: pick an exact date and time and get a native notification plus an Outlook-style popup with sound; the window comes to the front. Snooze 5 minutes or dismiss.
- A monthly calendar (button in the top bar) shows what you scheduled and on which days.
- From the calendar you can add tasks on a chosen day, optionally with a time, a priority flag, and a repeat rule — each of these is independent.
- Scheduled tasks stay hidden from the main list until their day arrives (at 00:00).

**Sub-tasks, notes, recurrence**
- Sub-tasks: each task can hold checkable steps with a progress indicator (e.g. `2/4`); open them from the details button.
- Notes: a free-text details field (links, context) under each task.
- Recurring tasks (set from the calendar): daily, weekly, or monthly. When you check a recurring task, the next occurrence is created automatically. Monthly recurrence is anchored to the chosen day: if a month is too short (e.g. the 31st in February) it falls back to the last day of that month and returns to the original day when the month allows.

**Progress & stats**
- Gamification: XP for completed tasks, levels, and unlockable badges. A commitment bonus grants permanent XP for tasks left checked until they auto-delete.
- A statistics screen (top-bar button): tasks completed today and this week, your current day streak, current level, and a bar chart of the last 7 days.

**App behavior**
- Starts with Windows, minimized to the System Tray (optional, from Settings).
- Closing the window doesn't quit the app — it stays in the tray and keeps managing timers.
- Dark / Light mode, custom colors and fonts, instant search, drag-and-drop, double-click editing.
- A version-history ("What's new") button in the top bar shows what changed after an update, then the full history.
- Signed auto-updates: the app checks on startup and every 30 minutes; updates install silently in the background.
- Shortcuts: `Ctrl+N` (new task), `Ctrl+F` (search), `Delete` (delete selected), `Space` (toggle selected).

> Just want to see the UI without building? Open **`preview.html`** in any browser.

---

## Requirements (one-time)

On the Windows machine where you build:

1. **Node.js 18+** — https://nodejs.org
2. **Rust** (stable) — https://rustup.rs
3. **Microsoft C++ Build Tools** (Desktop development with C++) — via the Visual Studio Installer.
4. **WebView2 Runtime** — usually already present on Windows 10/11; otherwise download it from Microsoft.

Verify:
```bash
node --version
rustc --version
```

---

## Running in development

```bash
npm install
npm run tauri:dev
```

The first run compiles the Rust backend (a few minutes); later runs are fast.
The window opens and React hot-reload is active.

---

## Building the Windows installer

```bash
npm run tauri:build
```

The `.exe` installer is produced under:
```
src-tauri/target/release/bundle/nsis/QuickTasks_<version>_x64-setup.exe
```

The installer is configured **per-user** (no administrator rights required).
The standalone binary is also at `src-tauri/target/release/QuickTasks.exe`.

---

## How the key pieces work

### The 3-hour timer (robust across restarts)
There is no timer that "remembers" elapsed time. On completion we store `completed_at`
(an absolute timestamp). Deletion compares `completed_at + 3h` against the current time:
- at startup (`deleteExpiredTasks`) — clears whatever expired while the app was closed;
- every second while running (including hidden in the tray).

See `src/lib/time.ts` and `src/db/database.ts`.

### Persistence
All tasks live in SQLite (`quicktasks.db`) in the app's config directory. Writes happen on
every change, so an abrupt shutdown loses nothing. New columns and tables (notes, recurrence,
sub-tasks, daily stats) are added by automatic, idempotent migrations at startup — existing
data is preserved.

### System Tray + close-to-tray
In `src-tauri/src/lib.rs`:
- intercept `CloseRequested` → `prevent_close()` + `window.hide()` (the app stays active);
- a tray icon with an **Open / Quit** menu; left-click reopens the window;
- "Quit" from the menu actually closes the app.

### Autostart, minimized
The `autostart` plugin registers the app to launch at Windows startup with `--minimized`.
At boot, `lib.rs` detects the argument and leaves the window hidden in the tray.
The **Settings → "Start with Windows"** toggle enables/disables this.

### Recurrence
When a recurring task is checked, `useTasks` creates the next occurrence with the same text,
priority, note, and recurrence. Daily/weekly add days; monthly keeps the original anchor day
and clamps to the last day of short months (see `nextRecurrence` in `src/hooks/useTasks.ts`).

---

## Project structure

```
quicktasks/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── preview.html              # static UI mock (no Tauri)
├── src/                      # React + TypeScript frontend
│   ├── main.tsx
│   ├── App.tsx               # wiring: state, search, selection, shortcuts, modals
│   ├── styles.css            # light/dark tokens, minimalist UI
│   ├── types.ts
│   ├── changelog.ts          # version history data
│   ├── db/database.ts        # SQLite layer (CRUD, migrations, stats, subtasks)
│   ├── lib/time.ts           # 3h expiry logic + formatting
│   ├── lib/sound.ts          # reminder sound (Web Audio)
│   ├── gamification/         # levels + badges
│   ├── i18n/                 # English + Romanian
│   ├── hooks/
│   │   ├── useTasks.ts       # task state, auto-sweep, recurrence, subtasks, stats
│   │   ├── useTheme.ts       # persistent dark/light
│   │   ├── useColors.ts / useTypography.ts
│   │   ├── useReminders.ts   # reminder scheduling
│   │   ├── useGamification.ts
│   │   ├── useUpdate.ts      # signed auto-update
│   │   ├── useChangelog.ts   # "what's new" tracking
│   │   └── useHotkeys.ts
│   └── components/
│       ├── Header.tsx        # search, stats, calendar, what's new, update, settings
│       ├── TaskInput.tsx
│       ├── SearchBar.tsx
│       ├── TaskList.tsx      # active/completed split + drag & drop
│       ├── TaskItem.tsx      # task row + expiry ring + details panel (subtasks/note)
│       ├── CalendarModal.tsx # scheduling, time, priority, recurrence
│       ├── StatsModal.tsx    # statistics screen
│       ├── ReminderDialog.tsx / ReminderAlert.tsx
│       ├── ChangelogModal.tsx
│       ├── GamificationBar.tsx / AchievementsModal.tsx
│       └── Settings.tsx
└── src-tauri/                # Rust backend (Tauri 2)
    ├── Cargo.toml
    ├── tauri.conf.json
    ├── build.rs
    ├── capabilities/default.json
    ├── icons/
    └── src/
        ├── main.rs
        └── lib.rs            # plugins + tray + close-to-tray + start minimized
```

---

## Where data is stored

The SQLite database is created automatically in the app's config directory, e.g.:
```
C:\Users\<user>\AppData\Roaming\com.quicktasks.app\quicktasks.db
```
Appearance preferences (theme, colors, font) and progress are stored in `localStorage`.

---

## Releasing & auto-update

Releases are driven by the commit message. Push to `main` with a version marker like
`v6.7.0` in the commit message; the GitHub Actions workflow extracts the version, builds,
**signs**, and publishes a GitHub Release. If the message has no `vX.Y.Z` marker, nothing is
published. The updater endpoint points at the latest release, and installed apps update
silently in the background.

The updater's public key lives in `tauri.conf.json`; the private key is stored as a GitHub
secret and is never committed.

---

## Troubleshooting

- **"failed to bundle project" / icon error** — make sure `src-tauri/icons/` contains the
  generated files (`icon.ico`, `32x32.png`, `128x128.png`, `[email protected]`, `icon.png`).
- **Autostart doesn't kick in** — check the Settings toggle; at the OS level it appears under
  `Task Manager → Startup apps`.
- **The window "disappears" on X** — intended: the app goes to the tray. Reopen from the tray
  icon, or fully quit via the tray menu → "Quit".
- **First build is slow** — normal; Rust compiles all dependencies once.
- **The Rust backend can't be built outside Windows** — the native layer requires the Windows
  toolchain (MSVC + WebView2). Build and test releases on Windows or via the GitHub Actions
  workflow.

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

© 2026 Stoica Ioan Razvan (iDeaL)

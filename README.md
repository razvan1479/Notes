# QuickTasks

Aplicație desktop minimalistă de tip **To-Do / Sticky Notes** pentru Windows.
Locală, rapidă, offline. Task-urile bifate se șterg automat după exact 24h.

Construită cu **Tauri 2 + React + TypeScript + SQLite** — binar mic și consum redus de resurse.

---

## Cuprins
- [Ce face](#ce-face)
- [Cerințe (o singură dată)](#cerințe-o-singură-dată)
- [Rulare în development](#rulare-în-development)
- [Build instalator Windows](#build-instalator-windows)
- [Cum funcționează fiecare cerință](#cum-funcționează-fiecare-cerință)
- [Structura proiectului](#structura-proiectului)
- [Unde sunt salvate datele](#unde-sunt-salvate-datele)
- [Depanare](#depanare)

---

## Ce face

- Adăugare rapidă de task-uri (scrii + **Enter**).
- Fiecare task are: checkbox, text editabil, data/ora creării și data/ora finalizării.
- La bifare: textul e tăiat (strikethrough), rămâne vizibil, iar după **exact 24h se șterge automat**.
- Debifarea înainte de 24h **resetează** cronometrul.
- Salvare locală în **SQLite** — nimic nu se pierde la închidere sau restart.
- Timerul de 24h se calculează din timestamp-ul salvat, deci rămâne corect chiar dacă aplicația a fost închisă.
- **Pornire automată cu Windows**, minimizată în System Tray (opțional, din Setări).
- Închiderea ferestrei nu oprește aplicația — rămâne în tray și continuă să gestioneze timerul.
- Dark / Light mode, font mare, căutare instantanee, drag & drop, editare prin dublu-click.
- Scurtături: `Ctrl+N` (task nou), `Ctrl+F` (căutare), `Delete` (șterge selectatul), `Space` (bifează/debifează selectatul).

> Vrei doar să vezi cum arată, fără build? Deschide **`preview.html`** în orice browser.

---

## Cerințe (o singură dată)

Pe mașina de Windows unde compilezi:

1. **Node.js 18+** — https://nodejs.org
2. **Rust** (stable) — https://rustup.rs
3. **Microsoft C++ Build Tools** (Desktop development with C++) — vine cu Visual Studio Installer.
4. **WebView2 Runtime** — de regulă e deja instalat pe Windows 10/11; dacă nu, se descarcă de la Microsoft.

Verifică:
```bash
node --version
rustc --version
```

---

## Rulare în development

```bash
npm install
npm run tauri:dev
```

Prima rulare compilează backend-ul Rust (durează câteva minute); următoarele sunt rapide.
Fereastra pornește, iar hot-reload-ul e activ pentru partea de React.

---

## Build instalator Windows

```bash
npm run tauri:build
```

Rezultatul (instalator `.exe`) apare în:
```
src-tauri/target/release/bundle/nsis/QuickTasks_1.0.0_x64-setup.exe
```

Instalatorul e configurat **per-user** (nu cere drepturi de administrator).
Binarul standalone se află și în `src-tauri/target/release/QuickTasks.exe`.

---

## Cum funcționează fiecare cerință

### Timerul de 24h (robust la închidere)
Nu folosim un timer care „ține minte” cât a trecut. La bifare salvăm `completed_at`
(timestamp absolut). Ștergerea se face comparând `completed_at + 24h` cu ora curentă:
- la pornire (`deleteExpiredTasks`) — curăță ce a expirat cât aplicația a fost închisă;
- la fiecare 10 secunde cât aplicația rulează (inclusiv ascunsă în tray).

Vezi `src/lib/time.ts` și `src/db/database.ts`.

### Persistență
Toate task-urile stau în SQLite (`quicktasks.db`), în directorul de config al aplicației.
Se scrie la fiecare modificare, deci un shutdown brusc nu pierde nimic.

### System Tray + închidere în tray
În `src-tauri/src/lib.rs`:
- interceptăm `CloseRequested` → `prevent_close()` + `window.hide()` (aplicația rămâne activă);
- iconiță de tray cu meniu **Deschide / Ieșire**; click stânga redeschide fereastra;
- „Ieșire” din meniu chiar închide aplicația.

### Pornire automată, minimizată
Plugin-ul `autostart` înregistrează aplicația la pornirea Windows cu argumentul `--minimized`.
La boot, `lib.rs` detectează argumentul și lasă fereastra ascunsă în tray.
Comutatorul din **Setări → „Pornește odată cu Windows”** activează/dezactivează asta.

### Ordonare
Task-urile active apar primele (reordonabile prin drag & drop), cele finalizate dedesubt.
Ordinea manuală se salvează în coloana `position`.

---

## Structura proiectului

```
quicktasks/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── preview.html              # mock static al UI-ului (fără Tauri)
├── src/                      # frontend React + TypeScript
│   ├── main.tsx
│   ├── App.tsx               # asamblare: stare, căutare, selecție, scurtături
│   ├── styles.css            # tokens light/dark, UI minimalist
│   ├── types.ts
│   ├── db/database.ts        # stratul SQLite (CRUD + ștergere expirate)
│   ├── lib/time.ts           # logica de expirare 24h + formatări
│   ├── hooks/
│   │   ├── useTasks.ts       # starea task-urilor + măturarea automată
│   │   ├── useTheme.ts       # dark/light persistent
│   │   └── useHotkeys.ts     # scurtături de tastatură
│   └── components/
│       ├── Header.tsx
│       ├── TaskInput.tsx
│       ├── SearchBar.tsx
│       ├── TaskList.tsx      # split activ/finalizat + drag & drop
│       ├── TaskItem.tsx      # rând-task + inel de expirare
│       └── Settings.tsx      # autostart + temă
└── src-tauri/                # backend Rust (Tauri 2)
    ├── Cargo.toml
    ├── tauri.conf.json
    ├── build.rs
    ├── capabilities/default.json
    ├── icons/
    └── src/
        ├── main.rs
        └── lib.rs            # plugins + tray + close-to-tray + start minimizat
```

---

## Unde sunt salvate datele

Baza de date SQLite se creează automat în directorul de config al aplicației, ex:
```
C:\Users\<user>\AppData\Roaming\com.quicktasks.app\quicktasks.db
```
Preferința de temă se salvează în `localStorage` (persistă între sesiuni).

---

## Depanare

- **„failed to bundle project” / eroare la icon** — asigură-te că folderul `src-tauri/icons/`
  conține fișierele generate (`icon.ico`, `32x32.png`, `128x128.png`, `[email protected]`, `icon.png`).
- **Autostart nu pornește** — verifică comutatorul din Setări; la nivel de Windows apare în
  `Task Manager → Startup apps`.
- **Fereastra „dispare” la X** — e intenționat: aplicația trece în tray. Redeschide din iconița de tray
  sau ieși complet din meniul tray → „Ieșire”.
- **Prima compilare durează** — normal, Rust compilează toate dependențele o singură dată.

---

Cod modular și comentat, ușor de extins (ex: notificări, sincronizare, categorii).

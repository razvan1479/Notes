// Logica nativa a aplicatiei:
//  - inregistrarea plugin-urilor (SQLite, autostart, single-instance);
//  - iconita din System Tray cu meniu (Deschide / Iesire);
//  - inchiderea ferestrei ascunde in tray (nu inchide aplicatia);
//  - pornirea minimizata cand Windows lanseaza aplicatia automat.

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};
use tauri_plugin_autostart::MacosLauncher;

/// Aseaza fereastra pe marginea dreapta a monitorului, pe toata inaltimea lui.
fn dock_right(window: &tauri::WebviewWindow) {
    let monitor = window
        .current_monitor()
        .ok()
        .flatten()
        .or_else(|| window.primary_monitor().ok().flatten());
    if let Some(monitor) = monitor {
        let msize = monitor.size();
        let mpos = monitor.position();
        if let Ok(wsize) = window.outer_size() {
            // Pastram latimea curenta, dar intindem inaltimea pe tot monitorul.
            let _ = window.set_size(tauri::PhysicalSize::new(wsize.width, msize.height));
            let x = mpos.x + msize.width as i32 - wsize.width as i32;
            let y = mpos.y;
            let _ = window.set_position(tauri::PhysicalPosition::new(x, y));
        }
    }
}

/// Afiseaza si focalizeaza fereastra principala (din tray sau alt instance).
fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        dock_right(&window);
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Single-instance TREBUIE inregistrat primul: daca aplicatia e deja
        // pornita, o a doua lansare doar aduce fereastra existenta in fata.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            show_main_window(app);
        }))
        // SQLite pentru stocare locala.
        .plugin(tauri_plugin_sql::Builder::default().build())
        // Update in-app: verifica GitHub Releases si instaleaza versiuni noi semnate.
        .plugin(tauri_plugin_updater::Builder::new().build())
        // Necesar pentru relansarea aplicatiei dupa instalarea update-ului.
        .plugin(tauri_plugin_process::init())
        // Pornire automata cu Windows. Argumentul "--minimized" este adaugat
        // la comanda de lansare, ca sa stim ca pornirea a venit de la sistem.
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .setup(|app| {
            // ---- Meniul din tray ----
            let show_item = MenuItem::with_id(app, "show", "Deschide", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Iesire", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            // ---- Iconita din tray ----
            let mut tray_builder = TrayIconBuilder::new()
                .tooltip("QuickTasks")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => show_main_window(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    // Click stanga pe iconita => deschide fereastra.
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        show_main_window(tray.app_handle());
                    }
                });

            if let Some(icon) = app.default_window_icon() {
                tray_builder = tray_builder.icon(icon.clone());
            }
            tray_builder.build(app)?;

            // ---- Inchiderea ferestrei ascunde in tray ----
            if let Some(window) = app.get_webview_window("main") {
                let win = window.clone();
                window.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        // Nu inchidem aplicatia: doar ascundem fereastra.
                        api.prevent_close();
                        let _ = win.hide();
                    }
                });

                // ---- Pornire minimizata la boot ----
                // Daca lansarea a venit de la Windows (autostart), fereastra
                // ramane ascunsa in tray. Altfel, o afisam normal.
                let started_by_system =
                    std::env::args().any(|arg| arg == "--minimized");
                if started_by_system {
                    let _ = window.hide();
                } else {
                    dock_right(&window);
                    let _ = window.show();
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("eroare la pornirea aplicatiei QuickTasks");
}

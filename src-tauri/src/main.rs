// Punctul de intrare al aplicatiei desktop.
// Pe Windows, in release, ascundem fereastra de consola.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    quicktasks_lib::run()
}

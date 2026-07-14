import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Configurare Vite adaptata pentru Tauri.
// Tauri asteapta un port fix si nu are nevoie de curatarea ecranului in consola.
export default defineConfig({
  plugins: [react()],
  // Evitam ca Vite sa ascunda erorile Rust din terminal.
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // Nu urmarim modificarile din backend-ul Rust (le gestioneaza cargo).
      ignored: ["**/src-tauri/**"],
    },
  },
  // Build-ul frontend-ului: tinta moderna, fara sourcemaps in productie.
  build: {
    target: "esnext",
    minify: "esbuild",
    sourcemap: false,
  },
});

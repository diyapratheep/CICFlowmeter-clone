import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  build: {
    // Specify the output directory to your backend's public folder
    outDir: "../backend/public", // Adjust the path to match your backend's folder structure
    emptyOutDir: true, // Ensures the directory is cleaned before building
  },
});
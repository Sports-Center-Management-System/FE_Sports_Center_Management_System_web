// vite.config.ts
import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Đổi __dirname thành import.meta.dirname
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});

import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  publicDir: "public",
  build: {
    target: "es2022",
    sourcemap: false,
    assetsInlineLimit: 4096
  }
});

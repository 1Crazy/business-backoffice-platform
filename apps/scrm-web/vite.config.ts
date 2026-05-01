import path from "node:path";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import qiankun from "vite-plugin-qiankun";

const devHost = process.env.VITE_DEV_ALLOW_LAN === "true" ? "0.0.0.0" : "localhost";
const allowedHostOrigins = [
  "http://localhost:5175",
  "http://127.0.0.1:5175",
  ...(process.env.VITE_DEV_HOST_ORIGIN ? process.env.VITE_DEV_HOST_ORIGIN.split(",").map((item) => item.trim()).filter(Boolean) : [])
];

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.split(path.sep).join("/");

          if (!normalizedId.includes("/node_modules/")) {
            return;
          }

          if (
            normalizedId.includes("/node_modules/element-plus/") ||
            normalizedId.includes("/node_modules/@element-plus/")
          ) {
            return "element-plus";
          }

          if (normalizedId.includes("/node_modules/vue-router/")) {
            return "vue-router";
          }

          if (
            normalizedId.includes("/node_modules/vue/") ||
            normalizedId.includes("/node_modules/@vue/") ||
            normalizedId.includes("/node_modules/pinia/")
          ) {
            return "vue-vendor";
          }

          return "vendor";
        }
      }
    }
  },
  plugins: [vue(), qiankun("scrm-web", { useDevMode: true })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },
  server: {
    cors: {
      origin: allowedHostOrigins,
      credentials: true
    },
    host: devHost,
    hmr: false,
    origin: "http://localhost:5173",
    port: 5173
  }
});

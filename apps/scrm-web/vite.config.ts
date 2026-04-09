import path from "node:path";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import qiankun from "vite-plugin-qiankun";

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
    cors: true,
    headers: {
      "Access-Control-Allow-Origin": "*"
    },
    hmr: false,
    origin: "http://localhost:5173",
    port: 5173
  }
});

import path from "node:path";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

const devHost = process.env.VITE_DEV_ALLOW_LAN === "true" ? "0.0.0.0" : "localhost";

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

          if (normalizedId.includes("/node_modules/qiankun/")) {
            return "qiankun";
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
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },
  server: {
    host: devHost,
    port: 5175
  }
});

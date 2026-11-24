import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["brand/YITZoneIconWeb.png"],
      manifest: {
        name: "YITZone — Đoàn Hội & Học thuật FIT",
        short_name: "YITZone",
        description: "Hệ thống Quản lý Hoạt động Đoàn - Hội & Học thuật Khoa CNTT",
        theme_color: "#090d16",
        background_color: "#060a14",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "brand/YITZoneIconWeb.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,svg}"],
        runtimeCaching: [
          {
            // Cache large static images at runtime instead of precaching >2MB on first PWA install
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "yitzone-images-cache",
              expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 3600 }
            }
          },
          {
            // Only cache unauthenticated public GET /api/v1/events requests without custom scope header
            // to prevent leaking internal events across users on shared BTC devices
            urlPattern: ({ url, request }) =>
              request.method === "GET" &&
              url.pathname.startsWith("/api/v1/events") &&
              !request.headers.has("Authorization") &&
              (!request.headers.has("X-Active-Scope-Id") ||
                request.headers.get("X-Active-Scope-Id") === "FACULTY"),
            handler: "NetworkFirst",
            options: {
              cacheName: "yitzone-events-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 3600 }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  define: {
    global: "globalThis"
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@radix-ui") || id.includes("lucide-react")) return "vendor-ui";
            if (id.includes("react-router") || id.includes("@tanstack")) return "vendor-data";
            return "vendor";
          }
          return undefined;
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true
      },
      "/ws": {
        target: "http://localhost:8080",
        ws: true,
        changeOrigin: true
      }
    }
  }
});

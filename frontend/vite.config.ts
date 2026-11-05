import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "redirect-mizan-slash",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === "/Mizan" || req.url === "/Vendora") {
            res.writeHead(301, { Location: "/Mizan/" });
            res.end();
            return;
          }
          next();
        });
      },
    },
  ],
  base: process.env.VITE_BASE ?? (process.env.VERCEL ? "/" : "/Mizan/"),
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@modules": fileURLToPath(new URL("../modules", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          motion: ["motion", "framer-motion", "motion-dom"],
          query: ["@tanstack/react-query"],
          charts: ["recharts"],
          icons: ["lucide-react"],
        },
      },
    },
  },
  server: {
    fs: {
      allow: [".."],
    },
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "tomato-local-api",
      async configureServer(server) {
        const { localApi } = await import("./server/local.js");
        server.middlewares.use(localApi());
      },
      async configurePreviewServer(server) {
        const { localApi } = await import("./server/local.js");
        server.middlewares.use(localApi());
      },
    },
  ],
  build: {
    outDir: "dist/client",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("recharts") ||
            id.includes("/d3-") ||
            id.includes("/victory-vendor/")
          )
            return "charts";
          if (
            /node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(
              id,
            )
          )
            return "react";
        },
      },
    },
  },
});

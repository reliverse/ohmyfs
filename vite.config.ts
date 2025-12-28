import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

const host = process.env.TAURI_DEV_HOST;
const PROXY_PATH_REGEX = /^\/api\/proxy/;

// Plugin to handle API routes in development
const apiPlugin = (): Plugin => ({
  name: "api-routes",
  configureServer(server) {
    server.middlewares.use("/api/server/status", async (_req, res) => {
      const { getServerStatus } = await import(
        path.resolve(
          path.dirname(fileURLToPath(import.meta.url)),
          "./src/utils/server-status"
        )
      );
      const status = await getServerStatus();
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(status));
    });
  },
});

// https://vitejs.dev/config/
const config = defineConfig(() => ({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    apiPlugin(),
    // devtools(), // import { devtools } from "@tanstack/devtools-vite";
    viteTsConfigPaths({
      // https://github.com/aleclarson/vite-tsconfig-paths#readme
      // this is the plugin that enables path aliases
      projects: ["./tsconfig.json"],
      logFile: false,
    }),
    tailwindcss(),
    viteReact({
      // babel: {
      // 	plugins: ["babel-plugin-react-compiler"],
      // },
    }),
  ],

  // viteTsConfigPaths handles the path aliases from tsconfig.json
  // but it does not supports CSS, so we using the following to enable it
  resolve: {
    alias: {
      "~": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "./src"),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host ?? false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
    proxy: {
      // Proxy API requests to avoid CORS issues in development
      "/api/proxy": {
        target: "https://api.ohmyfs.com",
        changeOrigin: true,
        rewrite: (path: string) => path.replace(PROXY_PATH_REGEX, ""),
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            console.error("Proxy error:", err);
          });
        },
      },
    },
  },

  // Additional build options
  esbuild: {
    target: "es2022",
  },

  // Bundle optimization
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          vendor: ["react", "react-dom"],
          router: ["@tanstack/react-router"],
          query: ["@tanstack/react-query"],
          ui: ["lucide-react"],
          utils: ["date-fns", "lodash-es"],
        },
      },
    },
    // Enable source maps for better debugging in production
    sourcemap: false,
    // Minify for better performance
    minify: "esbuild",
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
}));

export default config;

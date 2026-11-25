import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

function serveSourceTemplateAtRoot() {
  return {
    name: "sbs-source-template-at-root",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        if (request.url === "/" || request.url?.startsWith("/?")) {
          request.url = request.url.replace(/^\/(?=\?|$)/, "/index.template.html");
        }
        next();
      });
    }
  };
}

export default defineConfig({
  base: "./",
  plugins: [serveSourceTemplateAtRoot()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true
  },
  build: {
    target: "es2022",
    sourcemap: false,
    assetsInlineLimit: 512 * 1024 * 1024,
    chunkSizeWarningLimit: 1024,
    rolldownOptions: {
      input: resolve(projectRoot, "index.template.html"),
      output: {
        codeSplitting: false
      }
    }
  }
});

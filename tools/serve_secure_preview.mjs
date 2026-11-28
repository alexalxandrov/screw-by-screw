#!/usr/bin/env node
import { createReadStream } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const distributionRoot = await realpath(resolve(projectRoot, "dist"));
const host = "127.0.0.1";
const port = Number(process.env.CSP_PREVIEW_PORT || 4174);

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".webp", "image/webp"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".woff2", "font/woff2"],
  [".glb", "model/gltf-binary"],
  [".sbsmodel", "application/octet-stream"]
]);

const securityHeaders = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self'",
    "script-src-attr 'none'",
    "style-src 'self'",
    "style-src-attr 'none'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join("; "),
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cache-Control": "no-store"
};

function respond(res, status, message) {
  res.writeHead(status, {
    ...securityHeaders,
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Length": Buffer.byteLength(message)
  });
  res.end(message);
}

const server = createServer(async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    respond(res, 405, "Method not allowed");
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url || "/", "http://localhost").pathname);
  } catch {
    respond(res, 400, "Invalid URL");
    return;
  }

  const candidate = resolve(distributionRoot, "." + pathname);
  if (candidate !== distributionRoot && !candidate.startsWith(distributionRoot + sep)) {
    respond(res, 403, "Path is outside the web distribution");
    return;
  }

  try {
    let filePath = await realpath(candidate);
    if (filePath !== distributionRoot && !filePath.startsWith(distributionRoot + sep)) {
      respond(res, 403, "Resolved path is outside the web distribution");
      return;
    }
    let info = await stat(filePath);
    if (info.isDirectory()) {
      filePath = await realpath(resolve(filePath, "index.html"));
      info = await stat(filePath);
    }
    if (!info.isFile() || !filePath.startsWith(distributionRoot + sep)) {
      respond(res, 404, "Not found");
      return;
    }

    res.writeHead(200, {
      ...securityHeaders,
      "Content-Type": contentTypes.get(extname(filePath).toLowerCase()) || "application/octet-stream",
      "Content-Length": info.size
    });
    if (req.method === "HEAD") res.end();
    else createReadStream(filePath).pipe(res);
  } catch {
    respond(res, 404, "Not found");
  }
});

server.listen(port, host, () => {
  process.stdout.write("Strict-CSP preview listening at http://" + host + ":" + port + "\n");
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}

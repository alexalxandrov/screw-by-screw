#!/usr/bin/env node
/**
 * Preserve Vite's asset-based web build in dist/index.html and emit a
 * self-contained root index.html for direct file:// use.
 */
import { access, readFile, writeFile, unlink, rename } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = resolve(projectRoot, "dist");
const templatePath = resolve(distRoot, "index.template.html");
const standaloneOutputPath = resolve(projectRoot, "index.html");
const webOutputPath = resolve(distRoot, "index.html");

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

async function safeLocalPath(reference, preferredRoot) {
  const clean = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
  if (!clean || /^(?:[a-z]+:)?\/\//i.test(clean) || clean.startsWith("data:")) {
    throw new Error("Expected a local build asset, received: " + reference);
  }
  const relativePath = clean.replace(/^\.\//, "").replace(/^\/+/, "");
  if (isAbsolute(relativePath)) throw new Error("Absolute build asset paths are not allowed");
  const candidates = [resolve(preferredRoot, relativePath), resolve(projectRoot, relativePath)];
  for (const candidate of candidates) {
    const rel = relative(projectRoot, candidate);
    if (rel !== ".." && !rel.startsWith(".." + sep) && await exists(candidate)) return candidate;
  }
  throw new Error("Could not find local build asset: " + reference);
}

function escapeClosingTag(source, tagName) {
  const pattern = new RegExp("</" + tagName, "gi");
  return source.replace(pattern, (match) => "<\\/" + match.slice(1));
}

let html = await readFile(templatePath, "utf8");
const webHtml = html;
const inlineScriptPattern = /<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/i;
if (inlineScriptPattern.test(webHtml)) {
  throw new Error("Web build contains an inline script and is not compatible with the documented strict CSP");
}
if (/<style\b/i.test(webHtml) || /\sstyle\s*=/i.test(webHtml)) {
  throw new Error("Web build contains inline styles and is not compatible with the documented strict CSP");
}
const webScriptTags = [...webHtml.matchAll(/<script\b[^>]*\bsrc=(["'])([^"']+\.js(?:\?[^"']*)?)\1[^>]*>/gi)];
const webStylesheetTags = [...webHtml.matchAll(/<link\b(?=[^>]*\brel=(["'])stylesheet\1)[^>]*>/gi)];
if (webScriptTags.length < 1 || webStylesheetTags.length < 1) {
  throw new Error("Vite web build must keep JavaScript and CSS as external assets");
}
for (const match of webScriptTags) await safeLocalPath(match[2], distRoot);
for (const match of webStylesheetTags) {
  const href = match[0].match(/\bhref=(["'])(.*?)\1/i)?.[2];
  if (!href) throw new Error("Web stylesheet link has no href");
  await safeLocalPath(href, distRoot);
}
const webTemporaryPath = webOutputPath + ".tmp";
await writeFile(webTemporaryPath, webHtml, "utf8");
await rename(webTemporaryPath, webOutputPath);

let inlinedScripts = 0;
const scriptTags = [...html.matchAll(/<script\b[^>]*\bsrc=(["'])([^"']+\.js(?:\?[^"']*)?)\1[^>]*>\s*<\/script>/gi)];
for (const match of scriptTags) {
  const assetPath = await safeLocalPath(match[2], distRoot);
  let source = await readFile(assetPath, "utf8");
  source = source.replace(/^\/\/# sourceMappingURL=.*$/gm, "");
  const syntaxCheckPath = resolve(distRoot, ".standalone-entry-check.mjs");
  await writeFile(syntaxCheckPath, source, "utf8");
  const syntaxCheck = spawnSync(process.execPath, ["--check", syntaxCheckPath], { encoding: "utf8" });
  await unlink(syntaxCheckPath).catch(() => {});
  if (syntaxCheck.status !== 0) {
    throw new Error("Vite JavaScript bundle failed syntax validation:\n" + (syntaxCheck.stderr || syntaxCheck.stdout));
  }
  // Keep the application source out of the HTML parser. A base64 data module
  // avoids accidental </script> termination inside shader strings/templates.
  const encodedModule = Buffer.from(source, "utf8").toString("base64");
  const replacement = '<script type="module">\n' +
    'import("data:text/javascript;base64,' + encodedModule + '").catch((error) => {\n' +
    '  console.error("Screw by Screw failed to start:", error);\n' +
    '  document.getElementById("startup-fallback")?.removeAttribute("hidden");\n' +
    '});\n</script>';
  html = html.replace(match[0], replacement);
  inlinedScripts += 1;
}
if (inlinedScripts < 1) throw new Error("Vite emitted no external JavaScript entry to inline");

const stylesheetTags = [...html.matchAll(/<link\b(?=[^>]*\brel=(["'])stylesheet\1)[^>]*>/gi)];
for (const match of stylesheetTags) {
  const href = match[0].match(/\bhref=(["'])(.*?)\1/i)?.[2];
  if (!href) throw new Error("Stylesheet link has no href");
  const assetPath = await safeLocalPath(href, distRoot);
  const css = escapeClosingTag(await readFile(assetPath, "utf8"), "style");
  html = html.replace(match[0], "<style>\n" + css + "\n</style>");
}
html = html.replace(/<link\b(?=[^>]*\brel=(["'])modulepreload\1)[^>]*>/gi, "");

// Embed staged catalogue packages into the offline launcher for double-click file:// use.
const catalogManifestPath = resolve(projectRoot, "content/catalog/models.json");
const embeddedCatalogPackages = {};
let embeddedCatalogPackageCount = 0;
let embeddedCatalogPackageBytes = 0;
if (await exists(catalogManifestPath)) {
  const catalogManifest = JSON.parse(await readFile(catalogManifestPath, "utf8"));
  if (!Array.isArray(catalogManifest.models)) throw new Error("Model catalogue must contain a models array");
  const publicRoot = resolve(projectRoot, "public");
  for (const model of catalogManifest.models) {
    const packagePath = model.package_path;
    if (typeof model.id !== "string" || !model.id || typeof packagePath !== "string" ||
        packagePath.startsWith("/") || packagePath.includes(String.fromCharCode(92)) ||
        /^[a-z]+:/i.test(packagePath) ||
        packagePath.split("/").some((part) => !part || part === "." || part === ".." || part.includes("%") || part.includes("?") || part.includes("#")) ||
        !packagePath.endsWith(".sbsmodel")) {
      throw new Error("Unsafe catalogue package path for model " + String(model.id));
    }
    // Unpublished research archives must never be bundled into the public offline launcher.
    if (model.published === false) continue;
    const assetPath = resolve(publicRoot, ...packagePath.split("/"));
    const publicRelative = relative(publicRoot, assetPath);
    if (!publicRelative || publicRelative === ".." || publicRelative.startsWith(".." + sep) || isAbsolute(publicRelative)) {
      throw new Error("Catalogue package path escapes public/: " + packagePath);
    }
    if (!(await exists(assetPath))) continue;
    const bytes = await readFile(assetPath);
    if (!bytes.length || bytes.length > 512 * 1024 * 1024) {
      throw new Error("Catalogue package size is outside the 512 MiB limit: " + packagePath);
    }
    embeddedCatalogPackageBytes += bytes.length;
    if (embeddedCatalogPackageBytes > 512 * 1024 * 1024) {
      throw new Error("Embedded catalogue packages exceed the 512 MiB total limit");
    }
    embeddedCatalogPackages[model.id] = "data:application/octet-stream;base64," + bytes.toString("base64");
    embeddedCatalogPackageCount += 1;
  }
}
if (embeddedCatalogPackageCount) {
  const preload = "<script>globalThis.SBS_CATALOG_PACKAGE_DATA_URLS = " +
    JSON.stringify(embeddedCatalogPackages) + ";</script>";
  html = html.replace("</head>", preload + "\n</head>");
}

if (/<script\b[^>]*\bsrc=/i.test(html)) throw new Error("Standalone HTML still contains an external script");
if (/<link\b(?=[^>]*\brel=(["'])stylesheet\1)[^>]*\bhref=/i.test(html)) throw new Error("Standalone HTML still contains an external stylesheet");
if (!html.includes('id="viewer-canvas"') || !html.includes('id="startup-fallback"')) {
  throw new Error("Generated HTML is missing required viewer shell elements");
}
if (embeddedCatalogPackageCount > 0 && !html.includes("SBS_CATALOG_PACKAGE_DATA_URLS")) {
  throw new Error("Generated HTML did not embed staged catalogue packages");
}
const standaloneTemporaryPath = standaloneOutputPath + ".tmp";
await writeFile(standaloneTemporaryPath, html, "utf8");
await rename(standaloneTemporaryPath, standaloneOutputPath);

console.log(JSON.stringify({
  outputs: {
    web: relative(projectRoot, webOutputPath),
    standalone: relative(projectRoot, standaloneOutputPath)
  },
  webExternalScripts: webScriptTags.length,
  webExternalStylesheets: webStylesheetTags.length,
  inlinedScripts,
  stylesheetsInlined: stylesheetTags.length,
  embeddedCatalogPackages: embeddedCatalogPackageCount,
  embeddedCatalogPackageBytes,
  launchMode: "file:// self-contained HTML",
  bytes: Buffer.byteLength(html)
}, null, 2));

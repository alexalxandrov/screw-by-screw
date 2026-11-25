#!/usr/bin/env node
/**
 * Turn Vite's production HTML entry into a self-contained root index.html.
 * The generated file is designed to be opened directly with file://.
 */
import { access, readFile, writeFile, unlink } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = resolve(projectRoot, "dist");
const templatePath = resolve(distRoot, "index.template.html");
const htmlOutputPaths = [
  resolve(projectRoot, "index.html"),
  resolve(distRoot, "index.html")
];

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
    throw new Error("Vite JavaScript bundle failed syntax validation:\\n" + (syntaxCheck.stderr || syntaxCheck.stdout));
  }
  // Keep the application source out of the HTML parser. A base64 data module
  // avoids accidental </script> termination inside shader strings/templates.
  const encodedModule = Buffer.from(source, "utf8").toString("base64");
  const replacement = '<script type="module">\\n' +
    'import("data:text/javascript;base64,' + encodedModule + '").catch((error) => {\\n' +
    '  console.error("Screw by Screw failed to start:", error);\\n' +
    '  document.getElementById("startup-fallback")?.removeAttribute("hidden");\\n' +
    '});\\n</script>';
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

const publicGlb = resolve(projectRoot, "public/models/rtx3060_xc_black_blockout_v04.glb");
if (await exists(publicGlb)) {
  const bytes = await readFile(publicGlb);
  const dataUrl = "data:model/gltf-binary;base64," + bytes.toString("base64");
  const preload = "<script>globalThis.SBS_BUNDLED_GLB_DATA_URL = " + JSON.stringify(dataUrl) + ";</script>";
  html = html.replace("</head>", preload + "\n</head>");
}

if (/<script\b[^>]*\bsrc=/i.test(html)) throw new Error("Standalone HTML still contains an external script");
if (/<link\b(?=[^>]*\brel=(["'])stylesheet\1)[^>]*\bhref=/i.test(html)) throw new Error("Standalone HTML still contains an external stylesheet");
if (!html.includes('id="viewer-canvas"') || !html.includes('id="startup-fallback"')) {
  throw new Error("Generated HTML is missing required viewer shell elements");
}
if (!html.includes("SBS_BUNDLED_GLB_DATA_URL") && await exists(publicGlb)) {
  throw new Error("Generated HTML did not embed the staged Blender GLB");
}
for (const outputPath of htmlOutputPaths) await writeFile(outputPath, html, "utf8");

console.log(JSON.stringify({
  outputs: htmlOutputPaths.map((path) => relative(projectRoot, path)),
  inlinedScripts,
  stylesheetsInlined: stylesheetTags.length,
  embeddedGlb: html.includes("SBS_BUNDLED_GLB_DATA_URL"),
  bytes: Buffer.byteLength(html)
}, null, 2));

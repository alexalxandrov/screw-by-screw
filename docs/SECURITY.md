# Security and privacy notes

## Application boundary

Screw by Screw is a static browser application. There is no application backend, account system, analytics SDK, telemetry endpoint or file-upload service in this prototype.

- A user-selected GLB is read with the browser File API and parsed in the current page.
- The application does not send the selected file to a server.
- Source links are ordinary outbound links opened only after user interaction.
- Imported `.sbsmodel` source links (`url`, `identity_reference_url`, and `identity_reference_image_url`) must be absolute HTTP(S) URLs; the model-data adapter also normalizes or drops non-web schemes before exposing them to the UI.
- No remote fonts are loaded.
- Vite development binds to `127.0.0.1`.

## GLB import controls

The prototype:
- accepts binary glTF 2.0 (.glb) only;
- rejects files larger than 256 MiB;
- validates GLB magic, version, declared length, JSON chunk ordering, chunk alignment and bounds;
- rejects external `buffers[].uri` and `images[].uri` references (embedded `data:` resources remain allowed);
- warns on duplicate component IDs;
- uses `textContent` for imported names and metadata rather than injecting model strings as HTML.

This is a client-side safety boundary, not a formal sandbox for hostile 3D assets. Browser and Three.js vulnerabilities remain possible; keep the browser and dependencies updated.

## Build outputs and production hosting headers

`npm run build` creates two intentionally different outputs:

- Root `index.html` is the self-contained offline launcher for direct `file://` use. It inlines CSS and JavaScript and may embed available model packages. It is not the artifact covered by the strict web CSP below.
- `dist/index.html` and `dist/assets/` are the web distribution. The HTML references same-origin external JavaScript and CSS and is checked by the build script for inline scripts/styles. Deploy the complete `dist/` directory, preserving its relative asset paths.

Do not deploy the root standalone launcher with the strict CSP below. Do not weaken the web policy with `unsafe-inline` or `data:` merely to make that standalone file work on a server.

For a static web host serving the `dist/` output, configure response headers similar to:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

The `frame-ancestors` directive must be sent as an HTTP response header; it is not effective in a CSP meta element. Adjust `connect-src` for the local Vite HMR WebSocket only in development, not production.

## Dependency and release controls

- Direct frontend dependencies are exact-version pinned in `package.json`.
- `package-lock.json` is committed; CI installs from it with `npm ci`.
- CI runs a production build and Playwright browser tests.
- The content package has a SHA-256 manifest builder and validator.
- Third-party images/video frames are not committed; source URLs and rights status are recorded separately.

## Remaining security review

Before public deployment, review the hosting provider, TLS configuration, response headers, dependency audit output, model-parser attack surface, file-size policy, accessibility, and whether any future backend changes the no-upload/no-account privacy boundary.


## Model package import controls

The `.sbsmodel` loader supports two transports: a ZIP archive with a root `sbs-model.json` manifest, and a UTF-8 JSON envelope prefixed by `SBSMODEL-JSON\n`. In the JSON envelope, sidecars are UTF-8 strings and the GLB payload is base64-encoded. Both transports use the same safe-path, entry-count, expanded-size, SHA-256, cross-reference and GLB-binding validation before the model is applied to the viewer.

The JSON envelope is a transport format, not a trust boundary. Treat every imported package as untrusted input and retain the existing size limits and integrity checks.

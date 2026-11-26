# Security and privacy notes

## Application boundary

Screw by Screw is a static browser application. There is no application backend, account system, analytics SDK, telemetry endpoint or file-upload service in this prototype.

- A user-selected GLB is read with the browser File API and parsed in the current page.
- The application does not send the selected file to a server.
- Source links are ordinary outbound links opened only after user interaction.
- Imported `.sbsmodel` source links (`url`, `identity_reference_url`, and `identity_reference_image_url`) must be absolute HTTP(S) URLs; the model-data adapter also normalizes or drops non-web schemes before exposing them to the UI.
- No remote fonts are loaded.
- Vite development binds to `127.0.0.1`.

## Model package import controls

The `.sbsmodel` loader accepts the legacy ZIP container and the UTF-8 `SBSMODEL-JSON` envelope. Both are treated as untrusted input and pass through the same manifest, checksum, schema and cross-reference validation.

- Actual package `ArrayBuffer` size is checked against the 512 MiB limit; the browser does not rely only on the file-picker-reported size.
- ZIP64 and multi-disk ZIPs are rejected. ZIP entry paths, duplicate mappings, entry count and expanded size are checked before model data is applied.
- The JSON envelope is limited to 128 entries and 512 MiB of combined decoded payload. Its GLB base64 size is bounded before `atob` decoding.
- All package paths reject absolute paths, traversal, drive-letter prefixes, backslashes, NUL bytes and empty/dot path segments.
- SHA-256 is verified for every declared payload using Web Crypto; the JSON envelope hashes the decoded GLB bytes, not its base64 text.
- GLB external buffer and image URIs are rejected. Model-provided source links must use HTTP(S).

These limits reduce malformed-package and resource-exhaustion exposure; they do not make hostile GLB content a formally sandboxed input.

## GLB import controls

The prototype:
- accepts binary glTF 2.0 (.glb) only;
- rejects files larger than 256 MiB;
- validates GLB magic, version, declared length, JSON chunk ordering, chunk alignment and bounds;
- rejects external `buffers[].uri` and `images[].uri` references (embedded `data:` resources remain allowed);
- warns on duplicate component IDs;
- uses `textContent` for imported names and metadata rather than injecting model strings as HTML.

This is a client-side safety boundary, not a formal sandbox for hostile 3D assets. Browser and Three.js vulnerabilities remain possible; keep the browser and dependencies updated.

## Production hosting headers

For a static production host, configure response headers similar to:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

The `frame-ancestors` directive must be sent as an HTTP response header; it is not effective in a CSP meta element. Adjust `connect-src` for the local Vite HMR WebSocket only in development, not production.

## Dependency and release controls

- Direct frontend dependencies are exact-version pinned in `package.json`.
- A committed npm lockfile is still required before 1.0.
- CI runs a production build and Playwright browser tests.
- The content package has a SHA-256 manifest builder and validator.
- Third-party images/video frames are not committed; source URLs and rights status are recorded separately.

## Remaining security review

Before public deployment, review the hosting provider, TLS configuration, response headers, dependency audit output, model-parser attack surface, file-size policy, accessibility, and whether any future backend changes the no-upload/no-account privacy boundary.

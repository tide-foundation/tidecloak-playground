import fs from "fs"
import path from "path"

// ─────────────────────────────────────────────────────────────────────────────
// Tide DPoP resource-server endpoint.
//
// DPoP is enabled by default, and the SDK's DPoP flow loads this page from your
// own origin at:
//   /tide_dpop/iss/<issuer-hex>/aud/<client-hex>/tide_dpop_auth.html
//
// This catch-all route serves the single bundled `public/tide_dpop_auth.html`
// for any such path, with the two response headers Tide requires:
//   • Content-Security-Policy — the sha256 hashes pin the file's inline
//     script/style (so only that exact code runs).
//   • Allow-CSP-From: * — lets the ORK embed this page cross-origin.
// ─────────────────────────────────────────────────────────────────────────────

const htmlPath = path.join(process.cwd(), "public", "tide_dpop_auth.html")

const CSP =
  "default-src 'self'; " +
  "script-src 'self' 'sha256-utc6UrebuHOyLd/2aiMXS/p1EDy9UZBDe/XEMKDw9Mc='; " +
  "style-src 'self' 'sha256-1tYy8m3c1KLuGI2eID9TfLkc50Y+iSPJMpI7n/apN/w=' 'sha256-F7OJTdJYct4J+cQfuJUoDauitndqt8pAc8EbA8gwDPU='"

export async function GET() {
  const html = fs.readFileSync(htmlPath, "utf-8")
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html",
      "Content-Security-Policy": CSP,
      "Allow-CSP-From": "*",
    },
  })
}

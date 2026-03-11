/**
 * @file generate-og.mjs
 *
 * Build-time script that generates the Open Graph image (public/og-image.png).
 * Uses only Node.js built-ins + sharp (already a dependency) — no Puppeteer needed.
 *
 * Output: public/og-image.png  (1200×630, recommended OG size)
 */

import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT = path.resolve(__dirname, '../public/og-image.png');

// ── SVG template ──────────────────────────────────────────────────────────────
const svg = /* xml */ `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#0f0c09"/>
      <stop offset="100%" stop-color="#1e160f"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#e05a3a"/>
      <stop offset="100%" stop-color="#c0392b"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Accent bar top -->
  <rect x="0" y="0" width="1200" height="5" fill="url(#accent)"/>

  <!-- Gear icon (simplified) -->
  <g transform="translate(88, 88)">
    <circle cx="40" cy="40" r="16" fill="none" stroke="#e05a3a" stroke-width="6"/>
    <rect x="35" y="4"  width="10" height="14" rx="3" fill="#e05a3a"/>
    <rect x="35" y="62" width="10" height="14" rx="3" fill="#e05a3a"/>
    <rect x="4"  y="35" width="14" height="10" rx="3" fill="#e05a3a"/>
    <rect x="62" y="35" width="14" height="10" rx="3" fill="#e05a3a"/>
    <rect x="16" y="16" width="10" height="14" rx="3" fill="#e05a3a" transform="rotate(45 21 23)"/>
    <rect x="54" y="16" width="10" height="14" rx="3" fill="#e05a3a" transform="rotate(-45 59 23)"/>
    <rect x="16" y="50" width="10" height="14" rx="3" fill="#e05a3a" transform="rotate(-45 21 57)"/>
    <rect x="54" y="50" width="10" height="14" rx="3" fill="#e05a3a" transform="rotate(45 59 57)"/>
  </g>

  <!-- Title -->
  <text x="88" y="230" font-family="system-ui, -apple-system, sans-serif"
        font-size="72" font-weight="800" fill="#ffffff" letter-spacing="-2">
    Rust
    <tspan fill="#e05a3a"> with </tspan>
    <tspan fill="#4fc1e9">TypeScript</tspan>
  </text>

  <!-- Tagline -->
  <text x="88" y="310" font-family="system-ui, -apple-system, sans-serif"
        font-size="32" font-weight="400" fill="#a09080">
    If you know TypeScript, Rust is closer than you think.
  </text>

  <!-- Divider -->
  <rect x="88" y="355" width="120" height="4" rx="2" fill="url(#accent)"/>

  <!-- Code snippet left — TypeScript -->
  <rect x="88" y="385" width="480" height="170" rx="10" fill="#1a1412" opacity="0.9"/>
  <text x="108" y="415" font-family="monospace" font-size="13" fill="#666">// TypeScript</text>
  <text x="108" y="440" font-family="monospace" font-size="14" fill="#c792ea">async function </text>
  <text x="108" y="440" font-family="monospace" font-size="14" fill="#82aaff" dx="152">getUser</text>
  <text x="108" y="440" font-family="monospace" font-size="14" fill="#ffffff" dx="224">(id: </text>
  <text x="108" y="440" font-family="monospace" font-size="14" fill="#ffcb6b" dx="270">string</text>
  <text x="108" y="440" font-family="monospace" font-size="14" fill="#ffffff" dx="318">) {</text>
  <text x="128" y="465" font-family="monospace" font-size="14" fill="#c3e88d">  const user = </text>
  <text x="128" y="465" font-family="monospace" font-size="14" fill="#82aaff" dx="130">await </text>
  <text x="128" y="465" font-family="monospace" font-size="14" fill="#80cbc4" dx="178">fetch</text>
  <text x="128" y="465" font-family="monospace" font-size="14" fill="#ffffff" dx="218">(id);</text>
  <text x="128" y="490" font-family="monospace" font-size="14" fill="#f07178">  // runtime crash possible</text>
  <text x="108" y="515" font-family="monospace" font-size="14" fill="#ffffff">}</text>

  <!-- Code snippet right — Rust -->
  <rect x="632" y="385" width="480" height="170" rx="10" fill="#1a1412" opacity="0.9"/>
  <text x="652" y="415" font-family="monospace" font-size="13" fill="#666">// Rust</text>
  <text x="652" y="440" font-family="monospace" font-size="14" fill="#c792ea">async fn </text>
  <text x="652" y="440" font-family="monospace" font-size="14" fill="#82aaff" dx="80">get_user</text>
  <text x="652" y="440" font-family="monospace" font-size="14" fill="#ffffff" dx="160">(id: </text>
  <text x="652" y="440" font-family="monospace" font-size="14" fill="#ffcb6b" dx="200">&amp;str</text>
  <text x="652" y="440" font-family="monospace" font-size="14" fill="#ffffff" dx="236">) -&gt; </text>
  <text x="652" y="440" font-family="monospace" font-size="14" fill="#c3e88d" dx="274">Result</text>
  <text x="652" y="440" font-family="monospace" font-size="14" fill="#ffffff" dx="330">&lt;User, Err&gt; {</text>
  <text x="672" y="465" font-family="monospace" font-size="14" fill="#c3e88d">  let user = </text>
  <text x="672" y="465" font-family="monospace" font-size="14" fill="#80cbc4" dx="108">fetch</text>
  <text x="672" y="465" font-family="monospace" font-size="14" fill="#ffffff" dx="148">(id).</text>
  <text x="672" y="465" font-family="monospace" font-size="14" fill="#80cbc4" dx="186">await</text>
  <text x="672" y="465" font-family="monospace" font-size="14" fill="#e05a3a" dx="232">?</text>
  <text x="672" y="465" font-family="monospace" font-size="14" fill="#ffffff" dx="244">;</text>
  <text x="672" y="490" font-family="monospace" font-size="14" fill="#c3e88d">  // compile-time guaranteed</text>
  <text x="652" y="515" font-family="monospace" font-size="14" fill="#ffffff">}</text>

  <!-- Bottom label -->
  <text x="88" y="600" font-family="system-ui, -apple-system, sans-serif"
        font-size="22" fill="#4a3a2a">
    rust-with-typescript.pages.dev
  </text>
</svg>
`;

await sharp(Buffer.from(svg)).png().toFile(OUTPUT);
console.log('Generated OG image → public/og-image.png');

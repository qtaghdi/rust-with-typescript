/**
 * @file generate-hashes.mjs
 *
 * Build-time script that generates the SHA-256 allowlist for runnable code blocks.
 *
 * ### Why this exists
 * The sandbox runner (`sandbox-runner/`) executes arbitrary Rust code, so we need
 * to ensure only code blocks that appear in the documentation can be submitted.
 * This script pre-computes a hash for every ` ```rust runnable ` block and writes
 * the list to `src/lib/runnable-hashes.generated.json`, which is bundled into the
 * Cloudflare Worker at build time.
 *
 * ### When to run
 * ```bash
 * node scripts/generate-hashes.mjs
 * ```
 * `bun run build` calls this automatically before `astro build`.
 *
 * ### Output
 * `src/lib/runnable-hashes.generated.json` — a JSON array of hex strings.
 * This file is git-ignored and must be regenerated on every build.
 */

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = path.resolve(__dirname, '../src/content/docs');
const OUTPUT_FILE = path.resolve(__dirname, '../src/lib/runnable-hashes.generated.json');

/**
 * Normalise line endings and strip trailing whitespace.
 * Must match the normalisation in `src/lib/runnable-code.ts`.
 *
 * @param {string} code
 * @returns {string}
 */
function normalizeCode(code) {
  return code.replace(/\r\n/g, '\n').trimEnd();
}

/**
 * @param {string} code
 * @returns {string} SHA-256 hex digest
 */
function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Recursively collect all `.md` and `.mdx` files under `dir`.
 * Includes subdirectories such as `ko/` for localised content.
 *
 * @param {string} dir - Directory to search
 * @returns {Promise<string[]>} Absolute file paths
 */
async function collectDocFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectDocFiles(fullPath)));
    } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Extract the normalised content of every ` ```rust runnable ` block
 * from a Markdown string.
 *
 * @param {string} markdown
 * @returns {string[]} Array of normalised code strings
 */
function extractRunnableRustBlocks(markdown) {
  const blocks = [];
  const fenceRegex = /```(\w+)([^\n]*)\n([\s\S]*?)\n```/g;
  let match;
  while ((match = fenceRegex.exec(markdown)) !== null) {
    const lang = match[1]?.toLowerCase() ?? '';
    const meta = match[2] ?? '';
    if (lang !== 'rust') continue;
    if (!/\brunnable\b/i.test(meta)) continue;
    const code = normalizeCode(match[3] ?? '');
    if (code.length === 0) continue;
    blocks.push(code);
  }
  return blocks;
}

// --- Main ---

const files = await collectDocFiles(DOCS_DIR);
const hashes = [];

for (const file of files) {
  const content = await fs.readFile(file, 'utf-8');
  const blocks = extractRunnableRustBlocks(content);
  for (const block of blocks) {
    hashes.push(hashCode(block));
  }
}

await fs.writeFile(OUTPUT_FILE, JSON.stringify(hashes, null, 2));
console.log(`Generated ${hashes.length} runnable code hashes → src/lib/runnable-hashes.generated.json`);

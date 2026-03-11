/**
 * @module runnable-code
 *
 * Security layer for the Rust code execution feature.
 *
 * ### Flow
 * 1. **Build time** — `scripts/generate-hashes.mjs` scans all Markdown files
 *    for ` ```rust runnable ` blocks, hashes each block, and writes the results
 *    to `src/lib/runnable-hashes.generated.json`.
 * 2. **Request time** — `src/pages/api/run-rust.ts` calls {@link isRunnableCode}
 *    to verify the submitted code exists in the allowlist before forwarding it
 *    to the sandbox runner.
 *
 * ### Why an allowlist?
 * Without it, any visitor could POST arbitrary Rust code to `/api/run-rust`
 * and execute it on the sandbox server.
 *
 * ### Adding new runnable blocks
 * After adding a ` ```rust runnable ` fence in Markdown, run:
 * ```bash
 * node scripts/generate-hashes.mjs
 * ```
 * `bun run build` does this automatically.
 */

import crypto from 'node:crypto';
import hashes from './runnable-hashes.generated.json';

/** Pre-built Set for O(1) lookup at request time */
const HASHES = new Set<string>(hashes);

/**
 * Normalise line endings and strip trailing whitespace so that
 * copy-pasted code with CRLF line endings still matches the stored hash.
 *
 * @param code - Raw code string from the client or Markdown source
 * @returns Normalised code string
 */
function normalizeCode(code: string): string {
  return code.replace(/\r\n/g, '\n').trimEnd();
}

/**
 * @param code - Code string to hash
 * @returns SHA-256 hex digest
 */
function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Returns the Set of allowed code hashes loaded at startup.
 * Async signature is kept for potential future dynamic reloading.
 *
 * @returns Set of SHA-256 hex strings
 */
export async function getRunnableCodeHashes(): Promise<Set<string>> {
  return HASHES;
}

/**
 * Returns `true` if `code` matches one of the pre-approved hashes.
 * Called by the API route before forwarding code to the sandbox runner.
 *
 * @param allowedHashes - Set returned by {@link getRunnableCodeHashes}
 * @param code - Code submitted by the client
 * @returns `true` if the code is in the allowlist
 */
export function isRunnableCode(allowedHashes: Set<string>, code: string): boolean {
  const normalized = normalizeCode(code);
  return allowedHashes.has(hashCode(normalized));
}

/**
 * Normalise code before sending it to the sandbox runner.
 * Ensures consistent input regardless of how the browser copied the code.
 *
 * @param code - Raw code string
 * @returns Normalised code string
 */
export function normalizeRunnableCode(code: string): string {
  return normalizeCode(code);
}

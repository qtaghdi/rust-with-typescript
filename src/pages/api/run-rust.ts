/**
 * @file run-rust.ts
 *
 * API routes for Rust code execution.
 *
 * ### GET /api/run-rust — Warm-up ping
 * Sends a lightweight request to the sandbox runner so the Fly.io machine
 * wakes up before the user clicks "Run". Called automatically by
 * `public/runnable-code.js` whenever runnable blocks are present on a page.
 *
 * ### POST /api/run-rust — Execute code
 * 1. Parses the JSON body `{ code: string }`.
 * 2. Validates the code against the SHA-256 allowlist (`src/lib/runnable-code.ts`).
 *    Returns **403** if the code was not found in the documentation at build time.
 * 3. Forwards the normalised code to the sandbox runner over HTTP.
 * 4. Returns `{ stdout, stderr, exitCode, durationMs }` to the browser.
 *
 * ### Sandbox runner
 * A Rust + Axum HTTP server deployed separately on Fly.io.
 * Source: `sandbox-runner/`
 * Configure the URL via `RUST_RUNNER_URL` in `.env.local` (local dev) or as a
 * Cloudflare Worker secret in production.
 */

import type { APIRoute } from 'astro';
import { getRunnableCodeHashes, isRunnableCode, normalizeRunnableCode } from '../../lib/runnable-code';

export const prerender = false;

/**
 * Sandbox runner base URL.
 * Resolution order:
 *   1. `import.meta.env.RUST_RUNNER_URL` (Vite / Astro env)
 *   2. `process.env.RUST_RUNNER_URL`     (Node / Cloudflare binding)
 *   3. `http://127.0.0.1:4100/run`       (local sandbox runner fallback)
 */
const RUNNER_URL =
  (import.meta.env.RUST_RUNNER_URL as string | undefined) ??
  process.env.RUST_RUNNER_URL ??
  'http://127.0.0.1:4100/run';

/** Health-check endpoint — same host, `/health` path instead of `/run` */
const HEALTH_URL = RUNNER_URL.replace(/\/run$/, '/health');

/** Abort the sandbox request after this many ms to avoid hanging the Worker */
const RUNNER_TIMEOUT_MS = 15000;

/**
 * GET /api/run-rust
 *
 * Wakes the Fly.io sandbox machine before the user runs code.
 * Always returns 204 — a failed ping is non-fatal (just means slower first run).
 */
export const GET: APIRoute = async () => {
  try {
    await fetch(HEALTH_URL, { signal: AbortSignal.timeout(5000) });
  } catch {
    // Warm-up failure is silently ignored
  }
  return new Response(null, { status: 204 });
};

/**
 * POST /api/run-rust
 *
 * @param request - JSON body: `{ code: string }`
 * @returns JSON `{ stdout, stderr, exitCode, durationMs }` on success,
 *          or `{ error: string }` with 400 / 403 / 502 on failure.
 */
export const POST: APIRoute = async ({ request }) => {
  const start = Date.now();
  const headers = { 'Content-Type': 'application/json' };

  // --- Parse request body ---
  const bodyText = await request.text().catch(() => '');
  const body = (() => {
    try {
      return JSON.parse(bodyText || '{}');
    } catch {
      return null;
    }
  })();
  if (!body) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body.' }), { status: 400, headers });
  }

  const code = typeof body?.code === 'string' ? body.code : '';
  if (!code.trim()) {
    return new Response(JSON.stringify({ error: 'Code is required.' }), { status: 400, headers });
  }

  // --- Allowlist check ---
  // Only code that appeared in the documentation at build time is allowed
  const allowedHashes = await getRunnableCodeHashes();
  if (!isRunnableCode(allowedHashes, code)) {
    return new Response(JSON.stringify({ error: 'Code is not allowed.' }), { status: 403, headers });
  }

  // --- Forward to sandbox runner ---
  try {
    const normalized = normalizeRunnableCode(code);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), RUNNER_TIMEOUT_MS);

    const response = await fetch(RUNNER_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ code: normalized }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Runner failed.');
      return new Response(JSON.stringify({ error: errorText || 'Runner failed.' }), { status: 502, headers });
    }

    const run = (await response.json().catch(() => null)) as
      | { stdout: string; stderr: string; exit_code: number; duration_ms: number }
      | null;
    if (!run) {
      return new Response(JSON.stringify({ error: 'Invalid runner response.' }), { status: 502, headers });
    }

    const durationMs = Date.now() - start;
    return new Response(
      JSON.stringify({
        stdout: run.stdout,
        stderr: run.stderr,
        exitCode: run.exit_code,
        durationMs: run.duration_ms || durationMs,
      }),
      { status: 200, headers }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Runner request failed.';
    return new Response(JSON.stringify({ error: message }), { status: 502, headers });
  }
};

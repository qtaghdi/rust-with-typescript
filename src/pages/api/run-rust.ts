import type { APIRoute } from 'astro';
import { getRunnableCodeHashes, isRunnableCode, normalizeRunnableCode } from '../../lib/runnable-code';

export const prerender = false;

const RUNNER_URL =
  (import.meta.env.RUST_RUNNER_URL as string | undefined) ??
  process.env.RUST_RUNNER_URL ??
  'http://127.0.0.1:4100/run';
const HEALTH_URL = RUNNER_URL.replace(/\/run$/, '/health');
const RUNNER_TIMEOUT_MS = 15000;

export const GET: APIRoute = async () => {
  try {
    await fetch(HEALTH_URL, { signal: AbortSignal.timeout(5000) });
  } catch {
    // 웜업 실패해도 무시
  }
  return new Response(null, { status: 204 });
};

export const POST: APIRoute = async ({ request }) => {
  const start = Date.now();
  const headers = { 'Content-Type': 'application/json' };
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

  const allowedHashes = await getRunnableCodeHashes();
  if (!isRunnableCode(allowedHashes, code)) {
    return new Response(JSON.stringify({ error: 'Code is not allowed.' }), { status: 403, headers });
  }

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

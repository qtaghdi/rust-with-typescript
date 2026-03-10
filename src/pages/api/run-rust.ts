import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { getRunnableCodeHashes, isRunnableCode, normalizeRunnableCode } from '../../lib/runnable-code';

export const prerender = false;

const COMPILE_TIMEOUT_MS = 2000;
const RUN_TIMEOUT_MS = 2000;
const OUTPUT_LIMIT = 8192;

function limitOutput(text: string): string {
  if (text.length <= OUTPUT_LIMIT) return text;
  return `${text.slice(0, OUTPUT_LIMIT)}\n...output truncated`;
}

async function runCommand(command: string, args: string[], cwd: string, timeoutMs: number) {
  return new Promise<{ stdout: string; stderr: string; exitCode: number }>((resolve) => {
    const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
      if (stdout.length > OUTPUT_LIMIT * 2) {
        child.kill('SIGKILL');
      }
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
      if (stderr.length > OUTPUT_LIMIT * 2) {
        child.kill('SIGKILL');
      }
    });

    child.on('close', (code) => {
      clearTimeout(timeout);
      resolve({
        stdout: limitOutput(stdout),
        stderr: limitOutput(stderr),
        exitCode: code ?? 1,
      });
    });

    child.on('error', (error) => {
      clearTimeout(timeout);
      resolve({
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error),
        exitCode: 1,
      });
    });
  });
}

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

  const normalized = normalizeRunnableCode(code);
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rust-run-'));
  const sourcePath = path.join(tmpDir, 'main.rs');
  const binaryPath = path.join(tmpDir, 'main');

  try {
    await fs.writeFile(sourcePath, normalized, 'utf-8');

    const compile = await runCommand('rustc', [sourcePath, '--edition=2021', '-o', binaryPath], tmpDir, COMPILE_TIMEOUT_MS);
    if (compile.exitCode !== 0) {
      const durationMs = Date.now() - start;
      return new Response(
        JSON.stringify({
          stdout: compile.stdout,
          stderr: compile.stderr,
          exitCode: compile.exitCode,
          durationMs,
        }),
        { status: 200, headers }
      );
    }

    const run = await runCommand(binaryPath, [], tmpDir, RUN_TIMEOUT_MS);
    const durationMs = Date.now() - start;

    return new Response(
      JSON.stringify({
        stdout: run.stdout,
        stderr: run.stderr,
        exitCode: run.exitCode,
        durationMs,
      }),
      { status: 200, headers }
    );
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => undefined);
  }
};

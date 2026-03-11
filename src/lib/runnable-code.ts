import crypto from 'node:crypto';
import hashes from './runnable-hashes.generated.json';

const HASHES = new Set<string>(hashes);

function normalizeCode(code: string): string {
  return code.replace(/\r\n/g, '\n').trimEnd();
}

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export async function getRunnableCodeHashes(): Promise<Set<string>> {
  return HASHES;
}

export function isRunnableCode(allowedHashes: Set<string>, code: string): boolean {
  const normalized = normalizeCode(code);
  return allowedHashes.has(hashCode(normalized));
}

export function normalizeRunnableCode(code: string): string {
  return normalizeCode(code);
}

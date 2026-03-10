import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const DOCS_DIR = path.resolve(process.cwd(), 'src/content/docs');
let cachedHashes: Set<string> | null = null;

function normalizeCode(code: string): string {
  return code.replace(/\r\n/g, '\n').trimEnd();
}

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

async function collectDocFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectDocFiles(fullPath)));
      continue;
    }
    if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))) {
      files.push(fullPath);
    }
  }

  return files;
}

function extractRunnableRustBlocks(markdown: string): string[] {
  const blocks: string[] = [];
  const fenceRegex = /```(\w+)([^\n]*)\n([\s\S]*?)\n```/g;
  let match: RegExpExecArray | null;

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

export async function getRunnableCodeHashes(): Promise<Set<string>> {
  if (cachedHashes) return cachedHashes;

  const files = await collectDocFiles(DOCS_DIR);
  const hashes = new Set<string>();

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const blocks = extractRunnableRustBlocks(content);
    for (const block of blocks) {
      hashes.add(hashCode(block));
    }
  }

  cachedHashes = hashes;
  return hashes;
}

export function isRunnableCode(allowedHashes: Set<string>, code: string): boolean {
  const normalized = normalizeCode(code);
  const hashed = hashCode(normalized);
  return allowedHashes.has(hashed);
}

export function normalizeRunnableCode(code: string): string {
  return normalizeCode(code);
}

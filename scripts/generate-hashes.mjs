import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = path.resolve(__dirname, '../src/content/docs');
const OUTPUT_FILE = path.resolve(__dirname, '../src/lib/runnable-hashes.generated.json');

function normalizeCode(code) {
  return code.replace(/\r\n/g, '\n').trimEnd();
}

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

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

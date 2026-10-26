/**
 * Builds the Markdown body for a GitHub Release.
 * Usage: node scripts/release-body.mjs v1.2.3
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const tag = (process.argv[2] ?? '').trim();
const version = tag.replace(/^v/, '');

if (!version) {
  console.error('Usage: node scripts/release-body.mjs v1.2.3');
  process.exit(1);
}

let notes = ['Maintenance release with small fixes and polish.'];
let releasedAt = new Date().toISOString().slice(0, 10);

try {
  const file = JSON.parse(
    await readFile(path.join(process.cwd(), 'release-notes', `v${version}.json`), 'utf8')
  );
  if (Array.isArray(file.notes) && file.notes.length > 0) notes = file.notes;
  if (typeof file.releasedAt === 'string') releasedAt = file.releasedAt;
} catch {
  // A release without a notes file still gets a usable body.
}

const body = [
  `## Omnia ${version}`,
  '',
  `Released ${releasedAt}.`,
  '',
  '### What changed',
  '',
  ...notes.map((note) => `- ${note}`),
  '',
  '### Install',
  '',
  '- **Android:** download `omnia.apk` below and open it. It installs over any previous Omnia build signed with the same key.',
  '- **Windows, Linux, macOS:** open https://opbsuthar.github.io/omnia/ and install it as an app from Chrome or Edge.',
  '- **iPhone / iPad:** open the same link in Safari, then Share → Add to Home Screen.',
  '',
  'Installed copies of Omnia pick this release up automatically through the in-app update feed.',
  '',
  '---',
  '',
  'Built by [Omprakash Suthar (@OPBSUTHAR)](https://github.com/OPBSUTHAR).',
  '',
].join('\n');

await writeFile(path.join(process.cwd(), 'release-body.md'), body);
console.log(`Wrote release-body.md for v${version} (${notes.length} notes).`);

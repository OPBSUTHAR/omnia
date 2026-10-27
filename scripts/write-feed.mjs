import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const app = JSON.parse(await readFile(path.join(root, 'app.json'), 'utf8'));
const requested = (process.argv[2] ?? '').replace(/^v/, '');
const version = requested || app.expo.version;
const today = new Date().toISOString().slice(0, 10);

let notes = null;
let releasedAt = today;
try {
  const notesFile = JSON.parse(
    await readFile(path.join(root, 'release-notes', `v${version}.json`), 'utf8')
  );
  if (Array.isArray(notesFile.notes) && notesFile.notes.length > 0) {
    notes = notesFile.notes;
    releasedAt = notesFile.releasedAt ?? releasedAt;
  }
} catch {
  // No release-notes file for this version; fall back to the current feed.
}

if (!notes) {
  try {
    const current = JSON.parse(
      await readFile(path.join(root, 'public', 'updates', 'latest.json'), 'utf8')
    );
    if (current.version === version && Array.isArray(current.notes)) {
      notes = current.notes;
      releasedAt = current.releasedAt ?? releasedAt;
    }
  } catch {
    // Ignore a missing or malformed feed.
  }
}

const repo = 'https://github.com/OPBSUTHAR/omnia';
const versionedRelease = `${repo}/releases/tag/v${version}`;

const feed = {
  version,
  releasedAt,
  notes: notes ?? ['Maintenance release with small fixes and polish.'],
  apkUrl: 'https://opbsuthar.github.io/omnia/download/omnia.apk',
  windowsUrl: `${repo}/releases/latest/download/omnia-windows.exe`,
  linuxUrl: `${repo}/releases/latest/download/omnia-linux.AppImage`,
  webUrl: 'https://omnia-suthara.vercel.app/',
  docsUrl: 'https://opbsuthar.github.io/omnia/',
  releasesUrl: versionedRelease,
  mandatory: false,
};

await writeFile(
  path.join(root, 'public', 'updates', 'latest.json'),
  `${JSON.stringify(feed, null, 2)}\n`
);

console.log(`Update feed set to v${version} — "${feed.notes[0]}"`);

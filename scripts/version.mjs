import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const bump = process.argv[2] ?? 'patch';
const notes = process.argv.slice(3).filter(Boolean);

if (!['patch', 'minor', 'major'].includes(bump)) {
  console.error('Usage: node scripts/version.mjs <patch|minor|major> ["note one", "note two"]');
  process.exit(1);
}

const pkgPath = path.join(root, 'package.json');
const appPath = path.join(root, 'app.json');
const pkg = JSON.parse(await readFile(pkgPath, 'utf8'));
const app = JSON.parse(await readFile(appPath, 'utf8'));

const current = app.expo.version;
const [major, minor, patch] = current.split('.').map((part) => Number.parseInt(part, 10));
let next;
if (bump === 'major') next = `${major + 1}.0.0`;
else if (bump === 'minor') next = `${major}.${minor + 1}.0`;
else next = `${major}.${minor}.${patch + 1}`;

const today = new Date().toISOString().slice(0, 10);
const releaseNotes = notes.length > 0 ? notes : ['Maintenance release with small fixes and polish.'];

app.expo.version = next;
app.expo.android = app.expo.android ?? {};
app.expo.android.versionCode = Number(app.expo.android.versionCode ?? 0) + 1;
app.expo.ios = app.expo.ios ?? {};
const currentBuild = Number.parseInt(String(app.expo.ios.buildNumber ?? '0'), 10) || 0;
app.expo.ios.buildNumber = String(currentBuild + 1);
pkg.version = next;

await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
await writeFile(appPath, `${JSON.stringify(app, null, 2)}\n`);

const notesDir = path.join(root, 'release-notes');
await mkdir(notesDir, { recursive: true });
await writeFile(
  path.join(notesDir, `v${next}.json`),
  `${JSON.stringify({ version: next, releasedAt: today, notes: releaseNotes }, null, 2)}\n`
);

const changelogPath = path.join(root, 'CHANGELOG.md');
const marker = '<!-- releases -->';
let changelog = '';
try {
  changelog = await readFile(changelogPath, 'utf8');
} catch {
  changelog = '# Changelog\n\nAll notable changes to OrbisNova are documented here.\n\n<!-- releases -->\n';
}
const entry = `\n## [${next}] - ${today}\n\n${releaseNotes.map((note) => `- ${note}`).join('\n')}\n`;
if (changelog.includes(marker)) {
  changelog = changelog.replace(marker, `${marker}\n${entry}`);
} else {
  changelog += `\n${entry}`;
}
await writeFile(changelogPath, changelog);

console.log(`\nOrbisNova ${current} → ${next} (Android versionCode ${app.expo.android.versionCode})\n`);
console.log('Next steps:');
console.log(`  git add -A`);
console.log(`  git commit -m "release: v${next}"`);
console.log(`  git tag v${next}`);
console.log(`  git push origin main --tags`);
console.log('\nThe Android workflow will build the APK, publish the release, then update the update feed.');

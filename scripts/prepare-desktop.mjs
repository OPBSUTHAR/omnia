/**
 * Prepares the Electron desktop shell for packaging.
 *
 * 1. copies the expanded Expo web export into desktop/app
 * 2. generates the 512px Linux icon and a 256px Windows .ico
 * 3. keeps desktop/package.json in sync with the app version
 *
 * Usage: node scripts/prepare-desktop.mjs
 */
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const dist = path.join(root, 'dist');
const desktop = path.join(root, 'desktop');
const appDir = path.join(desktop, 'app');
const buildDir = path.join(desktop, 'build');
const sourceIcon = path.join(root, 'assets', 'images', 'icon.png');

try {
  await readFile(path.join(dist, 'index.html'));
} catch {
  console.error('dist/index.html not found. Run "npm run build:web" first.');
  process.exit(1);
}

await rm(appDir, { recursive: true, force: true });
await mkdir(appDir, { recursive: true });
await cp(dist, appDir, { recursive: true });

await mkdir(buildDir, { recursive: true });
await sharp(sourceIcon).resize(512, 512).png().toFile(path.join(buildDir, 'icon.png'));

// A single 256px PNG frame is a valid modern Windows .ico payload.
const icoPng = await sharp(sourceIcon).resize(256, 256).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header.writeUInt8(0, 6);
header.writeUInt8(0, 7);
header.writeUInt8(0, 8);
header.writeUInt8(0, 9);
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(icoPng.length, 14);
header.writeUInt32LE(22, 18);
await writeFile(path.join(buildDir, 'icon.ico'), Buffer.concat([header, icoPng]));

const appJson = JSON.parse(await readFile(path.join(root, 'app.json'), 'utf8'));
const version = appJson.expo.version;
const packagePath = path.join(desktop, 'package.json');
const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
if (packageJson.version !== version) {
  packageJson.version = version;
  await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

const lockPath = path.join(desktop, 'package-lock.json');
try {
  const lock = JSON.parse(await readFile(lockPath, 'utf8'));
  lock.version = version;
  if (lock.packages?.['']) lock.packages[''].version = version;
  await writeFile(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
} catch {
  // The lockfile is optional for local development; CI regenerates it via npm ci.
}

console.log(`Desktop payload ready in desktop/app (OrbisNova ${version}).`);

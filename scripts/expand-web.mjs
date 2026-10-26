import { copyFile, mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

if (!(await exists(dist))) {
  console.error('dist/ not found. Run "npm run build:web" first.');
  process.exit(1);
}

const entries = await readdir(dist);
for (const entry of entries) {
  if (!entry.endsWith('.html')) continue;
  const route = entry.replace(/\.html$/, '');
  if (route === 'index' || route.startsWith('+')) continue;
  if (!/^[a-zA-Z0-9-_/]+$/.test(route)) continue;
  const targetDir = path.join(dist, route);
  await mkdir(targetDir, { recursive: true });
  await copyFile(path.join(dist, entry), path.join(targetDir, 'index.html'));
  console.log(`expanded /${route}`);
}

const notFound = path.join(dist, '+not-found.html');
if (await exists(notFound)) {
  await copyFile(notFound, path.join(dist, '404.html'));
  console.log('wrote 404.html from +not-found.html');
} else {
  await copyFile(path.join(dist, 'index.html'), path.join(dist, '404.html'));
  console.log('wrote 404.html from index.html');
}

await writeFile(path.join(dist, '.nojekyll'), '');
console.log('wrote .nojekyll');

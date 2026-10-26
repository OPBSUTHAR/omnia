import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const images = path.join(root, 'assets', 'images');
const publicIcons = path.join(root, 'public', 'icons');

const gradient = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0B0914" />
      <stop offset="0.55" stop-color="#1A1037" />
      <stop offset="1" stop-color="#2A1240" />
    </linearGradient>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6D4AFF" />
      <stop offset="0.52" stop-color="#B04BFF" />
      <stop offset="1" stop-color="#FF7A59" />
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.62">
      <stop offset="0" stop-color="#6D4AFF" stop-opacity="0.55" />
      <stop offset="1" stop-color="#6D4AFF" stop-opacity="0" />
    </radialGradient>
  </defs>
`;

function iconSvg({
  background = true,
  radius = 280,
  stroke = 92,
  dot = 38,
  glow = true,
} = {}) {
  const dotX = Math.round(512 + (radius + stroke * 0.15) * Math.cos(-Math.PI / 4));
  const dotY = Math.round(512 + (radius + stroke * 0.15) * Math.sin(-Math.PI / 4));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    ${gradient}
    ${background ? '<rect width="1024" height="1024" fill="url(#bg)" />' : ''}
    ${glow ? '<circle cx="512" cy="450" r="390" fill="url(#glow)" />' : ''}
    <circle cx="512" cy="512" r="${radius}" fill="none" stroke="url(#ring)" stroke-width="${stroke}" stroke-linecap="round" />
    <circle cx="${dotX}" cy="${dotY}" r="${dot}" fill="#FFD166" stroke="#0B0914" stroke-width="14" />
  </svg>`;
}

function backgroundSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    ${gradient}
    <rect width="1024" height="1024" fill="url(#bg)" />
    <circle cx="512" cy="450" r="390" fill="url(#glow)" />
  </svg>`;
}

function monoForegroundSvg() {
  const radius = 260;
  const stroke = 80;
  const dotX = 512 + radius * Math.cos(-Math.PI / 4);
  const dotY = 512 + radius * Math.sin(-Math.PI / 4);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <circle cx="512" cy="512" r="${radius}" fill="none" stroke="#FFFFFF" stroke-width="${stroke}" stroke-linecap="round" />
    <circle cx="${dotX}" cy="${dotY}" r="34" fill="#FFFFFF" />
  </svg>`;
}

function splashSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    ${gradient}
    <circle cx="512" cy="512" r="300" fill="none" stroke="url(#ring)" stroke-width="96" stroke-linecap="round" />
    <circle cx="726" cy="298" r="40" fill="#FFD166" stroke="#08080C" stroke-width="14" />
  </svg>`;
}

async function render(svg, size, destination) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(destination);
  console.log(`wrote ${path.relative(root, destination)}`);
}

await mkdir(images, { recursive: true });
await mkdir(publicIcons, { recursive: true });

await render(iconSvg(), 1024, path.join(images, 'icon.png'));
await render(iconSvg({ background: false, glow: false, radius: 260, stroke: 80, dot: 34 }), 1024, path.join(images, 'android-icon-foreground.png'));
await render(backgroundSvg(), 1024, path.join(images, 'android-icon-background.png'));
await render(monoForegroundSvg(), 1024, path.join(images, 'android-icon-monochrome.png'));
await render(splashSvg(), 1024, path.join(images, 'splash-icon.png'));
await render(iconSvg(), 96, path.join(images, 'favicon.png'));

await render(iconSvg(), 192, path.join(publicIcons, 'icon-192.png'));
await render(iconSvg(), 512, path.join(publicIcons, 'icon-512.png'));
await render(iconSvg({ radius: 240, stroke: 78, dot: 30 }), 512, path.join(publicIcons, 'maskable-512.png'));
await render(iconSvg(), 180, path.join(publicIcons, 'apple-touch-icon.png'));

console.log('Icons ready.');

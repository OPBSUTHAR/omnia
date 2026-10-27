/**
 * Generates every OrbisNova app, PWA and splash icon from one globe mark.
 *
 * The globe is the product idea: a world of everyday tools in one place.
 * A small gold nova sits on the orbit at the top-right.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const images = path.join(root, 'assets', 'images');
const publicIcons = path.join(root, 'public', 'icons');

const INK = '#07070C';
const PALE = '#F7F5FF';
const MINT = '#3BE0AE';
const GOLD = '#FFD166';
const VIOLET = '#A78BFA';

function globeMark({
  stroke = PALE,
  accent = GOLD,
  strokeWidth = 34,
  radius = 292,
  nova = true,
  center = 512,
} = {}) {
  const meridian = radius * 0.42;
  const parallel = radius * 0.52;
  return `
    <g clip-path="url(#globeClip)">
      <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" />
      <ellipse cx="${center}" cy="${center}" rx="${meridian}" ry="${radius}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="0.9" />
      <line x1="${center - radius}" y1="${center - parallel}" x2="${center + radius}" y2="${center - parallel}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="0.9" />
      <line x1="${center - radius}" y1="${center + parallel}" x2="${center + radius}" y2="${center + parallel}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="0.9" />
    </g>
    <circle cx="${center}" cy="${center}" r="${radius * 0.12}" fill="${MINT}" />
    ${
      nova
        ? `<circle cx="${center + radius * 0.78}" cy="${center - radius * 0.78}" r="${radius * 0.14}" fill="${accent}" />
           <path d="M ${center + radius * 0.62} ${center - radius * 0.94} A ${radius * 0.42} ${radius * 0.42} 0 0 1 ${center + radius * 0.98} ${center - radius * 0.58}" fill="none" stroke="${accent}" stroke-width="${strokeWidth * 0.55}" stroke-linecap="round" opacity="0.8" />`
        : ''
    }
  `;
}

function defs(radius = 292) {
  return `<defs>
    <clipPath id="globeClip"><circle cx="512" cy="512" r="${radius - 8}" /></clipPath>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0B0914" />
      <stop offset="0.48" stop-color="#122A3A" />
      <stop offset="1" stop-color="#2A1240" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="34%" r="66%">
      <stop offset="0" stop-color="${MINT}" stop-opacity="0.28" />
      <stop offset="0.55" stop-color="${VIOLET}" stop-opacity="0.12" />
      <stop offset="1" stop-color="${VIOLET}" stop-opacity="0" />
    </radialGradient>
  </defs>`;
}

function fullIcon(size = 1024, radius = 292) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
    ${defs(radius)}
    <rect width="1024" height="1024" fill="url(#bg)" />
    <rect width="1024" height="1024" fill="url(#glow)" />
    ${globeMark({ radius })}
  </svg>`;
}

function foreground() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    ${defs(272)}
    ${globeMark({ radius: 272, strokeWidth: 30 })}
  </svg>`;
}

function background() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    ${defs(292)}
    <rect width="1024" height="1024" fill="url(#bg)" />
    <rect width="1024" height="1024" fill="url(#glow)" />
  </svg>`;
}

function monochrome() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    ${defs(272).replace(/#3BE0AE/g, '#FFFFFF').replace(/#FFD166/g, '#FFFFFF').replace(/#A78BFA/g, '#FFFFFF')}
    ${globeMark({ radius: 272, strokeWidth: 30, stroke: '#FFFFFF', accent: '#FFFFFF' })}
  </svg>`;
}

function splash() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    ${defs(300)}
    ${globeMark({ radius: 300, strokeWidth: 30 })}
  </svg>`;
}

function maskable(size = 512) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
    ${defs(240)}
    <rect width="1024" height="1024" fill="url(#bg)" />
    <rect width="1024" height="1024" fill="url(#glow)" />
    ${globeMark({ radius: 240, strokeWidth: 28 })}
  </svg>`;
}

async function render(svg, size, destination) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(destination);
  console.log(path.relative(root, destination));
}

await mkdir(images, { recursive: true });
await mkdir(publicIcons, { recursive: true });

await render(fullIcon(1024), 1024, path.join(images, 'icon.png'));
await render(foreground(), 1024, path.join(images, 'android-icon-foreground.png'));
await render(background(), 1024, path.join(images, 'android-icon-background.png'));
await render(monochrome(), 1024, path.join(images, 'android-icon-monochrome.png'));
await render(splash(), 1024, path.join(images, 'splash-icon.png'));
await render(fullIcon(96), 96, path.join(images, 'favicon.png'));
await render(fullIcon(512), 512, path.join(publicIcons, 'icon-192.png'));
await render(fullIcon(512), 512, path.join(publicIcons, 'icon-512.png'));
await render(maskable(512), 512, path.join(publicIcons, 'maskable-512.png'));
await render(fullIcon(180), 180, path.join(publicIcons, 'apple-touch-icon.png'));

await writeFile(
  path.join(root, 'assets', 'images', 'icon.svg'),
  fullIcon(1024),
  'utf8'
);

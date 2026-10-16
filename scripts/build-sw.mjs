import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(`${directory}/${entry.name}`) : [`${directory}/${entry.name}`],
  );
}
const assets = [
  '/',
  '/manifest.webmanifest',
  '/manifest.webmanifest?theme=paper',
  '/manifest.webmanifest?theme=sepia',
  '/manifest.webmanifest?theme=night',
  '/offline.html',
  '/dictionaries/af.json',
  '/dictionaries/SOURCE.md',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/social.png',
  // A device uses only its matching launch image. Cache those on demand instead
  // of downloading every phone/tablet/theme/orientation during installation.
  ...walk('public/brand')
    .filter((path) => !path.includes('/splash/'))
    .map((path) => path.slice(6)),
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  ...walk('public/art').map((path) => path.slice(6)),
  ...walk('.next/static')
    .filter((path) => /\.(js|css|woff2?)$/.test(path))
    .map((path) => path.replace('.next', '/_next')),
];
const template = readFileSync('scripts/sw-template.js', 'utf8');
const version = createHash('sha256')
  .update(JSON.stringify(assets) + template + readFileSync('.next/BUILD_ID', 'utf8'))
  .digest('hex')
  .slice(0, 12);
writeFileSync(
  'public/sw.js',
  template.replace('__VERSION__', version).replace('__ASSETS__', JSON.stringify(assets)),
);
console.log(`Offline shell: ${assets.length} assets, version ${version}`);

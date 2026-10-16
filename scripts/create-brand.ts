import { mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { LIBRARY } from '../src/lib/data';
import { coverMotif } from '../src/lib/art';
import { hash } from '../src/lib/text';
import { SPLASH_DEVICES } from '../src/lib/splash';
import { THEME_COLORS } from '../src/lib/theme';

const mark = `<path d="M32 51C24 44 14 43 6 45V16c10-2 19 1 26 7 7-6 16-9 26-7v29c-8-2-18-1-26 6Z" fill="#fbfaf7"/><path d="M32 24v22M12 22c6 0 11 2 15 5m10 0c4-3 9-5 15-5" stroke="#2f6b4f" stroke-width="3" stroke-linecap="round"/><path d="m32 3 2.8 6.2L41 12l-6.2 2.8L32 21l-2.8-6.2L23 12l6.2-2.8L32 3Z" fill="#eab972"/>`;
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="23" fill="#2f6b4f"/><g transform="translate(16 16)">${mark}</g></svg>`;
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="#2f6b4f"/><g transform="translate(22 22) scale(.8125)">${mark}</g></svg>`;
writeFileSync('public/icon.svg', icon);
await Promise.all(
  [192, 512].map((size) =>
    sharp(Buffer.from(icon)).resize(size).png().toFile(`public/icon-${size}.png`),
  ),
);
await sharp(Buffer.from(maskable)).resize(512).png().toFile('public/icon-maskable-512.png');
await sharp(Buffer.from(icon)).resize(180).png().toFile('public/apple-touch-icon.png');
mkdirSync('public/brand', { recursive: true });
writeFileSync(
  'public/brand/wordmark.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 70"><rect width="330" height="70" rx="14" fill="#fbfaf7"/><g transform="translate(5 4)"><rect width="64" height="64" rx="16" fill="#2f6b4f"/>${mark}</g><text x="84" y="48" font-family="Georgia,serif" font-size="43" fill="#2f6b4f">leesmaat<tspan fill="#e8643c">.</tspan></text></svg>`,
);
const social = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#fbfaf7"/><circle cx="1100" cy="520" r="340" fill="#e4eddf"/><circle cx="1130" cy="480" r="240" fill="none" stroke="#b7cbb2" stroke-width="2"/><g transform="translate(800 150) scale(4)"><rect width="96" height="96" rx="23" fill="#2f6b4f"/><g transform="translate(16 16)">${mark}</g></g><text x="80" y="125" font-family="Georgia,serif" font-size="48" fill="#2f6b4f">leesmaat.</text><text x="80" y="300" font-family="Georgia,serif" font-size="66" fill="#161614">A little reading.</text><text x="80" y="390" font-family="Georgia,serif" font-size="66" fill="#161614">A bigger world.</text><text x="84" y="500" font-family="sans-serif" font-size="25" fill="#68655d">English · Afrikaans · Five minutes at a time</text></svg>`;
await sharp(Buffer.from(social)).png().toFile('public/social.png');
mkdirSync('public/brand/splash', { recursive: true });
for (const [deviceWidth, deviceHeight, ratio] of SPLASH_DEVICES) {
  for (const orientation of ['portrait', 'landscape']) {
    const [width, height] =
      orientation === 'portrait' ? [deviceWidth, deviceHeight] : [deviceHeight, deviceWidth];
    for (const theme of ['paper', 'sepia', 'night']) {
      const background = THEME_COLORS[theme as keyof typeof THEME_COLORS];
      const ink = theme === 'night' ? '#e9e6df' : '#2f6b4f';
      const splash = `<svg xmlns="http://www.w3.org/2000/svg" width="${width * ratio}" height="${height * ratio}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${background}"/><g transform="translate(${width / 2 - 40} ${height / 2 - 80})"><rect width="80" height="80" rx="20" fill="#2f6b4f"/><g transform="translate(8 8)">${mark}</g></g><text x="${width / 2}" y="${height / 2 + 44}" font-family="Georgia,serif" font-size="30" text-anchor="middle" fill="${ink}">leesmaat.</text></svg>`;
      await sharp(Buffer.from(splash))
        .png()
        .toFile(
          `public/brand/splash/${deviceWidth}-${deviceHeight}-${ratio}x-${orientation}-${theme}.png`,
        );
    }
  }
}

const palettes = [
  ['#213e3b', '#496c60', '#b9cba1', '#eabb77'],
  ['#3f344e', '#755768', '#be8893', '#f1d2a5'],
  ['#183449', '#376c80', '#84b6bd', '#e7cc90'],
  ['#713c35', '#b66b4c', '#d8a37b', '#f3d6a0'],
  ['#2b3d32', '#65734f', '#a6b380', '#efce87'],
  ['#2c3357', '#555b84', '#a2a2c1', '#e9d3ad'],
];
mkdirSync('public/art/covers', { recursive: true });
for (const item of LIBRARY) {
  const seed = hash(item.t + item.a);
  const [dark, mid, light, gold] = palettes[seed % palettes.length]!;
  const cx = 120 + (seed % 120);
  const sun = `<circle cx="${cx}" cy="215" r="${32 + (seed % 28)}" fill="${gold}"/>`;
  const motifs: Record<string, string> = {
    mountain: `${sun}<path d="M-20 430 140 220 235 355 350 250 440 430Z" fill="${light}"/><path d="m0 445 140-195 70 155 100-75 90 135Z" fill="${mid}"/><path d="M0 450Q140 375 400 475v125H0Z" fill="${dark}"/>`,
    sea: `${sun}<path d="M0 345q100-50 200 0t200 0v255H0" fill="${mid}"/><path d="M0 395q100-60 200 0t200 0M0 440q100-50 200 0t200 0M0 480q100-40 200 0t200 0" fill="none" stroke="${light}" stroke-width="8" opacity=".7"/><path d="m130 340 145 0-32 35h-85Z" fill="${dark}"/><path d="M202 240v96h-60Z" fill="${gold}"/>`,
    forest: `${sun}<path d="M0 455q150-100 400 0v145H0Z" fill="${mid}"/>${[50, 150, 275, 360].map((x, i) => `<path d="M${x} 480V${240 + (i % 2) * 70}" stroke="${dark}" stroke-width="15"/><ellipse cx="${x}" cy="${270 + (i % 2) * 70}" rx="${50 + i * 5}" ry="95" fill="${i % 2 ? light : mid}"/>`).join('')}<path d="M180 600q-55-95 20-155" fill="none" stroke="${gold}" stroke-width="28" opacity=".7"/>`,
    moon: `<circle cx="${cx}" cy="245" r="70" fill="${gold}"/><circle cx="${cx + 30}" cy="220" r="65" fill="${dark}"/>${Array.from({ length: 14 }, (_, i) => `<circle cx="${20 + ((seed + i * 89) % 360)}" cy="${175 + ((i * 19) % 240)}" r="${(i % 3) + 1}" fill="${gold}"/>`).join('')}<path d="M0 460q120-125 220 0t180 0v140H0Z" fill="${mid}"/><path d="M0 520q200-100 400 10v70H0Z" fill="${dark}"/>`,
    city: `${sun}${[10, 85, 170, 260, 345].map((x, i) => `<path d="M${x} 500V${285 + ((seed + i * 51) % 140)}h65v215Z" fill="${i % 2 ? mid : dark}"/><path d="M${x + 18} 390h9v14h-9Zm22 0h9v14h-9Zm-22 30h9v14h-9Z" fill="${gold}"/>`).join('')}<path d="M0 510h400v90H0Z" fill="${mid}"/><path d="M160 600v-55q30-45 80 0v55" fill="${gold}" opacity=".6"/>`,
    window: `<rect x="85" y="185" width="230" height="270" rx="115" fill="${mid}"/><path d="M105 430V305a95 95 0 0 1 190 0v125Z" fill="${light}"/>${sun}<path d="M110 405q85-70 180 0v25H110Z" fill="${mid}"/><path d="M200 185v275M85 330h230" stroke="${dark}" stroke-width="14"/><path d="M70 460h260" stroke="${gold}" stroke-width="8"/><path d="m155 505 45 15 45-15v50l-45 15-45-15Z" fill="${gold}"/>`,
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="${dark}"/><stop offset="1" stop-color="${mid}"/></linearGradient><pattern id="grain" width="17" height="19" patternUnits="userSpaceOnUse"><circle cx="3" cy="5" r=".65" fill="#fff" opacity=".18"/></pattern></defs><rect width="400" height="600" fill="url(#sky)"/>${motifs[coverMotif(item.t, item.k)]}<rect width="400" height="600" fill="url(#grain)"/><rect x="15" y="15" width="370" height="570" rx="5" fill="none" stroke="${gold}" opacity=".35"/><path d="M30 0v600" stroke="#000" opacity=".12" stroke-width="12"/></svg>`;
  writeFileSync(`public${item.art}`, svg);
}
console.log(`Created Leesmaat brand and ${LIBRARY.length} individual illustrated covers.`);

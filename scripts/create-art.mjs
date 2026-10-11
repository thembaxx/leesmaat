import { writeFileSync, mkdirSync } from 'node:fs';
mkdirSync('public/art', { recursive: true });
const palettes = [
  ['#e8c79e', '#355c4b', '#203c32', '#e9a663'],
  ['#d6dde2', '#677e8d', '#334955', '#d5a368'],
  ['#e7c1a4', '#af6c52', '#633b36', '#eee3cd'],
  ['#c0d4c1', '#5e7b52', '#243f36', '#eee2ad'],
  ['#d7c5de', '#6d627e', '#39334f', '#e6c597'],
  ['#b8cfd2', '#597d80', '#29494e', '#f4d6a4'],
];
for (const [i, [sky, hill, front, sun]] of palettes.entries()) {
  const trees = Array.from(
    { length: 8 },
    (_, n) =>
      `<path d="M${n * 46 - 15} 430v-130m-16 50 16-40 20 30" stroke="${front}" stroke-width="5" fill="none"/>`,
  ).join('');
  const scene =
    i === 0
      ? `<path d="M65 315v-125h135v125" fill="${front}"/><rect x="90" y="213" width="84" height="75" rx="40" fill="${sun}"/><path d="M132 213v75M90 250h84" stroke="${front}" stroke-width="8"/>`
      : i === 4
        ? `<path d="M50 335V160h55v175m10 0V130h55v205m10 0V185h70v150" fill="${hill}"/><path d="M65 200h22m42-30h26m-26 35h26m39 20h35" stroke="${sun}" stroke-width="7"/>`
        : `<circle cx="${205 - i * 12}" cy="150" r="40" fill="${sun}"/><path d="M0 320 85 210 165 280 245 200 320 290v190H0" fill="${hill}"/>${i === 3 ? trees : ''}`;
  writeFileSync(
    `public/art/cover-${i}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 480"><rect width="320" height="480" fill="${sky}"/><path d="M35 75h95m80 20h70" stroke="${sun}" stroke-width="4" opacity=".5"/>${scene}<path d="M0 375Q90 315 170 367T320 355V480H0" fill="${front}"/><path d="M0 415q80-30 160 0t160 0" fill="none" stroke="${sky}" stroke-width="2" opacity=".35"/></svg>`,
  );
}
writeFileSync(
  'public/icon.svg',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" rx="48" fill="#2f6b4f"/><path d="M45 54q26-10 51 8 25-18 51-8v81q-26-10-51 8-25-18-51-8Z" fill="#fbfaf7"/><path d="M96 62v81" stroke="#2f6b4f" stroke-width="5"/></svg>',
);

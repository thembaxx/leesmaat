export const SPLASH_DEVICES = [
  [320, 568, 2],
  [375, 667, 2],
  [375, 812, 3],
  [414, 896, 3],
  [390, 844, 3],
  [393, 852, 3],
  [414, 896, 2],
  [428, 926, 3],
  [430, 932, 3],
  [402, 874, 3],
  [440, 956, 3],
  [768, 1024, 2],
  [820, 1180, 2],
  [834, 1194, 2],
  [834, 1210, 2],
  [1024, 1380, 2],
  [1024, 1366, 2],
] as const;

export function splashLinks([width, height, ratio]: readonly [number, number, number]) {
  return ['portrait', 'landscape'].flatMap((orientation) =>
    ['paper', 'night'].map((theme) => ({
      href: `/brand/splash/${width}-${height}-${ratio}x-${orientation}-${theme}.png`,
      media: `(device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: ${orientation}) and (prefers-color-scheme: ${theme === 'night' ? 'dark' : 'light'})`,
    })),
  );
}

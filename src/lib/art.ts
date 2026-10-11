import { hash } from './text';
export function artPath(id: string) {
  return '/art/covers/' + id + '.svg';
}
export function coverMotif(title: string, kind: string) {
  if (/kitchen|venster|minutes|poem slowly|library|light/i.test(title)) return 'window';
  if (/pocket of sky/i.test(title)) return 'city';
  if (/sea|pi\b|ship|meeu|paljas|island|water/i.test(title)) return 'sea';
  if (/bos|forest|tree|peach|tuin|garden|nature/i.test(title)) return 'forest';
  if (/night|aand|star|moon|ster|dark|macbeth|othello|mis\b/i.test(title)) return 'moon';
  if (/city|stad|train|trein|bus|street|onderw/i.test(title)) return 'city';
  if (/mountain|karoo|land|country|vlakte|heuwel/i.test(title)) return 'mountain';
  return ['window', 'mountain', 'sea', 'forest', 'moon', 'city'][hash(title + kind) % 6]!;
}

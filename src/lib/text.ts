export const norm = (w: string) =>
  w
    .toLowerCase()
    .replace(/[^a-zà-ÿ']/g, '')
    .replace(/'s$/, '');

export const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
export const today = () => new Date().toLocaleDateString('en-CA');
export const yesterday = () =>
  (() => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toLocaleDateString('en-CA');
  })();

/** A paragraph is a list of sentences; a sentence is a list of words. */
export type Para = string[][];

export function parse(text: string, poem: boolean): Para[] {
  return text
    .split('\n\n')
    .map((p) =>
      (poem ? p.split('\n') : (p.match(/[^.!?]+[.!?]+["'”’]*|[^.!?]+$/g) ?? [p])).map((s) =>
        s.trim().split(/\s+/),
      ),
    );
}

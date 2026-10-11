export const THEME_COLORS = { paper: '#fbfaf7', sepia: '#f4ecd8', night: '#000000' };

// Runs in the head before hydration and before a frame can paint the wrong theme.
export const themeBoot = String.raw`(()=>{var r=document.documentElement,s={};try{s=JSON.parse(localStorage.getItem('lm')||'{}')||{}}catch{}var t=['paper','sepia','night'].includes(s.theme)?s.theme:'';if(t)r.dataset.theme=t;if(s.mono)r.setAttribute('data-mono','');if(s.fs>=15&&s.fs<=30)r.style.setProperty('--fs',s.fs+'px');var dark=t==='night'||!t&&matchMedia('(prefers-color-scheme:dark)').matches,c=t==='sepia'?'#f4ecd8':dark?'#000000':'#fbfaf7';r.style.backgroundColor=c;try{document.cookie='leesmaat-theme='+(t||(dark?'night':'paper'))+'; Path=/; Max-Age=31536000; SameSite=Lax'}catch{}document.querySelectorAll('link[rel=apple-touch-startup-image]').forEach(l=>l.href=l.href.replace(/-(paper|sepia|night)\.png$/,'-'+(t||(dark?'night':'paper'))+'.png'));r.style.colorScheme=dark?'dark':'light';document.querySelectorAll('meta[name="theme-color"]').forEach(m=>{m.removeAttribute('media');m.content=c})})()`;

export function syncBrowserTheme(theme: string) {
  const dark = theme === 'night' || (!theme && matchMedia('(prefers-color-scheme: dark)').matches);
  const color =
    theme === 'sepia' ? THEME_COLORS.sepia : dark ? THEME_COLORS.night : THEME_COLORS.paper;
  const name = theme || (dark ? 'night' : 'paper');
  document
    .querySelectorAll<HTMLLinkElement>('link[rel="apple-touch-startup-image"]')
    .forEach((link) => {
      link.href = link.href.replace(/-(paper|sepia|night)\.png$/, '-' + name + '.png');
    });
  try {
    const previous = document.cookie.match(/(?:^|; )leesmaat-theme=([^;]+)/)?.[1];
    document.cookie = 'leesmaat-theme=' + name + '; Path=/; Max-Age=31536000; SameSite=Lax';
    if (previous !== name && navigator.serviceWorker?.controller)
      void fetch('/manifest.webmanifest', { cache: 'no-store' }).catch(() => {});
  } catch {
    /* Theme colors still work when preference cookies are blocked. */
  }
  document.documentElement.style.backgroundColor = color;
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    meta.removeAttribute('media');
    meta.content = color;
  });
}

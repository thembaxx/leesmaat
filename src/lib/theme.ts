export const THEME_COLORS = { paper: '#fbfaf7', sepia: '#f4ecd8', night: '#000000' };

// Inline fallback paints the canvas even while the main stylesheet is loading.
export const themePaint = `html{background:${THEME_COLORS.paper};color-scheme:light}body{margin:0;background:inherit}@media(prefers-color-scheme:dark){html:not([data-theme]){background:${THEME_COLORS.night};color-scheme:dark}}`;

// Runs in the head before hydration and before a frame can paint the wrong theme.
export const themeBoot = String.raw`(()=>{
  var r=document.documentElement,s={};
  try{s=JSON.parse(localStorage.getItem('lm')||'{}')||{}}catch{}
  var t=['paper','sepia','night'].includes(s.theme)?s.theme:'';
  if(t)r.dataset.theme=t;else delete r.dataset.theme;
  if(s.mono)r.setAttribute('data-mono','');
  if(s.fs>=15&&s.fs<=30)r.style.setProperty('--fs',s.fs+'px');
  var dark=t==='night'||!t&&matchMedia('(prefers-color-scheme:dark)').matches;
  var name=t||(dark?'night':'paper'),colors=${JSON.stringify(THEME_COLORS)},c=colors[name];
  r.style.backgroundColor=c;
  r.style.colorScheme=dark?'dark':'light';
  try{document.cookie='leesmaat-theme='+name+'; Path=/; Max-Age=31536000; SameSite=Lax'}catch{}
  document.querySelectorAll('link[rel=apple-touch-startup-image]').forEach(l=>l.setAttribute('href',l.getAttribute('href').replace(/-(paper|sepia|night)\.png$/,'-'+name+'.png')));
  document.querySelectorAll('link[rel=manifest]').forEach(l=>l.setAttribute('href','/manifest.webmanifest?theme='+name));
  document.querySelectorAll('meta[name="theme-color"]').forEach(m=>{m.removeAttribute('media');m.content=c});
  document.querySelectorAll('meta[name="color-scheme"]').forEach(m=>m.content=dark?'dark':'light');
})()`;

export function syncBrowserTheme(theme: string) {
  const dark = theme === 'night' || (!theme && matchMedia('(prefers-color-scheme: dark)').matches);
  const color =
    theme === 'sepia' ? THEME_COLORS.sepia : dark ? THEME_COLORS.night : THEME_COLORS.paper;
  const name = theme || (dark ? 'night' : 'paper');
  try {
    document.cookie = 'leesmaat-theme=' + name + '; Path=/; Max-Age=31536000; SameSite=Lax';
  } catch {
    /* Theme colors still work when preference cookies are blocked. */
  }
  document.documentElement.style.backgroundColor = color;
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

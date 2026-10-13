// src/lib/theme.ts
//
// Light, dark, or auto (follow the device).
//
// ── Where the choice lives ───────────────────────────────────────────────
//
// In localStorage, not a cookie. The public pages are statically rendered —
// see the note in src/app/(main)/layout.tsx — and a layout that read a theme
// cookie would make every one of them render on demand again. Instead,
// THEME_SCRIPT runs inline in <head>, before the first paint, and sets `.dark`
// on <html> itself. The server never knows the theme, and the page never
// flashes white on its way to dark.
//
// The same script stays subscribed for the life of the page: with "Auto"
// chosen, the page follows the device when it changes (a phone switching to
// dark at sunset), and a choice made in one tab reaches every other open tab.
// So nothing in React has to be mounted for the theme to be right — the
// switch only reads and writes it.

export type ThemePreference = 'light' | 'dark' | 'system'

export const THEME_STORAGE_KEY = 'plug-theme'

/** Fired on window whenever the theme is applied, so open switches re-read it. */
const CHANGE_EVENT = 'plug-themechange'

/**
 * Runs before paint. Kept in plain ES5 and wrapped in try/catch: it is the one
 * script on the page that runs ahead of everything else, and storage can throw
 * (private windows, blocked site data). Without storage it simply follows the
 * device.
 */
export const THEME_SCRIPT = `(function () {
  var root = document.documentElement;
  var media = window.matchMedia('(prefers-color-scheme: dark)');
  function read() {
    try {
      var value = localStorage.getItem('${THEME_STORAGE_KEY}');
      return value === 'light' || value === 'dark' ? value : 'system';
    } catch (e) {
      return 'system';
    }
  }
  function apply() {
    var preference = read();
    var dark = preference === 'dark' || (preference === 'system' && media.matches);
    root.classList.toggle('dark', dark);
    root.setAttribute('data-theme', preference);
    window.dispatchEvent(new Event('${CHANGE_EVENT}'));
  }
  apply();
  media.addEventListener('change', apply);
  window.addEventListener('storage', function (event) {
    if (event.key === '${THEME_STORAGE_KEY}') apply();
  });
})();`

/** The stored choice, as THEME_SCRIPT last applied it. */
export function getThemePreference(): ThemePreference {
  const value = document.documentElement.getAttribute('data-theme')
  return value === 'light' || value === 'dark' ? value : 'system'
}

/** Whether the page is dark right now, whichever way it got there. */
export function isDarkTheme(): boolean {
  return document.documentElement.classList.contains('dark')
}

/**
 * Saves a choice and applies it at once.
 *
 * Every transition on the page is held for the one frame the colours change
 * in. Most cards and buttons carry `transition-all` or `transition-colors`, so
 * without this the switch would ripple across the page at a dozen different
 * speeds instead of landing as one change.
 */
export function setThemePreference(preference: ThemePreference) {
  try {
    if (preference === 'system') localStorage.removeItem(THEME_STORAGE_KEY)
    else localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // Storage unavailable: the choice still applies to this page view.
  }

  const root = document.documentElement
  const dark = preference === 'dark' || (preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  const hold = document.createElement('style')
  hold.textContent = '*,*::before,*::after{transition:none!important}'
  document.head.appendChild(hold)

  root.classList.toggle('dark', dark)
  root.setAttribute('data-theme', preference)
  window.dispatchEvent(new Event(CHANGE_EVENT))

  // Reading a computed style forces the new colours to be laid down before the
  // hold is lifted; the frame after that, transitions work again.
  void window.getComputedStyle(document.body).backgroundColor
  requestAnimationFrame(() => hold.remove())
}

/** Subscribes to theme changes, from this tab, another tab, or the device. */
export function subscribeToTheme(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange)
  return () => window.removeEventListener(CHANGE_EVENT, onChange)
}

import { useEffect, useState } from 'react'

// Light/dark theme for the field and office apps. The user's choice is kept
// per device in localStorage; "system" follows the OS setting. The resolved
// theme is written to <html data-theme>, which index.css keys its dark tokens
// off. index.html runs the same logic inline before first paint.
export type ThemePref = 'system' | 'light' | 'dark'

const KEY = 'theme'
const media = window.matchMedia('(prefers-color-scheme: dark)')
const listeners = new Set<(p: ThemePref) => void>()

// The client portal and printable documents keep their own fixed palettes.
const isThemed = () => !window.location.pathname.startsWith('/portal')

export function getThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'light' || v === 'dark') return v
  } catch { /* private mode */ }
  return 'system'
}

function apply(pref: ThemePref) {
  const dark = isThemed() && (pref === 'dark' || (pref === 'system' && media.matches))
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0F1A1D' : '#16343B')
}

export function setThemePref(pref: ThemePref) {
  try {
    if (pref === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, pref)
  } catch { /* private mode */ }
  apply(pref)
  listeners.forEach((l) => l(pref))
}

media.addEventListener('change', () => apply(getThemePref()))
apply(getThemePref())

export function useThemePref(): [ThemePref, (p: ThemePref) => void] {
  const [pref, setPref] = useState(getThemePref)
  useEffect(() => {
    listeners.add(setPref)
    return () => { listeners.delete(setPref) }
  }, [])
  return [pref, setThemePref]
}

const ORDER: ThemePref[] = ['system', 'light', 'dark']
export const nextThemePref = (p: ThemePref) => ORDER[(ORDER.indexOf(p) + 1) % ORDER.length]
export const THEME_LABEL: Record<ThemePref, string> = { system: 'System', light: 'Light', dark: 'Dark' }

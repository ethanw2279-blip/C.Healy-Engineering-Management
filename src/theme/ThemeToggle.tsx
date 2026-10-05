import { nextThemePref, THEME_LABEL, useThemePref } from './theme'

function MoonIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
    </svg>
  )
}

// Tapping cycles System → Light → Dark. `menu` matches the field app's More
// list; `sidebar` matches the office sidebar links.
export default function ThemeToggle({ variant }: { variant: 'menu' | 'sidebar' }) {
  const [pref, setPref] = useThemePref()
  const cycle = () => setPref(nextThemePref(pref))

  if (variant === 'sidebar') {
    return (
      <button className="side-link side-link-alt theme-toggle" onClick={cycle} title="Appearance">
        <MoonIcon size={20} />
        <span>Appearance: {THEME_LABEL[pref]}</span>
      </button>
    )
  }

  return (
    <li className="menu-item" onClick={cycle}>
      <MoonIcon size={24} />
      <span>Appearance</span>
      <span className="push-state">{THEME_LABEL[pref]}</span>
    </li>
  )
}

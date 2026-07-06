// Design tokens derived from the Jobber mobile app screenshots.
export const colors = {
  // Deep teal-navy used for headings, icons, and the FAB.
  navy: '#16343B',
  navyMuted: '#5B6E72',
  // Jobber brand green for primary actions and links.
  green: '#1F8A4C',
  greenDark: '#176B3B',
  // Warm neutral tiles (Apps & integrations / Marketing cards).
  tile: '#E9E7E0',
  tileBorder: '#E0DDD4',
  // Surfaces.
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  border: '#ECECEC',
  divider: '#EFEFEF',
  // Text.
  text: '#16343B',
  textMuted: '#6B7B7E',
  textFaint: '#9AA6A8',
  // Accents.
  amber: '#C7791C',
  red: '#D64545',
  leadBlue: '#2F86EB',
} as const

export const radius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  pill: '999px',
} as const

export const space = (n: number) => `${n * 4}px`

// Inline stroke icons for the portal (matches the design's 1.5px line set).
// Kept dependency-free so the portal ships no icon library.

type P = { size?: number }
const svg = (size: number, children: React.ReactNode) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
)

export const IconHome = ({ size = 17 }: P) => svg(size, <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></>)
export const IconQuote = ({ size = 17 }: P) => svg(size, <><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" /><path d="M14 2v5h5" /><path d="M16 13H8" /><path d="M16 17H8" /></>)
export const IconJobs = ({ size = 17 }: P) => svg(size, <><rect x="3" y="4" width="18" height="18" rx="1" /><path d="M8 2v4M16 2v4M3 10h18" /></>)
export const IconInvoice = ({ size = 17 }: P) => svg(size, <><path d="M4 2v20l2-1.5L8 22l2-1.5L12 22l2-1.5L16 22l2-1.5L20 22V2l-2 1.5L16 2l-2 1.5L12 2l-2 1.5L8 2 6 3.5z" /><path d="M8 8h8M8 12h6" /></>)
export const IconShield = ({ size = 17 }: P) => svg(size, <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></>)
export const IconDocs = ({ size = 17 }: P) => svg(size, <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />)
export const IconBox = ({ size = 17 }: P) => svg(size, <><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5M12 22V12" /></>)
export const IconSettings = ({ size = 17 }: P) => svg(size, <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>)
export const IconSearch = ({ size = 15 }: P) => svg(size, <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>)
export const IconBell = ({ size = 17 }: P) => svg(size, <><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /></>)
export const IconSun = ({ size = 17 }: P) => svg(size, <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4" /></>)
export const IconMoon = ({ size = 17 }: P) => svg(size, <path d="M12 3a6.4 6.4 0 0 0 9 9 9 9 0 1 1-9-9z" />)
export const IconPlus = ({ size = 15 }: P) => svg(size, <path d="M12 5v14M5 12h14" />)
export const IconChevron = ({ size = 16 }: P) => svg(size, <path d="m9 18 6-6-6-6" />)
export const IconCheck = ({ size = 24 }: P) => svg(size, <path d="M20 6 9 17l-5-5" />)
export const IconDownload = ({ size = 15 }: P) => svg(size, <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5M12 15V3" /></>)

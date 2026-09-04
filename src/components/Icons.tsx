import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Base({ size = 24, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  )
}

export const HomeIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 10.5 12 4l8 6.5" />
    <path d="M6 9.5V20h12V9.5" />
  </Base>
)

export const CalendarIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="4" y="5" width="16" height="15" rx="2.5" />
    <path d="M4 9.5h16M8 3.5v3M16 3.5v3" />
  </Base>
)

export const ClockIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4.5l3 2" />
  </Base>
)

export const TruckIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 6.5h10.5v8.5H3z" />
    <path d="M13.5 9.5H17l3 3v2.5h-6.5z" />
    <circle cx="7" cy="17.5" r="1.8" />
    <circle cx="16.5" cy="17.5" r="1.8" />
  </Base>
)

export const DownloadIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 4v10" />
    <path d="M8 10.5 12 14.5 16 10.5" />
    <path d="M5 19h14" />
  </Base>
)

export const SearchIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </Base>
)

export const MoreDotsIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </Base>
)

export const BellIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </Base>
)

export const SparkleIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6Z" />
    <path d="M18 4.5l.6 1.6 1.6.6-1.6.6L18 9l-.6-1.7L15.8 6.7l1.6-.6Z" />
  </Base>
)

export const AppsIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="4" y="4" width="6" height="6" rx="1.5" />
    <rect x="4" y="14" width="6" height="6" rx="1.5" />
    <rect x="14" y="14" width="6" height="6" rx="1.5" />
    <path d="M17 4v6M14 7h6" />
  </Base>
)

export const MegaphoneIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 10v4l9 4V6l-9 4Z" />
    <path d="M13 7.5c3 0 5 2 5 4.5s-2 4.5-5 4.5" />
    <path d="M6 14v3.5" />
  </Base>
)

export const ChatIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h7A2.5 2.5 0 0 1 16 6.5V10a2.5 2.5 0 0 1-2.5 2.5H9L5.5 15v-2.5A2.5 2.5 0 0 1 4 10Z" />
    <path d="M16 9h1.5A2.5 2.5 0 0 1 20 11.5V15a2.5 2.5 0 0 1-2.5 2.5h0V20l-3-2.5H11" />
  </Base>
)

export const CardIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="6" width="18" height="12" rx="2.5" />
    <path d="M3 10h18M6.5 14.5h4" />
  </Base>
)

export const GiftIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="4" y="9" width="16" height="4" rx="1" />
    <path d="M5 13v7h14v-7M12 9v11" />
    <path d="M12 9S10.5 4 8 5.5 12 9 12 9ZM12 9s1.5-5 4-3.5S12 9 12 9Z" />
  </Base>
)

export const HelpIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9.5 9.5a2.5 2.5 0 0 1 4.6 1.3c0 1.7-2.1 2-2.1 3.2" />
    <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
  </Base>
)

export const UserIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="10" r="2.8" />
    <path d="M6.5 18a5.5 5.5 0 0 1 11 0" />
  </Base>
)

export const TeamIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="9" cy="9" r="2.8" />
    <path d="M4 18a5 5 0 0 1 10 0" />
    <circle cx="16.5" cy="9.5" r="2.2" />
    <path d="M15 14.5a4.5 4.5 0 0 1 5 3.5" />
  </Base>
)

export const BuildingIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="5" y="4" width="9" height="16" rx="1" />
    <path d="M14 9h5v11h-5" />
    <path d="M8 8h3M8 11.5h3M8 15h3M16.5 12h.01M16.5 15.5h.01" />
  </Base>
)

export const SlidersIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 7h9M18 7h1M5 12h1M10 12h9M5 17h6M15 17h4" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="8" cy="12" r="2" />
    <circle cx="13" cy="17" r="2" />
  </Base>
)

export const LogoutIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M14 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8" />
    <path d="M11 12h9m0 0-3-3m3 3-3 3" />
  </Base>
)

export const PlusIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
)

export const ChevronRightIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m9 6 6 6-6 6" />
  </Base>
)

export const ArrowRightIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 12h14m0 0-6-6m6 6-6 6" />
  </Base>
)

export const QuoteIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 9a5 5 0 0 1 5-5c4 0 6 3 9 3l2-1v6l-2-1c-3 0-5 3-9 3a5 5 0 0 1-5-5Z" />
    <circle cx="9" cy="9" r="1.5" />
  </Base>
)

export const RequestsIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 4h14v9l-7 4-7-4Z" />
    <path d="M12 7v6m0 0-2.5-2.5M12 13l2.5-2.5" />
  </Base>
)

export const ListIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="4" y="4" width="16" height="16" rx="2.5" />
    <path d="M8 9h8M8 13h8M8 17h5" />
  </Base>
)

export const PlayIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M10 8.5v7l6-3.5-6-3.5Z" fill="currentColor" stroke="none" />
  </Base>
)

export const GridIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </Base>
)

export const BriefcaseIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="7.5" width="18" height="12" rx="2.5" />
    <path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5M3 12.5h18" />
  </Base>
)

export const ReceiptIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 3h12v18l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5Z" />
    <path d="M9 8h6M9 12h6" />
  </Base>
)

export const ChartIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 20V4M4 20h16" />
    <path d="M8 20v-6M12 20V9M16 20v-9M20 20v-4" />
  </Base>
)

export const CheckIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m5 12 5 5 9-10" />
  </Base>
)

export const CloseIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Base>
)

export const ChevronDownIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m6 9 6 6 6-6" />
  </Base>
)

export const ClipboardIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="5" y="5" width="14" height="16" rx="2" />
    <path d="M9 5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
    <path d="m9 13 2 2 4-4" />
  </Base>
)

export const TrashIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13" />
  </Base>
)

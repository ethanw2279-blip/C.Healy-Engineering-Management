import type { ComponentType } from 'react'
import {
  GridIcon,
  CalendarIcon,
  UserIcon,
  RequestsIcon,
  QuoteIcon,
  BriefcaseIcon,
  ReceiptIcon,
  ClockIcon,
  TeamIcon,
  ChartIcon,
  SlidersIcon,
} from '../components/Icons'
import type { PermissionKey } from '../data/permissions'

export type NavItem = {
  to: string
  label: string
  Icon: ComponentType<{ size?: number }>
  perm: PermissionKey
  end?: boolean
}

export const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', Icon: GridIcon, perm: 'view:dashboard', end: true },
  { to: '/schedule', label: 'Schedule', Icon: CalendarIcon, perm: 'view:schedule' },
  { to: '/clients', label: 'Clients', Icon: UserIcon, perm: 'view:clients' },
  { to: '/requests', label: 'Requests', Icon: RequestsIcon, perm: 'view:requests' },
  { to: '/quotes', label: 'Quotes', Icon: QuoteIcon, perm: 'view:quotes' },
  { to: '/jobs', label: 'Jobs', Icon: BriefcaseIcon, perm: 'view:jobs' },
  { to: '/invoices', label: 'Invoices', Icon: ReceiptIcon, perm: 'view:invoices' },
  { to: '/timesheets', label: 'Timesheets', Icon: ClockIcon, perm: 'view:timesheets' },
  { to: '/team', label: 'Team', Icon: TeamIcon, perm: 'view:team' },
  { to: '/roles', label: 'Roles & permissions', Icon: SlidersIcon, perm: 'manage:roles' },
  { to: '/reports', label: 'Reports', Icon: ChartIcon, perm: 'view:reports' },
]

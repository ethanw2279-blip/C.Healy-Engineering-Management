import type { Role } from './types'

// A permission is a string key. Roles hold a list of keys, or ['*'] for full
// access. Grouped here so the Roles editor can render labelled checkboxes.
export type PermissionKey = string

export const PERMISSION_GROUPS: {
  group: string
  perms: { key: PermissionKey; label: string }[]
}[] = [
  {
    group: 'Pages',
    perms: [
      { key: 'view:dashboard', label: 'Dashboard' },
      { key: 'view:schedule', label: 'Schedule' },
      { key: 'view:clients', label: 'Clients' },
      { key: 'view:requests', label: 'Requests' },
      { key: 'view:quotes', label: 'Quotes' },
      { key: 'view:jobs', label: 'Jobs' },
      { key: 'view:invoices', label: 'Invoices' },
      { key: 'view:timesheets', label: 'Timesheets' },
      { key: 'view:team', label: 'Team' },
      { key: 'view:reports', label: 'Reports' },
    ],
  },
  {
    group: 'Actions',
    perms: [
      { key: 'create:records', label: 'Create quotes, jobs, invoices & clients' },
      { key: 'approve:timesheets', label: 'Approve timesheets' },
    ],
  },
  {
    group: 'Administration',
    perms: [
      { key: 'manage:team', label: 'Add & manage team members' },
      { key: 'manage:roles', label: 'Create & edit roles' },
    ],
  },
]

export const ALL_PERMISSION_KEYS: PermissionKey[] = PERMISSION_GROUPS.flatMap((g) =>
  g.perms.map((p) => p.key),
)

// Everything except role management — a strong operational admin.
const ADMIN_PERMS = ALL_PERMISSION_KEYS.filter((k) => k !== 'manage:roles')

// A field employee: sees their work, logs and reviews their hours.
const EMPLOYEE_PERMS = ['view:schedule', 'view:jobs', 'view:clients', 'view:timesheets']

// Seed roles. Developer is a system role: full access, cannot be deleted or
// have its permissions edited (it always holds '*').
export const defaultRoles: Role[] = [
  {
    id: 'role_dev',
    name: 'Developer',
    description: 'Complete access and control, including creating and editing roles.',
    permissions: ['*'],
    system: true,
  },
  {
    id: 'role_admin',
    name: 'Admin',
    description: 'Runs the business day-to-day: all pages, create records, manage the team.',
    permissions: ADMIN_PERMS,
  },
  {
    id: 'role_employee',
    name: 'Employee',
    description: 'Field crew: sees their schedule, jobs, clients and timesheets.',
    permissions: EMPLOYEE_PERMS,
  },
]

export function roleCan(role: Role | undefined, key: PermissionKey): boolean {
  if (!role) return false
  return role.permissions.includes('*') || role.permissions.includes(key)
}

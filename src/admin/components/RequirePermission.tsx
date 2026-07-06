import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useCurrentUser } from '../../data/store'
import { NAV } from '../nav'
import type { PermissionKey } from '../../data/permissions'

// First page the current user is allowed to see — used as a fallback landing.
export function useFirstAllowedPath() {
  const { can } = useCurrentUser()
  return NAV.find((n) => can(n.perm))?.to ?? '/no-access'
}

export function RequirePermission({
  perm,
  children,
}: {
  perm: PermissionKey
  children: ReactNode
}) {
  const { can } = useCurrentUser()
  const fallback = useFirstAllowedPath()

  if (can(perm)) return <>{children}</>
  // If they have some access, bounce to their first page; otherwise show denial.
  if (fallback !== '/no-access') return <Navigate to={fallback} replace />
  return <NoAccess />
}

export function NoAccess() {
  const { role } = useCurrentUser()
  return (
    <div className="no-access">
      <div className="no-access-card">
        <h2>No access</h2>
        <p>
          Your role{role ? ` (${role.name})` : ''} doesn&apos;t have permission to view this page.
          Ask a Developer or Admin to update your role.
        </p>
      </div>
    </div>
  )
}

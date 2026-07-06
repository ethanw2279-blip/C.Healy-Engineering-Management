import { useOutletContext } from 'react-router-dom'
import type { CreateKind } from './CreateModals'

// Lets any page open the same create modals the topbar uses.
export function useCreate() {
  return useOutletContext<{ create: (k: CreateKind) => void }>().create
}

import { useEffect, useRef } from 'react'

// Returns a ref to attach to a dropdown wrapper. While `open`, closes it when
// the user clicks/taps outside the wrapper or presses Escape. This replaces the
// fragile onMouseLeave-to-close pattern, which snaps shut the moment the cursor
// crosses the gap between the trigger and the menu.
export function useOutsideClose<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T>(null)
  const cb = useRef(onClose)
  cb.current = onClose

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb.current()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cb.current()
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('touchstart', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('touchstart', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return ref
}

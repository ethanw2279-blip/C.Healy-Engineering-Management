import { PlusIcon } from './Icons'
import './Fab.css'

export default function Fab() {
  return (
    <button className="fab" aria-label="Create new">
      <PlusIcon size={30} strokeWidth={2} />
    </button>
  )
}

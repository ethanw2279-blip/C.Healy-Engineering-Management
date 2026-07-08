import { useState } from 'react'
import { Avatar, Button } from './ui'
import { TrashIcon } from '../../components/Icons'
import { useStore, useCurrentUser, newId } from '../../data/store'

function when(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-IE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Notes({ entityType, entityId }: { entityType: 'client' | 'job'; entityId: string }) {
  const { state, dispatch } = useStore()
  const { user, can } = useCurrentUser()
  const [body, setBody] = useState('')

  const notes = state.notes
    .filter((n) => n.entityType === entityType && n.entityId === entityId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

  const authorOf = (id: string) => state.employees.find((e) => e.id === id)

  const add = () => {
    if (!body.trim() || !user) return
    dispatch({
      type: 'ADD_NOTE',
      note: {
        id: newId('n'),
        entityType,
        entityId,
        body: body.trim(),
        authorId: user.id,
        createdAt: new Date().toISOString(),
      },
    })
    setBody('')
  }

  return (
    <div className="notes">
      <div className="notes-compose">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a note for the team…"
          rows={2}
        />
        <div className="notes-compose-actions">
          <Button size="sm" onClick={add} disabled={!body.trim()}>Add note</Button>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="notes-empty">No notes yet.</div>
      ) : (
        <ul className="notes-list">
          {notes.map((n) => {
            const author = authorOf(n.authorId)
            const canRemove = can('create:records') || n.authorId === user?.id
            return (
              <li key={n.id} className="note">
                <Avatar name={author?.name ?? '?'} color={author?.color} size={30} />
                <div className="note-body">
                  <div className="note-head">
                    <strong>{author?.name ?? 'Someone'}</strong>
                    <span className="note-when">{when(n.createdAt)}</span>
                    {canRemove && (
                      <button className="note-remove" aria-label="Delete note" onClick={() => dispatch({ type: 'REMOVE_NOTE', id: n.id })}>
                        <TrashIcon size={15} />
                      </button>
                    )}
                  </div>
                  <p>{n.body}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

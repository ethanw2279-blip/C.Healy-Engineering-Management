import { useRef, useState } from 'react'
import { TrashIcon } from '../../components/Icons'
import { useStore, useCurrentUser, newId } from '../../data/store'
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import type { Attachment } from '../../data/types'

const BUCKET = 'attachments'

function human(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

export default function Attachments({ entityType, entityId }: { entityType: 'client' | 'job'; entityId: string }) {
  const { state, dispatch } = useStore()
  const { user, can } = useCurrentUser()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const files = state.attachments.filter((a) => a.entityType === entityType && a.entityId === entityId)

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setBusy(true)
    setError(null)
    const id = newId('att')
    const path = `${entityType}/${entityId}/${id}-${file.name}`
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false })
    if (upErr) {
      setError(upErr.message)
    } else {
      const attachment: Attachment = {
        id, entityType, entityId, fileName: file.name, path, size: file.size,
        uploadedBy: user.id, createdAt: new Date().toISOString(),
      }
      dispatch({ type: 'ADD_ATTACHMENT', attachment })
    }
    setBusy(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const download = async (att: Attachment) => {
    const { data, error: sErr } = await supabase.storage.from(BUCKET).createSignedUrl(att.path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
    else if (sErr) setError(sErr.message)
  }

  const remove = async (att: Attachment) => {
    if (!confirm(`Remove ${att.fileName}?`)) return
    await supabase.storage.from(BUCKET).remove([att.path])
    dispatch({ type: 'REMOVE_ATTACHMENT', id: att.id })
  }

  const authorName = (id: string) => state.employees.find((e) => e.id === id)?.name ?? 'Someone'

  return (
    <div className="attachments">
      {!isSupabaseConfigured ? (
        <div className="attach-note">File attachments require the connected database (they don&apos;t work in the local demo).</div>
      ) : (
        <div className="attach-upload">
          <input ref={inputRef} type="file" onChange={onFile} disabled={busy} />
          {busy && <span className="cell-muted">Uploading…</span>}
          {error && <span className="attach-error">{error}</span>}
        </div>
      )}

      {files.length === 0 ? (
        <div className="attach-empty">No files attached.</div>
      ) : (
        <ul className="attach-list">
          {files.map((a) => {
            const canRemove = can('create:records') || a.uploadedBy === user?.id
            return (
              <li key={a.id} className="attach-item">
                <button className="attach-name" onClick={() => download(a)}>{a.fileName}</button>
                <span className="attach-meta">{human(a.size)} · {authorName(a.uploadedBy)}</span>
                {canRemove && isSupabaseConfigured && (
                  <button className="attach-remove" aria-label="Remove file" onClick={() => remove(a)}>
                    <TrashIcon size={16} />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

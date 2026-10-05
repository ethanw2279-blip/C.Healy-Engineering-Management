import { useRef, useState } from 'react'
import { FileIcon, TrashIcon } from '../components/Icons'
import { useStore, useCurrentUser, newId, formatDateTimeShort } from '../data/store'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { isImage } from './FieldPhotos'
import type { Attachment } from '../data/types'

const BUCKET = 'attachments'

function human(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

const extOf = (name: string) => name.split('.').pop()?.toUpperCase().slice(0, 4) ?? ''

// Drawings, PDFs and other documents on a job. Pictures live in FieldPhotos;
// both share the job's attachments, split by file type.
export default function FieldFiles({ entityId }: { entityId: string }) {
  const { state, dispatch } = useStore()
  const { user, can } = useCurrentUser()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const files = state.attachments
    .filter((a) => a.entityType === 'job' && a.entityId === entityId && !isImage(a.fileName))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const uploaderName = (id: string) => state.employees.find((e) => e.id === id)?.name ?? 'Unknown'

  const upload = async (list: FileList | null) => {
    if (!list?.length || !user) return
    setBusy(true)
    setError(null)
    for (const file of Array.from(list)) {
      const id = newId('att')
      const path = `job/${entityId}/${id}-${file.name.replace(/[^\w.\-]/g, '_')}`
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file)
      if (upErr) { setError(upErr.message); break }
      dispatch({
        type: 'ADD_ATTACHMENT',
        attachment: { id, entityType: 'job', entityId, fileName: file.name, path, size: file.size, uploadedBy: user.id, createdAt: new Date().toISOString() },
      })
    }
    setBusy(false)
  }

  // Open in a new tab so the phone's own viewer handles PDFs and drawings.
  const open = async (a: Attachment) => {
    const tab = window.open('', '_blank')
    const { data, error: sErr } = await supabase.storage.from(BUCKET).createSignedUrl(a.path, 3600)
    if (data?.signedUrl) {
      if (tab) tab.location.href = data.signedUrl
      else window.location.href = data.signedUrl
    } else {
      tab?.close()
      if (sErr) setError(sErr.message)
    }
  }

  const remove = async (a: Attachment) => {
    if (!confirm(`Remove ${a.fileName}?`)) return
    await supabase.storage.from(BUCKET).remove([a.path])
    dispatch({ type: 'REMOVE_ATTACHMENT', id: a.id })
  }

  if (!isSupabaseConfigured) {
    return <p className="muted-sub">Files need the connected database (not available in the local demo).</p>
  }

  return (
    <div>
      <div className="photo-actions">
        <button className="photo-btn" onClick={() => inputRef.current?.click()} disabled={busy}>
          <FileIcon size={18} /> Add file
        </button>
        <input ref={inputRef} type="file" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = '' }} />
      </div>
      {busy && <p className="muted-sub">Uploading…</p>}
      {error && <p className="attach-error">{error}</p>}

      {files.length === 0 ? (
        <p className="muted-sub">No drawings or documents yet.</p>
      ) : (
        <div className="fld-card">
          {files.map((a) => {
            const canRemove = can('create:records') || a.uploadedBy === user?.id
            return (
              <div key={a.id} className="jf-row">
                <button className="jf-open" onClick={() => open(a)}>
                  <span className="jf-ext">{extOf(a.fileName)}</span>
                  <span className="jf-text">
                    <strong>{a.fileName}</strong>
                    <span>{human(a.size)} · {uploaderName(a.uploadedBy)} · {formatDateTimeShort(a.createdAt)}</span>
                  </span>
                </button>
                {canRemove && (
                  <button className="jf-del" aria-label={`Remove ${a.fileName}`} onClick={() => remove(a)}><TrashIcon size={17} /></button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { TrashIcon } from '../components/Icons'
import { useStore, useCurrentUser, newId, formatDateTime, formatDateTimeShort } from '../data/store'
import { photoTakenAt } from '../lib/photoTakenAt'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import type { Attachment } from '../data/types'

const BUCKET = 'attachments'
export const isImage = (name: string) => /\.(png|jpe?g|webp|gif|heic|heif)$/i.test(name)

// imagesOnly: show just pictures, leaving drawings/PDFs to the Files section
// (used on the job page, where photos and files have their own tabs).
export default function FieldPhotos({ entityType, entityId, imagesOnly = false }: { entityType: 'job' | 'ga1'; entityId: string; imagesOnly?: boolean }) {
  const { state, dispatch } = useStore()
  const { user, can } = useCurrentUser()
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [urls, setUrls] = useState<Record<string, string>>({})

  const files = state.attachments.filter((a) => a.entityType === entityType && a.entityId === entityId && (!imagesOnly || isImage(a.fileName)))
  const fileKey = files.map((f) => f.id).join(',')

  // Resolve signed thumbnail URLs for the current files.
  useEffect(() => {
    if (!isSupabaseConfigured || files.length === 0) {
      setUrls({})
      return
    }
    let alive = true
    supabase.storage.from(BUCKET).createSignedUrls(files.map((f) => f.path), 3600).then(({ data }) => {
      if (!alive || !data) return
      const m: Record<string, string> = {}
      data.forEach((d, i) => { if (d.signedUrl) m[files[i].path] = d.signedUrl })
      setUrls(m)
    })
    return () => { alive = false }
  }, [fileKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const uploaderName = (id: string) => state.employees.find((e) => e.id === id)?.name ?? 'Unknown'

  // justCaptured: taken with the in-app camera button (so "now" is a fair
  // taken-time when the image carries no EXIF date).
  const upload = async (list: FileList | null, justCaptured = false) => {
    if (!list?.length || !user) return
    setBusy(true)
    setError(null)
    for (const file of Array.from(list)) {
      const id = newId('att')
      const takenAt = (await photoTakenAt(file, { justCaptured })) ?? undefined
      const path = `${entityType}/${entityId}/${id}-${file.name.replace(/[^\w.\-]/g, '_')}`
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file)
      if (upErr) { setError(upErr.message); break }
      dispatch({
        type: 'ADD_ATTACHMENT',
        attachment: { id, entityType, entityId, fileName: file.name, path, size: file.size, uploadedBy: user.id, createdAt: new Date().toISOString(), takenAt },
      })
    }
    setBusy(false)
  }

  const remove = async (a: Attachment) => {
    if (!confirm('Remove this photo?')) return
    await supabase.storage.from(BUCKET).remove([a.path])
    dispatch({ type: 'REMOVE_ATTACHMENT', id: a.id })
  }

  if (!isSupabaseConfigured) {
    return <p className="muted-sub">Photos need the connected database (not available in the local demo).</p>
  }

  return (
    <div className="photos">
      <div className="photo-actions">
        <button className="photo-btn" onClick={() => cameraRef.current?.click()} disabled={busy}>📷 Take photo</button>
        <button className="photo-btn" onClick={() => galleryRef.current?.click()} disabled={busy}>🖼 Upload</button>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { upload(e.target.files, true); e.target.value = '' }} />
        <input ref={galleryRef} type="file" accept="image/*" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = '' }} />
      </div>
      {busy && <p className="muted-sub">Uploading…</p>}
      {error && <p className="attach-error">{error}</p>}

      {files.length === 0 ? (
        <p className="muted-sub">No photos yet.</p>
      ) : (
        <div className="photo-grid">
          {files.map((a) => {
            const url = urls[a.path]
            const canRemove = can('create:records') || a.uploadedBy === user?.id
            const who = uploaderName(a.uploadedBy)
            const detail = `${a.takenAt ? `Taken ${formatDateTime(a.takenAt)}` : 'Taken: unknown'}\nUploaded ${formatDateTime(a.createdAt)} by ${who}`
            return (
              <div key={a.id} className="photo-item">
                <div className="photo-thumb">
                  {isImage(a.fileName) && url ? (
                    <a href={url} target="_blank" rel="noreferrer"><img src={url} alt={a.fileName} /></a>
                  ) : (
                    <a className="photo-file" href={url} target="_blank" rel="noreferrer">{a.fileName}</a>
                  )}
                  {canRemove && (
                    <button className="photo-del" aria-label="Remove" onClick={() => remove(a)}><TrashIcon size={15} /></button>
                  )}
                </div>
                <div className="photo-caption" title={detail}>
                  <span>{a.takenAt ? formatDateTimeShort(a.takenAt) : `Added ${formatDateTimeShort(a.createdAt)}`}</span>
                  <span>{who}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

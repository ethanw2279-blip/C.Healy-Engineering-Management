import { supabase } from '../lib/supabaseClient'
import { ga1RegisterCsv } from './ga1'
import type { GA1Inspection } from './types'

// Browser-side helpers for exporting a GA1 register and emailing a client.
// The register PDF and the email are produced by serverless endpoints; the CSV
// is built in the browser so it works even without the server email/PDF config.

function triggerDownload(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(href)
}

const slug = (s: string) => (s || 'client').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'client'

/** Download the register as a CSV built in-browser (opens in Excel). */
export function downloadRegisterCsv(list: GA1Inspection[], clientName: string, fmtDate: (s: string) => string) {
  const csv = ga1RegisterCsv(list, fmtDate)
  // Prepend a BOM so Excel reads it as UTF-8.
  triggerDownload(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }), `GA1-Register-${slug(clientName)}.csv`)
}

async function bearer(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('You need to be signed in.')
  return token
}

/**
 * Download the branded register PDF from the server. `clientId` is required for
 * staff; a client login may omit it (the server forces its own).
 */
export async function downloadRegisterPdf(clientName: string, clientId?: string) {
  const token = await bearer()
  const qs = clientId ? `?clientId=${encodeURIComponent(clientId)}` : ''
  const res = await fetch(`/api/ga1/register${qs}`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}))
    throw new Error(msg.error || `Register download failed (${res.status}).`)
  }
  triggerDownload(await res.blob(), `GA1-Register-${slug(clientName)}.pdf`)
}

/** Download the selected GA1 certificates bundled into one .zip. */
export async function downloadGA1Zip(ids: string[], clientName: string) {
  if (ids.length === 0) throw new Error('No reports selected.')
  const token = await bearer()
  const res = await fetch(`/api/ga1/zip?ids=${encodeURIComponent(ids.join(','))}`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}))
    throw new Error(msg.error || `Zip download failed (${res.status}).`)
  }
  triggerDownload(await res.blob(), `GA1-Reports-${slug(clientName)}.zip`)
}

/** Email a client a portal link to their GA1 reports (staff only). */
export async function emailReportsToClient(clientId: string): Promise<{ sentTo: string; reportCount: number }> {
  const token = await bearer()
  const res = await fetch('/api/ga1/notify-client', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || `Could not send the email (${res.status}).`)
  return { sentTo: body.sentTo, reportCount: body.reportCount ?? 0 }
}

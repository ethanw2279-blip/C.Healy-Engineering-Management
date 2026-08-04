import { supabase } from '../lib/supabaseClient'

// Small authed fetch helpers for portal actions (documents, invites, orders,
// payments). Each attaches the client's Supabase session token.

async function token(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const t = data.session?.access_token
  if (!t) throw new Error('You need to be signed in.')
  return t
}

async function authedJson(path: string, init?: RequestInit) {
  const res = await fetch(path, { ...init, headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json', ...(init?.headers || {}) } })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status}).`)
  return body
}

/** Fetch a short-lived signed URL for an attachment and open it. */
export async function openDocument(attachmentId: string) {
  const body = await authedJson(`/api/portal/document?id=${encodeURIComponent(attachmentId)}`, { method: 'GET' })
  if (body.url) window.open(body.url, '_blank', 'noopener')
}

/** Best-effort invite email (the membership row is created separately via RLS). */
export async function sendInviteEmail(email: string): Promise<{ ok: boolean; note?: string }> {
  try {
    await authedJson('/api/portal/invite', { method: 'POST', body: JSON.stringify({ email }) })
    return { ok: true }
  } catch (e) {
    // A 501/502 means "added but not emailed" — surface as a soft note.
    return { ok: false, note: e instanceof Error ? e.message : 'Could not send the invite email.' }
  }
}

/** Place a portal order from the cart. Returns the created order number. */
export async function placeOrder(items: { productId: string; qty: number }[]): Promise<{ orderNumber: string }> {
  const body = await authedJson('/api/portal/order', { method: 'POST', body: JSON.stringify({ items }) })
  return { orderNumber: body.orderNumber }
}

/** Start a Stripe Checkout session for an invoice; returns the redirect URL. */
export async function startCheckout(invoiceId: string): Promise<{ url: string }> {
  const body = await authedJson('/api/portal/pay', { method: 'POST', body: JSON.stringify({ invoiceId }) })
  return { url: body.url }
}

/** Confirm a returned Checkout session and mark the invoice paid if settled. */
export async function confirmCheckout(sessionId: string): Promise<{ paid: boolean; invoiceNumber?: string }> {
  return authedJson(`/api/portal/pay-confirm?session_id=${encodeURIComponent(sessionId)}`, { method: 'GET' })
}

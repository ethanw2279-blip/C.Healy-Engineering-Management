// Shared CORS handling for the public website-facing endpoints.
// Configure allowed origin(s) via CONTACT_ALLOWED_ORIGIN (comma-separated).
// Missing scheme / trailing slash are tolerated; "*" allows any origin.

function normalizeOrigin(o) {
  o = (o || '').trim().replace(/\/+$/, '')
  if (!o || o === '*') return o
  if (!/^https?:\/\//i.test(o)) o = 'https://' + o
  return o
}

const allowedOrigins = (process.env.CONTACT_ALLOWED_ORIGIN || '*')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean)

function resolveOrigin(reqOrigin) {
  if (allowedOrigins.includes('*')) return '*'
  const ro = normalizeOrigin(reqOrigin)
  if (ro && allowedOrigins.includes(ro)) return ro
  return allowedOrigins[0] || '*'
}

// Sets CORS headers and answers preflight. Returns true if the request was a
// preflight (already ended) — callers should then return immediately.
export function applyCors(req, res, methods = 'POST, OPTIONS') {
  res.setHeader('Access-Control-Allow-Origin', resolveOrigin(req.headers.origin))
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', methods)
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-form-secret')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return true
  }
  return false
}

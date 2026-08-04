// Single serverless function that dispatches every /api/portal/* action, so
// the portal's endpoints cost one function slot instead of six (Vercel Hobby
// caps a deployment at 12). The handlers live in api/_portal/* — Vercel ignores
// underscore-prefixed paths, so they aren't counted as functions themselves.
import document from '../_portal/document.js'
import invite from '../_portal/invite.js'
import order from '../_portal/order.js'
import pay from '../_portal/pay.js'
import payConfirm from '../_portal/pay-confirm.js'
import request from '../_portal/request.js'

const handlers = {
  document,
  invite,
  order,
  pay,
  'pay-confirm': payConfirm,
  request,
}

export default function handler(req, res) {
  const action = req.query.action
  const fn = handlers[action]
  if (!fn) return res.status(404).json({ error: `Unknown portal action: ${action}` })
  return fn(req, res)
}

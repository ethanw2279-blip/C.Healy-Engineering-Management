import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Modal } from './ui'
import { useStore, newId, eurExact, itemsTotal } from '../../data/store'
import type { Invoice, LineItem, Quote } from '../../data/types'
import { cardLines, type CardLineOptions } from '../../data/jobCard'
import { nextNumber, today } from '../formParts'
import '../../components/stock.css'
import '../../components/jobcard.css'

const RATE_KEY = 'che-labour-rate'

/** The last hourly rate used to price a job card (per browser), €55 to start. */
export function savedRate(): number {
  try {
    const v = Number(localStorage.getItem(RATE_KEY))
    return v > 0 ? v : 55
  } catch {
    return 55
  }
}

// Turn a job card into a draft quote or invoice: one line per stage (or a
// single labour line) at an hourly rate, plus the job's materials.
export default function JobCardConvert({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const nav = useNavigate()
  const job = state.jobs.find((j) => j.id === jobId)
  const client = state.clients.find((c) => c.id === job?.clientId)

  const [kind, setKind] = useState<'quote' | 'invoice'>('invoice')
  const [rateText, setRateText] = useState(String(savedRate()))
  const [opts, setOpts] = useState<Omit<CardLineOptions, 'rate'>>({ perStage: true, materials: true, unfinished: true, showWho: false })
  const [skip, setSkip] = useState<Set<string>>(new Set())
  const [qtys, setQtys] = useState<Record<string, number>>({})
  const rate = Math.max(0, Number(rateText.replace(',', '.')) || 0)

  const base = useMemo(() => cardLines(state, jobId, { ...opts, rate }), [state, jobId, opts, rate])
  const lines = base.map((l) => (qtys[l.key] !== undefined ? { ...l, qty: qtys[l.key] } : l))
  const picked = lines.filter((l) => !skip.has(l.key))
  const total = itemsTotal(picked)

  const set = (k: keyof typeof opts, v: boolean) => setOpts((o) => ({ ...o, [k]: v }))
  const flip = (key: string) => setSkip((s) => {
    const n = new Set(s)
    if (n.has(key)) n.delete(key); else n.add(key)
    return n
  })

  if (!job) return null

  const create = () => {
    try { localStorage.setItem(RATE_KEY, String(rate)) } catch { /* private mode */ }
    const items: LineItem[] = picked.map(({ id, name, description, qty, unitPrice }) => ({ id, name, description, qty, unitPrice }))
    if (kind === 'quote') {
      const quote: Quote = {
        id: newId('q'), number: nextNumber('Q-', state.quotes.map((q) => q.number)), clientId: job.clientId,
        title: job.title, items, status: 'Draft', createdAt: new Date().toISOString(),
      }
      dispatch({ type: 'ADD_QUOTE', quote })
      nav(`/quotes/${quote.id}`)
    } else {
      const due = new Date()
      due.setDate(due.getDate() + 14)
      const invoice: Invoice = {
        id: newId('i'), number: nextNumber('INV-', state.invoices.map((i) => i.number)), clientId: job.clientId, jobId: job.id,
        items, status: 'Draft', issuedOn: today(),
        dueOn: `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`,
      }
      dispatch({ type: 'ADD_INVOICE', invoice })
      nav(`/invoices/${invoice.id}`)
    }
  }

  return (
    <Modal
      wide
      title="Turn job card into…"
      onClose={onClose}
      footer={
        <>
          <span className="cell-muted" style={{ marginRight: 'auto', fontSize: 13 }}>Linked to {job.number}{client ? ` · ${client.name}` : ''}</span>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={create} disabled={picked.length === 0}>Create draft {kind}</Button>
        </>
      }
    >
      <div className="jc-opts">
        <div>
          <label className="jc-lab">Make a</label>
          <div className="stk-seg">
            <button type="button" className={kind === 'quote' ? 'on' : ''} onClick={() => setKind('quote')}>Quote</button>
            <button type="button" className={kind === 'invoice' ? 'on' : ''} onClick={() => setKind('invoice')}>Invoice</button>
          </div>
        </div>
        <div>
          <label className="jc-lab">Hourly rate (€)</label>
          <input className="jc-rate" inputMode="decimal" value={rateText} onChange={(e) => setRateText(e.target.value)} />
        </div>
        <div>
          <label className="jc-lab">Lines</label>
          <div className="stk-seg">
            <button type="button" className={opts.perStage ? 'on' : ''} onClick={() => set('perStage', true)}>One per stage</button>
            <button type="button" className={!opts.perStage ? 'on' : ''} onClick={() => set('perStage', false)}>One total line</button>
          </div>
        </div>
      </div>
      <div className="jc-checks">
        <label className="jc-check"><input type="checkbox" checked={opts.materials} onChange={(e) => set('materials', e.target.checked)} /> Add materials as lines</label>
        {opts.perStage && <label className="jc-check"><input type="checkbox" checked={opts.showWho} onChange={(e) => set('showWho', e.target.checked)} /> Show who did each stage</label>}
        <label className="jc-check"><input type="checkbox" checked={opts.unfinished} onChange={(e) => set('unfinished', e.target.checked)} /> Include stages not finished yet</label>
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th style={{ width: 40 }} /><th>Line item</th><th className="num">Qty</th><th className="num">Unit</th><th className="num">Total</th></tr></thead>
          <tbody>
            {lines.length === 0 && <tr><td colSpan={5} className="cell-muted">Nothing to add yet. Mark some stages done, or include unfinished ones.</td></tr>}
            {lines.map((l) => {
              const off = skip.has(l.key)
              return (
                <tr key={l.key} style={off ? { opacity: 0.45 } : undefined}>
                  <td><input type="checkbox" checked={!off} onChange={() => flip(l.key)} style={{ width: 18, height: 18, accentColor: 'var(--green)' }} /></td>
                  <td>
                    <span className="cell-strong">{l.name}</span>
                    {l.kind === 'material' && <span className="jc-dim"> · material{l.unitPrice === 0 ? ', no price set' : ''}</span>}
                    {l.noHours && <span className="jc-dim"> · no hours yet, enter an estimate</span>}
                  </td>
                  <td className="num" style={{ whiteSpace: 'nowrap' }}>
                    <input
                      className="jc-qty" inputMode="decimal" value={l.qty}
                      onChange={(e) => setQtys((q) => ({ ...q, [l.key]: Math.max(0, Number(e.target.value.replace(',', '.')) || 0) }))}
                    />
                    {l.kind !== 'material' && ' h'}
                  </td>
                  <td className="num">{eurExact(l.unitPrice)}</td>
                  <td className="num">{eurExact(l.qty * l.unitPrice)}</td>
                </tr>
              )
            })}
            {lines.length > 0 && (
              <tr><td colSpan={4} className="num cell-strong">Total</td><td className="num cell-strong">{eurExact(total)}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="cell-muted" style={{ fontSize: 12.5, marginTop: 10 }}>This makes a draft. You can still change prices and wording on the {kind} before sending it.</p>
    </Modal>
  )
}

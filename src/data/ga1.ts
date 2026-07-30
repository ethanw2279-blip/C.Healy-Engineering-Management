import type { GA1Result, GA1Inspection } from './types'

export const EQUIPMENT_TYPES = [
  'Excavators',
  'Telehandlers / Teleporters',
  'Forklifts',
  'Cranes',
  'Truck Mounted Cranes',
  'Loader Cranes / HIABs',
  'Gantries and Jib Cranes',
  'MEWPs / Cherry Pickers / Scissor Lifts',
  'Hoists and Winches',
  'Vehicle / Tail Lifts',
  'Slings, Chains & Shackles',
  'Lifting Beams / Spreader Beams',
  'Excavator Quick Hitches',
  'Man Baskets / Work Platforms',
  'Road Saws',
  'Cutting Equipment',
]

export const RESULT_LABELS: Record<GA1Result, string> = {
  safe: 'Safe to Use',
  repair_required: 'Repair Required',
  unsafe: 'Unsafe — Do Not Use',
}

export const resultTone: Record<GA1Result, 'green' | 'amber' | 'red'> = {
  safe: 'green',
  repair_required: 'amber',
  unsafe: 'red',
}

export function addMonths(dateStr: string, n: number) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + n)
  return d.toISOString().slice(0, 10)
}

export const isOverdue = (dateStr: string) => !!dateStr && new Date(dateStr) < new Date('2026-07-08')

// ── Register (schedule of examinations) ─────────────────────────────────────
// A register is the one-row-per-report summary a customer keeps as their
// physical record — every GA1 for that client, indexed by cert number.

// All GA1s here are annual thorough examinations, so the register shows a
// single fixed exam type rather than a per-report field.
export const GA1_EXAM_TYPE = 'Annual'

// The register's plain-English pass/fail, mirroring the wording customers
// expect on the printed schedule (e.g. "Pass - No Defects").
export function registerStatus(g: Pick<GA1Inspection, 'overallResult' | 'defectsFound'>): string {
  if (g.overallResult === 'safe') return g.defectsFound ? 'Pass - Defects Noted' : 'Pass - No Defects'
  if (g.overallResult === 'repair_required') return 'Fail - Repair Required'
  return 'Fail - Unsafe'
}

// Equipment description as shown on the register — the type plus any free-text
// description, e.g. "Plant — Truck Road Sweeper".
export function ga1Description(g: Pick<GA1Inspection, 'equipmentType' | 'equipmentDescription'>): string {
  return [g.equipmentType, g.equipmentDescription].filter(Boolean).join(' — ') || '—'
}

export const GA1_REGISTER_HEADERS = [
  'Exam Type', 'Serial No.', 'Description', 'Location', 'Exam Date', 'Next Exam Date', 'Status', 'Cert No.',
] as const

function csvCell(v: string): string {
  const s = String(v ?? '')
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// Builds the register as CSV (opens directly in Excel). `fmtDate` is passed in
// so this module stays free of the heavier store/date dependencies.
export function ga1RegisterCsv(list: GA1Inspection[], fmtDate: (s: string) => string): string {
  const rows = list.map((g) => [
    GA1_EXAM_TYPE,
    g.serialNumber || '',
    ga1Description(g),
    g.examinationLocation || '',
    fmtDate(g.examinationDate),
    fmtDate(g.nextExaminationDate),
    registerStatus(g),
    g.reportNumber || '',
  ])
  return [GA1_REGISTER_HEADERS as readonly string[], ...rows]
    .map((r) => r.map(csvCell).join(','))
    .join('\r\n')
}

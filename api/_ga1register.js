import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const PDFDocument = require('pdfkit')

// ── Landscape A4 constants ──────────────────────────────────────────────────
const PW = 841.89 // page width  (A4 landscape)
const PH = 595.28 // page height
const ML = 30 // left margin
const MR = 30 // right margin
const CW = PW - ML - MR // usable width

const WHITE = '#ffffff'
const BLACK = '#000000'
const NAVY = '#1c3a5e'
const NAV_TEXT = '#ffffff'
const ZEBRA = '#f2f5f9'

// Columns mirror the customer's printed register (no "Sub Location"; exam type
// is the fixed "Annual"). Widths sum to CW.
const COLS = [
  { key: 'examType', label: 'Exam Type', w: 62 },
  { key: 'serial', label: 'Serial No.', w: 118 },
  { key: 'description', label: 'Description', w: 176 },
  { key: 'location', label: 'Location', w: 96 },
  { key: 'examDate', label: 'Exam Date', w: 74 },
  { key: 'nextExam', label: 'Next Exam Date', w: 82 },
  { key: 'status', label: 'Status', w: 92 },
  { key: 'cert', label: 'Cert No.', w: CW - 62 - 118 - 176 - 96 - 74 - 82 - 92 },
]

const PAD = 5
const FONT_SIZE = 8.5

function fmtDate(d) {
  if (!d) return ''
  try {
    const dt = new Date(d)
    if (isNaN(dt.getTime())) return d
    return dt.toLocaleDateString('en-GB')
  } catch {
    return d
  }
}

// Map the derived "Pass - No Defects" style status from the stored columns,
// matching src/data/ga1.ts registerStatus().
function status(g) {
  if (g.overall_result === 'safe') return g.defects_found ? 'Pass - Defects Noted' : 'Pass - No Defects'
  if (g.overall_result === 'repair_required') return 'Fail - Repair Required'
  return 'Fail - Unsafe'
}

function description(g) {
  return [g.equipment_type, g.equipment_description].filter(Boolean).join(' — ') || '—'
}

function rowValues(g) {
  return {
    examType: 'Annual',
    serial: g.serial_number || '',
    description: description(g),
    location: g.examination_location || '',
    examDate: fmtDate(g.examination_date),
    nextExam: fmtDate(g.next_examination_date),
    status: status(g),
    cert: g.report_number || '',
  }
}

export function generateRegisterPDF({ client, rows }, stream) {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0, bufferPages: true })
  doc.pipe(stream)

  const clientName = client?.company || client?.name || ''
  const clientAddr = client?.address || ''

  const drawFooter = () => {
    doc.save().fillColor('#888').fontSize(7.5).font('Helvetica')
      .text(
        `GA1 Register of Thorough Examinations  —  C.Healy Engineering  —  ${clientName}`,
        ML, PH - 20, { width: CW, align: 'center', lineBreak: false },
      ).restore()
  }

  let y = 34

  const drawTitle = () => {
    doc.save().fillColor(BLACK).font('Helvetica-Bold').fontSize(15)
      .text('Register of Thorough Examinations (GA1)', ML, y, { width: CW, lineBreak: false }).restore()
    doc.save().fillColor('#666').font('Helvetica').fontSize(9)
      .text(`Generated ${fmtDate(new Date())}`, ML, y, { width: CW, align: 'right', lineBreak: false }).restore()
    y += 22
    doc.save().fillColor(BLACK).font('Helvetica-Bold').fontSize(10)
      .text(clientName, ML, y, { width: CW, lineBreak: false }).restore()
    y += 14
    if (clientAddr) {
      doc.save().fillColor('#444').font('Helvetica').fontSize(9)
        .text(clientAddr, ML, y, { width: CW, lineBreak: false }).restore()
      y += 14
    }
    y += 6
  }

  const drawHeaderRow = () => {
    const h = 20
    let x = ML
    doc.save().rect(ML, y, CW, h).fillColor(NAVY).fill().restore()
    COLS.forEach((c) => {
      doc.save().fillColor(NAV_TEXT).font('Helvetica-Bold').fontSize(FONT_SIZE)
        .text(c.label, x + PAD, y + (h - FONT_SIZE) / 2 - 1, { width: c.w - PAD * 2, lineBreak: false, ellipsis: true })
        .restore()
      x += c.w
    })
    y += h
  }

  drawTitle()
  drawHeaderRow()

  const PAGE_BOTTOM = PH - 30

  if (!rows || rows.length === 0) {
    doc.save().fillColor('#666').font('Helvetica-Oblique').fontSize(10)
      .text('No GA1 reports on file for this customer.', ML, y + 12, { width: CW, align: 'center' }).restore()
  }

  ;(rows || []).forEach((g, i) => {
    const v = rowValues(g)

    // Row height = tallest wrapped cell.
    let rowH = 16
    doc.font('Helvetica').fontSize(FONT_SIZE)
    COLS.forEach((c) => {
      const hh = doc.heightOfString(String(v[c.key] || ''), { width: c.w - PAD * 2 })
      rowH = Math.max(rowH, hh + PAD * 2)
    })

    // Page break — repeat the column header on the new page.
    if (y + rowH > PAGE_BOTTOM) {
      doc.addPage()
      y = 34
      drawHeaderRow()
    }

    if (i % 2 === 1) doc.save().rect(ML, y, CW, rowH).fillColor(ZEBRA).fill().restore()

    let x = ML
    COLS.forEach((c) => {
      doc.save().rect(x, y, c.w, rowH).lineWidth(0.5).strokeColor('#cccccc').stroke().restore()
      doc.save().fillColor(BLACK).font('Helvetica').fontSize(FONT_SIZE)
        .text(String(v[c.key] || ''), x + PAD, y + PAD, { width: c.w - PAD * 2 }).restore()
      x += c.w
    })
    y += rowH
  })

  // Footer on every page.
  const range = doc.bufferedPageRange()
  for (let p = range.start; p < range.start + range.count; p++) {
    doc.switchToPage(p)
    drawFooter()
  }

  doc.end()
}

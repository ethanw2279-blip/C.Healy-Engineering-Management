import { createRequire } from 'module'
import { chHeader, weCertify } from './_ga1assets.js'

const require = createRequire(import.meta.url)
const PDFDocument = require('pdfkit')

// ── A4 constants ──────────────────────────────────────────────────────────────
const PW = 595.28 // page width
const PH = 841.89 // page height
const ML = 40 // left margin
const MR = 40 // right margin
const CW = PW - ML - MR // 515.28 usable width

// ── Colours ───────────────────────────────────────────────────────────────────
const WHITE = '#ffffff'
const BLACK = '#000000'
const LABEL_BG = '#e8e8e8'
const NAVY = '#1c3a5e'
const NAV_TEXT = '#ffffff'

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

function cell(doc, x, y, w, h, { bg = WHITE, lines = [], pad = 5, valign = 'top', align = 'left' } = {}) {
  if (bg !== WHITE) doc.save().rect(x, y, w, h).fillColor(bg).fill().restore()
  doc.save().rect(x, y, w, h).lineWidth(0.5).strokeColor(BLACK).stroke().restore()
  if (!lines || lines.length === 0) return doc

  const tw = w - pad * 2
  let ty
  if (valign === 'middle') {
    const sz = lines[0]?.size || 9
    ty = y + Math.max(pad, (h - sz) / 2)
  } else {
    ty = y + pad
  }

  lines.forEach(({ text = '', bold = false, italic = false, size = 9, color = BLACK }) => {
    if (!text && text !== 0) {
      ty += size * 0.6
      return
    }
    const fontName = bold ? 'Helvetica-Bold' : italic ? 'Helvetica-Oblique' : 'Helvetica'
    doc.save().fillColor(color).fontSize(size).font(fontName)
      .text(String(text), x + pad, ty, { width: tw, lineBreak: true, align }).restore()
    const approxLineCount = Math.max(
      1,
      Math.ceil(doc.widthOfString(String(text), { font: fontName, size }) / Math.max(tw, 1)),
    )
    ty += approxLineCount * (size * 1.3) + 1
  })
  return doc
}

function hr(doc, x, y, w) {
  doc.save().moveTo(x, y).lineTo(x + w, y).lineWidth(0.7).strokeColor('#aaaaaa').stroke().restore()
}

// ── Main export ───────────────────────────────────────────────────────────────
export function generateGA1PDF({ inspection, client, engineer }, stream) {
  const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: false })
  doc.pipe(stream)

  const drawFooter = () => {
    doc.save().fillColor('#888').fontSize(7.5).font('Helvetica')
      .text(
        `GA1 Report  —  C.Healy Engineering  —  ${inspection.report_number || ''}   |   Safety, Health and Welfare at Work (General Application) Regulations 2007`,
        ML, PH - 18, { width: CW, align: 'center', lineBreak: false },
      ).restore()
  }
  doc.on('pageAdded', drawFooter)
  drawFooter()

  const res = (() => {
    try {
      return JSON.parse(inspection.inspection_results || '{}')
    } catch {
      return {}
    }
  })()
  const defectsFound = !!res.defects_found

  const dangerText = defectsFound ? inspection.defects_description || 'See notes' : 'None'
  const repairText = defectsFound
    ? inspection.defects_description || 'See notes'
    : 'None, machine is in good working order on date of test'
  const timeframeText = defectsFound ? (inspection.reinspection_date ? fmtDate(inspection.reinspection_date) : 'N/A') : 'N/A'
  const secRepairText = defectsFound ? inspection.defects_description || 'N/A' : 'N/A'
  const secondaryDefects = defectsFound ? 'See above' : 'None'

  const engineerName = engineer?.name || inspection.engineer_name || ''
  const clientCompany = client?.company || inspection.company || ''
  const clientName = client?.name || inspection.client_name || ''
  const clientPhone = client?.phone || inspection.phone || ''
  const clientEmail = client?.email || inspection.email || ''

  const employerLines = [
    clientCompany,
    clientCompany !== clientName ? clientName : null,
    clientPhone,
    clientEmail,
  ].filter(Boolean)

  let y = 35
  const PAGE_TOP = 35
  const PAGE_BOTTOM = PH - 38
  const ensure = (h) => {
    if (y + h > PAGE_BOTTOM) {
      doc.addPage()
      y = PAGE_TOP
    }
  }

  // ── HEADER (embedded branded banner) ────────────────────────────────
  let headerDrawn = false
  try {
    const headerImg = doc.openImage(chHeader)
    let drawW = CW
    let drawH = headerImg.height * (CW / headerImg.width)
    const maxHeaderH = 132
    if (drawH > maxHeaderH) {
      drawH = maxHeaderH
      drawW = headerImg.width * (maxHeaderH / headerImg.height)
    }
    doc.image(headerImg, ML + (CW - drawW) / 2, y, { width: drawW })
    y += drawH + 10
    headerDrawn = true
  } catch (err) {
    console.error('GA1 header image could not be loaded:', err.message)
  }
  if (!headerDrawn) {
    doc.save().fillColor(BLACK).fontSize(17).font('Helvetica-Bold')
      .text('Report of Thorough Examination GA1', ML, y, { width: CW, align: 'center', underline: true, lineBreak: false })
      .restore()
    y += 28
  }

  // ── REGULATORY TEXT BOX ────────────────────────────────────────────
  const regH = 50
  ensure(regH + 10)
  doc.save().roundedRect(ML, y, CW, regH, 6).lineWidth(1).strokeColor('#888').stroke().restore()
  doc.save().fillColor(BLACK).font('Helvetica').fontSize(8.5)
    .text(
      'Report to record the Thorough Examination and Testing of Lifting Equipment, as set out in\nthe Safety, Health and Welfare at Work (General Application) Regulations, 2007.',
      ML + 15, y + 11, { width: CW - 30, align: 'center', lineBreak: true },
    ).restore()
  y += regH + 10

  const drH = 22
  const halfW = Math.round(CW / 2)
  ensure(drH + 58 + 30 + 22)
  cell(doc, ML, y, 52, drH, { lines: [{ text: 'Date:', bold: true }], valign: 'middle' })
  cell(doc, ML + 52, y, halfW - 52, drH, { lines: [{ text: fmtDate(inspection.examination_date) }], valign: 'middle' })
  cell(doc, ML + halfW, y, 72, drH, { lines: [{ text: 'Reference:', bold: true }], valign: 'middle' })
  cell(doc, ML + halfW + 72, y, CW - halfW - 72, drH, { lines: [{ text: inspection.report_number || '' }], valign: 'middle' })
  y += drH

  const emplH = 58
  const emplLW = 170
  cell(doc, ML, y, emplLW, emplH, { bg: LABEL_BG, lines: [{ text: 'Name and address of employer or owner for whom the thorough examination was made:', bold: true, size: 8.5 }] })
  cell(doc, ML + emplLW, y, CW - emplLW, emplH, { lines: employerLines.map((t) => ({ text: t })) })
  y += emplH

  const examAddrH = 30
  cell(doc, ML, y, emplLW, examAddrH, { bg: LABEL_BG, lines: [{ text: 'Address where thorough examination was made:', bold: true, size: 8.5 }] })
  cell(doc, ML + emplLW, y, CW - emplLW, examAddrH, { lines: [{ text: inspection.examination_location || '' }], valign: 'middle' })
  y += examAddrH

  const equipH = 22
  cell(doc, ML, y, emplLW, equipH, { bg: LABEL_BG, lines: [{ text: 'Type of lifting equipment:', bold: true }], valign: 'middle' })
  cell(doc, ML + emplLW, y, CW - emplLW, equipH, { lines: [{ text: inspection.equipment_type || '' }], valign: 'middle' })
  y += equipH + 8

  const syH = 24
  const snLW = 82
  const snVW = halfW - snLW
  const ymLW = 100
  const ymVW = CW - halfW - ymLW
  ensure(syH + 8)
  cell(doc, ML, y, snLW, syH, { lines: [{ text: 'Serial Number:', bold: true }], valign: 'middle' })
  cell(doc, ML + snLW, y, snVW, syH, { lines: [{ text: inspection.serial_number || '' }], valign: 'middle' })
  cell(doc, ML + halfW, y, ymLW, syH, { lines: [{ text: 'Year of manufacture:', bold: true }], valign: 'middle' })
  cell(doc, ML + halfW + ymLW, y, ymVW, syH, { lines: [{ text: inspection.year_of_manufacture || '' }], valign: 'middle' })
  y += syH + 8

  const swlNavyH = 18
  const swlValH = 24
  const swlW = Math.round(CW * 0.32)
  const mfgW = CW - swlW
  ensure(swlNavyH + swlValH + 8)
  cell(doc, ML, y, swlW, swlNavyH, { bg: NAVY, lines: [{ text: 'Safe Working Load', bold: true, color: NAV_TEXT }], valign: 'middle' })
  cell(doc, ML + swlW, y, mfgW, swlNavyH, { bg: NAVY, lines: [{ text: 'Manufacturer / Model', bold: true, color: NAV_TEXT }], valign: 'middle' })
  y += swlNavyH
  cell(doc, ML, y, swlW, swlValH, { lines: [{ text: inspection.swl || '' }], valign: 'middle' })
  cell(doc, ML + swlW, y, mfgW, swlValH, { lines: [{ text: [inspection.manufacturer, inspection.model].filter(Boolean).join('  /  ') }], valign: 'middle' })
  y += swlValH + 8

  const partLH = 18, partVH = 50
  ensure(partLH + partVH + 10)
  cell(doc, ML, y, CW, partLH, { bg: LABEL_BG, lines: [{ text: 'Particulars of tests carried out:', bold: true }], valign: 'middle' })
  y += partLH
  const particularsText =
    (inspection.particulars_of_tests || inspection.additional_notes || '').trim() ||
    'Visual Examination and functional test only, no internal parts inspected'
  cell(doc, ML, y, CW, partVH, { lines: [{ text: particularsText }] })
  y += partVH + 10

  const purpLH = 18, purpVH = 28
  const purpW = Math.round(CW / 2)
  ensure(purpLH + purpVH + 10)
  cell(doc, ML, y, purpW, purpLH, { bg: LABEL_BG, lines: [{ text: 'Purpose of testing:', bold: true }], valign: 'middle' })
  cell(doc, ML + purpW, y, CW - purpW, purpLH, { bg: LABEL_BG, lines: [{ text: 'Purpose of thorough examination:', bold: true }], valign: 'middle' })
  y += purpLH
  cell(doc, ML, y, purpW, purpVH, { lines: [{ text: 'Functional test & visual examination' }], valign: 'middle' })
  cell(doc, ML + purpW, y, CW - purpW, purpVH, { lines: [{ text: inspection.purpose_of_examination || '12 Monthly Testing' }], valign: 'middle' })
  y += purpVH + 10

  const nextH = 30, nextLW = 210
  ensure(nextH + 14)
  cell(doc, ML, y, nextLW, nextH, { bg: LABEL_BG, lines: [{ text: 'Latest date for next thorough examination:', bold: true, size: 8.5 }], valign: 'middle' })
  cell(doc, ML + nextLW, y, CW - nextLW, nextH, { lines: [{ text: fmtDate(inspection.next_examination_date), size: 11, bold: true }], valign: 'middle' })
  y += nextH + 12

  ensure(24)
  hr(doc, ML, y, CW)
  y += 12

  const defLH = 26, defVH = 42
  const defW = Math.round(CW / 2)
  ensure(defLH + defVH + 10)
  cell(doc, ML, y, defW, defLH, { bg: LABEL_BG, lines: [{ text: 'Defect which is a danger to persons:', bold: true, size: 8.5 }], valign: 'middle' })
  cell(doc, ML + defW, y, CW - defW, defLH, { bg: LABEL_BG, lines: [{ text: 'Repair, renewal or alteration required to remedy this defect:', bold: true, size: 8.5 }], valign: 'middle' })
  y += defLH
  cell(doc, ML, y, defW, defVH, { lines: [{ text: dangerText }] })
  cell(doc, ML + defW, y, CW - defW, defVH, { lines: [{ text: repairText }] })
  y += defVH + 10

  const tc1W = Math.round(CW * 0.34), tc2W = Math.round(CW * 0.22), tc3W = CW - tc1W - tc2W
  const tcLH = 40, tcVH = 28
  ensure(tcLH + tcVH + 10)
  cell(doc, ML, y, tc1W, tcLH, { bg: LABEL_BG, lines: [{ text: 'Defect which could become a danger to persons:', bold: true, size: 8 }] })
  cell(doc, ML + tc1W, y, tc2W, tcLH, { bg: LABEL_BG, lines: [{ text: 'Timeframe for defect becoming a danger:', bold: true, size: 8 }] })
  cell(doc, ML + tc1W + tc2W, y, tc3W, tcLH, { bg: LABEL_BG, lines: [{ text: 'Repair, renewal or alteration required to remedy this defect, including date(s):', bold: true, size: 8 }] })
  y += tcLH
  cell(doc, ML, y, tc1W, tcVH, { lines: [{ text: secondaryDefects }] })
  cell(doc, ML + tc1W, y, tc2W, tcVH, { lines: [{ text: timeframeText }] })
  cell(doc, ML + tc1W + tc2W, y, tc3W, tcVH, { lines: [{ text: secRepairText }] })
  y += tcVH + 10

  const partsLH2 = 18, partsVH2 = 26
  ensure(partsLH2 + partsVH2 + 16)
  cell(doc, ML, y, CW, partsLH2, { bg: LABEL_BG, lines: [{ text: 'Parts not accessible for examination:', bold: true }], valign: 'middle' })
  y += partsLH2
  cell(doc, ML, y, CW, partsVH2, { lines: [{ text: 'None, visual inspection only' }], valign: 'middle' })
  y += partsVH2 + 16

  // "We certify that" embedded image — centred
  try {
    const certImg = doc.openImage(weCertify)
    const certW = 340
    const certH = certImg.height * (certW / certImg.width)
    ensure(certH + 16)
    doc.image(certImg, ML + (CW - certW) / 2, y, { width: certW })
    y += certH + 16
  } catch (err) {
    console.error('Certify image could not be loaded:', err.message)
  }

  const cpW = Math.round(CW / 2)
  const cpLH = 26, cpVH = 70
  ensure(cpLH + cpVH + 12)
  cell(doc, ML, y, cpW, cpLH, { bg: LABEL_BG, lines: [{ text: 'Name, address and qualifications of competent person making the report:', bold: true, size: 8.5 }] })
  cell(doc, ML + cpW, y, CW - cpW, cpLH, { bg: LABEL_BG, lines: [{ text: 'Name and position of person authenticating the report:', bold: true, size: 8.5 }] })
  y += cpLH
  const cpDetails = [
    engineerName,
    'Annacurra, Aughrim,',
    'Co. Wicklow',
    inspection.examiner_cert ? `Cert No: ${inspection.examiner_cert}` : '',
  ].filter(Boolean)
  cell(doc, ML, y, cpW, cpVH, { lines: cpDetails.map((t) => ({ text: t })) })
  cell(doc, ML + cpW, y, CW - cpW, cpVH, { lines: [{ text: engineerName }, { text: 'Owner' }] })
  y += cpVH + 12

  const sigLH = 26, sigBoxH = 56
  const sigW = Math.round(CW / 2)
  ensure(sigLH + sigBoxH + 12)
  cell(doc, ML, y, sigW, sigLH, { bg: LABEL_BG, lines: [{ text: 'Signed: Competent person performing tests or thorough examination', bold: true, size: 8 }], valign: 'middle' })
  cell(doc, ML + sigW, y, CW - sigW, sigLH, { bg: LABEL_BG, lines: [{ text: 'Signed: Person receiving report of thorough examination', bold: true, size: 8 }], valign: 'middle' })
  y += sigLH
  doc.save().rect(ML, y, sigW, sigBoxH).lineWidth(0.5).strokeColor(BLACK).stroke().restore()
  if (inspection.signature?.trim()) {
    doc.save().fillColor(BLACK).fontSize(18).font('Times-Italic')
      .text(inspection.signature.trim(), ML + 8, y + 16, { width: sigW - 16, lineBreak: false }).restore()
  }
  doc.save().rect(ML + sigW, y, CW - sigW, sigBoxH).lineWidth(0.5).strokeColor(BLACK).stroke().restore()
  y += sigBoxH + 12

  doc.end()
}

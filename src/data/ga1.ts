import type { GA1Result } from './types'

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

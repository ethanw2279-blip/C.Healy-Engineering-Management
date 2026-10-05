import { useState } from 'react'
import { useStore, useCurrentUser, newId } from '../data/store'
import type { StockItem, StockLevel } from '../data/types'
import { levelOf, move, sortedLocations } from '../data/stock'

export type LevelDraft = { locationId: string; min: string; topUp: string; start: string }

// Form state and save for creating or editing a stock item, shared by the
// field sheet and the office modal. A new item's starting counts are saved as
// "stock take" movements so its history starts from day one.
export function useStockItemForm(item?: StockItem) {
  const { state, dispatch } = useStore()
  const { user } = useCurrentUser()
  const locations = sortedLocations(state)

  const [name, setName] = useState(item?.name ?? '')
  const [unit, setUnit] = useState(item?.unit ?? 'each')
  const [category, setCategory] = useState(item?.category ?? '')
  const [supplier, setSupplier] = useState(item?.supplier ?? '')
  const [cost, setCost] = useState(item?.cost != null ? String(item.cost) : '')
  const [levels, setLevels] = useState<LevelDraft[]>(() =>
    locations.map((l) => {
      const lv = item ? levelOf(state, item.id, l.id) : undefined
      return { locationId: l.id, min: lv ? String(lv.min) : '0', topUp: lv ? String(lv.topUp) : '0', start: '0' }
    }),
  )

  const setLevel = (locationId: string, key: keyof Omit<LevelDraft, 'locationId'>, value: string) =>
    setLevels((ls) => ls.map((l) => (l.locationId === locationId ? { ...l, [key]: value } : l)))

  const valid = name.trim().length > 0

  const save = () => {
    if (!valid) return
    const next: StockItem = {
      id: item?.id ?? newId('si'),
      name: name.trim(),
      unit: unit.trim() || 'each',
      category: category.trim() || undefined,
      supplier: supplier.trim() || undefined,
      cost: cost.trim() ? Number(cost) || 0 : undefined,
      active: item?.active ?? true,
      createdAt: item?.createdAt ?? new Date().toISOString(),
    }
    const lv: StockLevel[] = levels.map((l) => ({
      itemId: next.id, locationId: l.locationId, count: 0,
      min: Math.max(0, Number(l.min) || 0), topUp: Math.max(0, Number(l.topUp) || 0),
    }))
    dispatch({ type: item ? 'UPDATE_STOCK_ITEM' : 'ADD_STOCK_ITEM', item: next, levels: lv })
    if (!item) {
      const starts = levels
        .filter((l) => (Number(l.start) || 0) > 0)
        .map((l) => move(next.id, l.locationId, Number(l.start), 'counted', { employeeId: user?.id, note: 'Starting count' }))
      if (starts.length) dispatch({ type: 'STOCK_MOVEMENTS', movements: starts })
    }
  }

  return {
    locations, valid, save, levels, setLevel,
    name, setName, unit, setUnit, category, setCategory, supplier, setSupplier, cost, setCost,
    categories: [...new Set(state.stockItems.map((i) => i.category).filter(Boolean) as string[])].sort(),
    suppliers: [...new Set(state.stockItems.map((i) => i.supplier).filter(Boolean) as string[])].sort(),
  }
}

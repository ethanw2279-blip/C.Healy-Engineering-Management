import { useState } from 'react'
import { PageHeader, Button, StatusBadge, EmptyState } from '../components/ui'
import { TrashIcon } from '../../components/Icons'
import { useStore, useCurrentUser, eurExact } from '../../data/store'
import ProductModal from '../ProductModal'
import type { Product } from '../../data/types'

const LOW_STOCK = 10

export default function ShopProducts() {
  const { state, dispatch } = useStore()
  const { can } = useCurrentUser()
  const canManage = can('create:records')
  const [modal, setModal] = useState<{ editing: Product | null } | null>(null)

  const products = state.products
  const totalStockValue = products.reduce((s, p) => s + p.price * p.stock, 0)
  const lowStock = products.filter((p) => p.active && p.stock <= LOW_STOCK).length

  const remove = (e: React.MouseEvent, p: Product) => {
    e.stopPropagation()
    if (confirm(`Remove ${p.name}?`)) dispatch({ type: 'REMOVE_PRODUCT', id: p.id })
  }

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={`${products.length} products · ${eurExact(totalStockValue)} stock value${lowStock ? ` · ${lowStock} low` : ''}`}
        action={canManage && <Button onClick={() => setModal({ editing: null })}>New product</Button>}
      />

      <div className="card">
        {products.length === 0 ? (
          <EmptyState title="No products yet" hint={canManage ? 'Add your first product to start selling.' : undefined} />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th className="num">Price</th>
                <th className="num">Stock</th>
                <th>Status</th>
                {canManage && <th />}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const low = p.stock <= LOW_STOCK
                return (
                  <tr key={p.id} className={canManage ? 'clickable' : ''} onClick={() => canManage && setModal({ editing: p })}>
                    <td>
                      <div className="stack-tight">
                        <span className="cell-strong">{p.name}</span>
                        {p.description && <span className="cell-muted">{p.description}</span>}
                      </div>
                    </td>
                    <td className="cell-muted">{p.sku || '—'}</td>
                    <td className="num cell-strong">{eurExact(p.price)}</td>
                    <td className="num">
                      <span className={low ? 'stock-low' : ''}>{p.stock}</span>
                    </td>
                    <td>
                      {!p.active ? <StatusBadge status="Archived" />
                        : low ? <span className="badge badge-amber">Low stock</span>
                        : <span className="badge badge-green">In stock</span>}
                    </td>
                    {canManage && (
                      <td className="num">
                        <button className="row-remove" aria-label={`Remove ${p.name}`} onClick={(e) => remove(e, p)}>
                          <TrashIcon size={18} />
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="table-hint">Stock goes down automatically as orders come in. Products marked “Active” are the ones your website can sell.</p>

      {modal && <ProductModal editing={modal.editing} onClose={() => setModal(null)} />}
    </div>
  )
}

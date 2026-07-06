import { useState } from 'react'
import { PageHeader, Button, Modal, Field } from '../components/ui'
import { TrashIcon, CheckIcon } from '../../components/Icons'
import { useStore, newId } from '../../data/store'
import { PERMISSION_GROUPS, ALL_PERMISSION_KEYS } from '../../data/permissions'
import type { Role } from '../../data/types'

function RoleModal({ editing, onClose }: { editing: Role | null; onClose: () => void }) {
  const { dispatch } = useStore()
  const [name, setName] = useState(editing?.name ?? '')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [perms, setPerms] = useState<string[]>(
    editing ? (editing.permissions.includes('*') ? ALL_PERMISSION_KEYS : editing.permissions) : [],
  )
  const locked = !!editing?.system

  const toggle = (key: string) =>
    setPerms((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]))

  const save = () => {
    if (!name.trim()) return
    const role: Role = {
      id: editing?.id ?? newId('role_'),
      name: name.trim(),
      description: description.trim(),
      permissions: perms,
      system: editing?.system,
    }
    dispatch({ type: editing ? 'UPDATE_ROLE' : 'ADD_ROLE', role })
    onClose()
  }

  return (
    <Modal
      title={editing ? `Edit role — ${editing.name}` : 'New role'}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={locked}>{editing ? 'Save role' : 'Create role'}</Button>
        </>
      }
    >
      {locked && (
        <p className="form-hint" style={{ marginBottom: 14 }}>
          The Developer role always has full access and can&apos;t be edited.
        </p>
      )}
      <div className="field-row">
        <Field label="Role name"><input value={name} onChange={(e) => setName(e.target.value)} disabled={locked} placeholder="e.g. Supervisor" /></Field>
      </div>
      <Field label="Description"><input value={description} onChange={(e) => setDescription(e.target.value)} disabled={locked} placeholder="What this role is for" /></Field>

      <div className="perm-groups">
        {PERMISSION_GROUPS.map((g) => (
          <div key={g.group} className="perm-group">
            <div className="perm-group-title">{g.group}</div>
            {g.perms.map((p) => {
              const checked = locked || perms.includes(p.key)
              return (
                <label key={p.key} className={`perm-check ${checked ? 'on' : ''}`}>
                  <input type="checkbox" checked={checked} disabled={locked} onChange={() => toggle(p.key)} />
                  <span className="perm-box">{checked && <CheckIcon size={14} />}</span>
                  {p.label}
                </label>
              )
            })}
          </div>
        ))}
      </div>
    </Modal>
  )
}

export default function Roles() {
  const { state, dispatch } = useStore()
  const [modal, setModal] = useState<{ editing: Role | null } | null>(null)

  const memberCount = (roleId: string) => state.employees.filter((e) => e.roleId === roleId).length

  const remove = (r: Role) => {
    if (r.system) return alert("The Developer role can't be deleted.")
    const members = memberCount(r.id)
    if (members > 0) return alert(`Reassign the ${members} member(s) on "${r.name}" before deleting it.`)
    if (confirm(`Delete the "${r.name}" role?`)) dispatch({ type: 'DELETE_ROLE', id: r.id })
  }

  const permSummary = (r: Role) =>
    r.permissions.includes('*') ? 'Full access' : `${r.permissions.length} permissions`

  return (
    <div>
      <PageHeader
        title="Roles & permissions"
        subtitle="Control what each team member can see and do"
        action={<Button onClick={() => setModal({ editing: null })}>New role</Button>}
      />

      <div className="roles-grid">
        {state.roles.map((r) => (
          <div key={r.id} className="role-card">
            <div className="role-card-head">
              <h3>{r.name}</h3>
              {r.system && <span className="badge badge-green">System</span>}
            </div>
            <p className="role-desc">{r.description}</p>
            <div className="role-meta">
              <span>{permSummary(r)}</span>
              <span>·</span>
              <span>{memberCount(r.id)} member{memberCount(r.id) === 1 ? '' : 's'}</span>
            </div>
            <div className="role-actions">
              <Button size="sm" variant="secondary" onClick={() => setModal({ editing: r })}>
                {r.system ? 'View' : 'Edit'}
              </Button>
              {!r.system && (
                <button className="row-remove" aria-label={`Delete ${r.name}`} onClick={() => remove(r)}>
                  <TrashIcon size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {modal && <RoleModal editing={modal.editing} onClose={() => setModal(null)} />}
    </div>
  )
}

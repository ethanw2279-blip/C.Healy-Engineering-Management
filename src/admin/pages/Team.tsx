import { useState } from 'react'
import { PageHeader, Avatar, StatusBadge, Button, Modal, Field, EmptyState } from '../components/ui'
import { TrashIcon } from '../../components/Icons'
import { useStore, useCurrentUser, eur, newId } from '../../data/store'
import type { Employee } from '../../data/types'

const COLORS = ['#1F8A4C', '#2F86EB', '#C7791C', '#7A2B3A', '#5B4FB5', '#0E7C7B', '#B5482E']

function MemberModal({ editing, onClose }: { editing: Employee | null; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const [f, setF] = useState<Employee>(
    editing ?? {
      id: newId('e'),
      name: '',
      roleId: state.roles.find((r) => !r.system)?.id ?? state.roles[0].id,
      email: '',
      phone: '',
      hourlyRate: 0,
      color: COLORS[state.employees.length % COLORS.length],
      active: true,
    },
  )
  const set = (patch: Partial<Employee>) => setF({ ...f, ...patch })

  const save = () => {
    if (!f.name.trim()) return
    dispatch({ type: editing ? 'UPDATE_EMPLOYEE' : 'ADD_EMPLOYEE', employee: f })
    onClose()
  }

  return (
    <Modal
      title={editing ? 'Edit team member' : 'Add team member'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>{editing ? 'Save changes' : 'Add member'}</Button>
        </>
      }
    >
      <Field label="Name"><input value={f.name} onChange={(e) => set({ name: e.target.value })} autoFocus /></Field>
      <div className="field-row">
        <Field label="Email"><input value={f.email} onChange={(e) => set({ email: e.target.value })} /></Field>
        <Field label="Phone"><input value={f.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
      </div>
      <div className="field-row">
        <Field label="Role">
          <select value={f.roleId} onChange={(e) => set({ roleId: e.target.value })}>
            {state.roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Hourly rate (€)">
          <input type="number" min={0} value={f.hourlyRate} onChange={(e) => set({ hourlyRate: Number(e.target.value) })} />
        </Field>
      </div>
      <Field label="Status">
        <select value={f.active ? 'active' : 'archived'} onChange={(e) => set({ active: e.target.value === 'active' })}>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </Field>
    </Modal>
  )
}

export default function Team() {
  const { state, dispatch } = useStore()
  const { user, can } = useCurrentUser()
  const [modal, setModal] = useState<{ editing: Employee | null } | null>(null)

  const roleName = (id: string) => state.roles.find((r) => r.id === id)?.name ?? 'No role'
  const isDeveloper = (e: Employee) => state.roles.find((r) => r.id === e.roleId)?.system
  const developerCount = state.employees.filter((e) => isDeveloper(e)).length
  const hoursFor = (id: string) =>
    state.timeEntries.filter((t) => t.employeeId === id).reduce((s, t) => s + t.hours, 0)

  const remove = (e: Employee) => {
    if (e.id === user?.id) return alert("You can't remove yourself.")
    if (isDeveloper(e) && developerCount <= 1) return alert('Keep at least one Developer.')
    if (confirm(`Remove ${e.name} from the team?`)) dispatch({ type: 'REMOVE_EMPLOYEE', id: e.id })
  }

  return (
    <div>
      <PageHeader
        title="Team"
        subtitle={`${state.employees.filter((e) => e.active).length} active members`}
        action={can('manage:team') && <Button onClick={() => setModal({ editing: null })}>Add team member</Button>}
      />

      <div className="card">
        {state.employees.length === 0 ? (
          <EmptyState title="No team members" hint="Add your first team member." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Contact</th>
                <th className="num">Rate</th>
                <th className="num">Hours (wk)</th>
                <th>Status</th>
                {can('manage:team') && <th />}
              </tr>
            </thead>
            <tbody>
              {state.employees.map((e) => (
                <tr key={e.id} className={can('manage:team') ? 'clickable' : ''} onClick={() => can('manage:team') && setModal({ editing: e })}>
                  <td>
                    <div className="cell-with-avatar">
                      <Avatar name={e.name} color={e.color} size={34} />
                      <span className="cell-strong">{e.name}{e.id === user?.id ? ' (you)' : ''}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-grey">{roleName(e.roleId)}</span></td>
                  <td>
                    <div className="stack-tight">
                      <span>{e.email}</span>
                      <span className="cell-muted">{e.phone}</span>
                    </div>
                  </td>
                  <td className="num cell-muted">{e.hourlyRate ? `${eur(e.hourlyRate)}/h` : '—'}</td>
                  <td className="num cell-strong">{hoursFor(e.id)}h</td>
                  <td><StatusBadge status={e.active ? 'Active' : 'Archived'} /></td>
                  {can('manage:team') && (
                    <td className="num">
                      <button
                        className="row-remove"
                        aria-label={`Remove ${e.name}`}
                        onClick={(ev) => { ev.stopPropagation(); remove(e) }}
                      >
                        <TrashIcon size={18} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {can('manage:team') && <p className="table-hint">Tip: click a member to edit their details and role.</p>}

      {modal && <MemberModal editing={modal.editing} onClose={() => setModal(null)} />}
    </div>
  )
}

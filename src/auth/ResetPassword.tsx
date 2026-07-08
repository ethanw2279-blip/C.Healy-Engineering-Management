import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './AuthProvider'
import './Login.css'

export default function ResetPassword() {
  const { clearRecovery } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) setError(error.message)
      else setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">
          <span className="login-mark">J</span>
          <div>
            <strong>Jobber</strong>
            <span>Ethan Whitney Detailing</span>
          </div>
        </div>
        <h1 className="login-title">Set a new password</h1>

        {done ? (
          <>
            <div className="login-notice">Password updated. You&apos;re all set.</div>
            <button type="button" className="login-btn" onClick={clearRecovery}>Continue to app</button>
          </>
        ) : (
          <>
            <label className="login-field">
              <span>New password</span>
              <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoFocus />
            </label>
            {error && <div className="login-error">{error}</div>}
            <button className="login-btn" type="submit" disabled={loading}>{loading ? 'Saving…' : 'Update password'}</button>
          </>
        )}
      </form>
    </div>
  )
}

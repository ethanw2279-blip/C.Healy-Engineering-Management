import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './Login.css'

type Mode = 'signin' | 'signup' | 'forgot'

export default function Login() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setLoading(true)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) setError(error.message)
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) setError(error.message)
        else if (!data.session) setNotice('Account created. Check your email to confirm, then sign in.')
        // If a session is returned, the AuthProvider swaps to the app.
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        })
        if (error) setError(error.message)
        else setNotice('If that email has an account, a password-reset link is on its way.')
      }
    } catch (err) {
      console.error('Auth failed', err)
      setError(
        err instanceof Error
          ? `${err.message} — the app couldn't reach Supabase. Check the URL/key env vars and that the project isn't paused.`
          : 'Something went wrong.',
      )
    } finally {
      setLoading(false)
    }
  }

  const title = mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Reset password'
  const cta = mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'

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

        <h1 className="login-title">{title}</h1>

        <label className="login-field">
          <span>Email</span>
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>

        {mode !== 'forgot' && (
          <label className="login-field">
            <span>Password</span>
            <input
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>
        )}

        {error && <div className="login-error">{error}</div>}
        {notice && <div className="login-notice">{notice}</div>}

        <button className="login-btn" type="submit" disabled={loading}>
          {loading ? 'Please wait…' : cta}
        </button>

        <div className="login-links">
          {mode === 'signin' && (
            <>
              <button type="button" onClick={() => { setMode('forgot'); setError(null); setNotice(null) }}>Forgot password?</button>
              <button type="button" onClick={() => { setMode('signup'); setError(null); setNotice(null) }}>Create account</button>
            </>
          )}
          {mode !== 'signin' && (
            <button type="button" onClick={() => { setMode('signin'); setError(null); setNotice(null) }}>← Back to sign in</button>
          )}
        </div>
      </form>
    </div>
  )
}

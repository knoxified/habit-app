import { useState } from 'react'
import { supabase } from './supabase.js'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setBusy(false)
    if (err) {
      setError(err.message)
    } else {
      try {
        localStorage.setItem('habit-authed', '1')
      } catch {
        /* ignore */
      }
    }
  }

  const input = {
    display: 'block',
    width: '100%',
    padding: 14,
    marginBottom: 12,
    borderRadius: 12,
    border: '1px solid var(--muted)',
    background: 'var(--card)',
    color: 'var(--text)',
    fontSize: 16,
    fontFamily: 'inherit',
  }

  return (
    <form onSubmit={submit} style={{ paddingTop: 60 }}>
      <div style={{ fontSize: 56, textAlign: 'center' }}>🔥</div>
      <h1 style={{ textAlign: 'center', marginBottom: 24 }}>Habits</h1>
      <input
        type="email"
        autoComplete="username"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={input}
      />
      <input
        type="password"
        autoComplete="current-password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={input}
      />
      {error && <div style={{ color: 'var(--energy)', marginBottom: 12 }}>{error}</div>}
      <button
        type="submit"
        disabled={busy}
        style={{
          width: '100%',
          border: 'none',
          borderRadius: 12,
          padding: 16,
          fontSize: 17,
          fontWeight: 800,
          cursor: 'pointer',
          background: 'var(--warm)',
          color: '#0f1420',
          opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  )
}
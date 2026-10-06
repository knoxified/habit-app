import { useState, useEffect } from 'react'
import { computeRace } from './bots.js'

const ord = (n) => ['1st', '2nd', '3rd', '4th'][n - 1] || `${n}th`

export default function Race({ data, today }) {
  const [now, setNow] = useState(() => new Date())
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])

  const race = computeRace(data, today, now)
  const you = race.rows.find((r) => r.isYou)
  const above = race.rows[race.rank - 2]
  const leading = race.rank === 1

  const message = leading
    ? you.points > 0
      ? "You're in the lead 🔥"
      : 'Finish a task to take the lead'
    : `${above.name} is ${above.points - you.points} pts ahead`

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          border: `1px solid ${leading ? 'var(--done)' : 'var(--line)'}`,
          background: 'var(--card)',
          color: leading ? 'var(--done)' : 'var(--text)',
          borderRadius: 20,
          padding: '8px 14px',
          fontSize: 14,
          fontWeight: 800,
          cursor: 'pointer',
        }}
      >
        🏁 {ord(race.rank)} <span style={{ fontSize: 10 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 30 }}
          />
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              width: 300,
              maxWidth: 'calc(100vw - 32px)',
              zIndex: 31,
              background: 'var(--card)',
              border: '1px solid var(--line)',
              borderRadius: 16,
              padding: 16,
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 2 }}>Today's race</div>
            <div
              style={{
                fontSize: 13,
                marginBottom: 12,
                color: leading ? 'var(--done)' : 'var(--muted)',
              }}
            >
              {message}
            </div>
            {race.rows.map((r) => (
              <div
                key={r.id}
                style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}
              >
                <div style={{ width: 22, textAlign: 'center' }}>{r.emoji}</div>
                <div
                  style={{
                    width: 90,
                    fontSize: 13,
                    fontWeight: r.isYou ? 800 : 500,
                    color: r.isYou ? 'var(--warm)' : 'var(--text)',
                  }}
                >
                  {r.name}
                </div>
                <div style={{ flex: 1, background: 'var(--bg)', borderRadius: 6, height: 8 }}>
                  <div
                    style={{
                      width: `${Math.min(100, (r.points / race.max) * 100)}%`,
                      height: '100%',
                      borderRadius: 6,
                      background: r.isYou ? 'var(--warm)' :
import { useState, useEffect } from 'react'
import { computeRace } from './bots.js'

const ord = (n) => ['1st', '2nd', '3rd', '4th'][n - 1] || `${n}th`

export default function Race({ data, today }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])

  const race = computeRace(data, today, now)
  const you = race.rows.find((r) => r.isYou)
  const above = race.rows[race.rank - 2]

  const message =
    race.rank === 1
      ? you.points > 0
        ? "You're in the lead 🔥"
        : 'Finish a task to take the lead'
      : `${ord(race.rank)} place · ${above.name} is ${above.points - you.points} pts ahead`

  return (
    <div style={{ background: 'var(--card)', borderRadius: 16, padding: 16, marginBottom: 14 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 12,
        }}
      >
        <div style={{ fontWeight: 800 }}>Today's race</div>
        <div style={{ fontSize: 13, color: race.rank === 1 ? 'var(--done)' : 'var(--muted)' }}>
          {message}
        </div>
      </div>
      {race.rows.map((r) => (
        <div
          key={r.id}
          style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}
        >
          <div style={{ width: 24, textAlign: 'center' }}>{r.emoji}</div>
          <div
            style={{
              width: 92,
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
                background: r.isYou ? 'var(--warm)' : '#4a5578',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
          <div style={{ width: 28, textAlign: 'right', fontSize: 13, fontWeight: 700 }}>
            {r.points}
          </div>
        </div>
      ))}
    </div>
  )
}
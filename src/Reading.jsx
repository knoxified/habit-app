import { useState, useEffect } from 'react'

const TOTAL = 600 // 10 minutes
const KEY = 'reading-end'
const STALE_MS = 12 * 60 * 60 * 1000

const readEnd = () => {
  try {
    const v = Number(localStorage.getItem(KEY))
    if (!v) return null
    if (Date.now() > v + STALE_MS) {
      localStorage.removeItem(KEY)
      return null
    }
    return v
  } catch {
    return null
  }
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

const chime = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 660
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 2.1)
  } catch {
    /* ignore */
  }
}

export default function Reading({ onComplete, onSaveLine, onClose, initialLine }) {
  const [endAt, setEndAt] = useState(readEnd)
  const [now, setNow] = useState(Date.now())
  const [completed, setCompleted] = useState(false)
  const [line, setLine] = useState(initialLine || '')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!endAt) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [endAt])

  useEffect(() => {
    const onVisible = () => setNow(Date.now())
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  useEffect(() => {
    if (endAt && now >= endAt) {
      try {
        localStorage.removeItem(KEY)
      } catch {
        /* ignore */
      }
      setEndAt(null)
      setCompleted(true)
      chime()
      onComplete()
    }
  }, [now, endAt])

  const start = () => {
    const end = Date.now() + TOTAL * 1000
    try {
      localStorage.setItem(KEY, String(end))
    } catch {
      /* ignore */
    }
    setNow(Date.now())
    setEndAt(end)
  }

  const reset = () => {
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* ignore */
    }
    setEndAt(null)
  }

  const saveLine = () => {
    onSaveLine(line.trim())
    setSaved(true)
  }

  const remaining = endAt ? Math.max(0, Math.ceil((endAt - now) / 1000)) : TOTAL
  const progress = endAt ? ((TOTAL - remaining) / TOTAL) * 100 : 0

  const message = completed
    ? 'Done. Well read.'
    : endAt
    ? 'Keep reading. You can switch to your book and come back.'
    : 'Ready when you are'

  const btn = {
    border: 'none',
    borderRadius: 12,
    padding: '14px 28px',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <button
        onClick={onClose}
        style={{ ...btn, background: 'transparent', color: 'var(--muted)', float: 'left', padding: 8 }}
      >
        ← Back
      </button>
      <h1 style={{ clear: 'both', paddingTop: 24, marginBottom: 8 }}>Read</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 32 }}>{message}</p>

      <div style={{ fontSize: 72, fontWeight: 700, color: 'var(--warm)', marginBottom: 24 }}>
        {completed ? '0:00' : fmt(remaining)}
      </div>

      <div style={{ background: 'var(--card)', borderRadius: 8, height: 8, marginBottom: 32 }}>
        <div
          style={{
            width: `${completed ? 100 : progress}%`,
            height: '100%',
            borderRadius: 8,
            background: 'var(--warm)',
            transition: 'width 0.25s linear',
          }}
        />
      </div>

      {completed ? (
        <div style={{ textAlign: 'left' }}>
          <label style={{ color: 'var(--muted)', fontSize: 14 }}>
            One line you learnt from today's reading
          </label>
          <textarea
            value={line}
            onChange={(e) => {
              setLine(e.target.value)
              setSaved(false)
            }}
            rows={3}
            style={{
              width: '100%',
              marginTop: 8,
              marginBottom: 12,
              padding: 12,
              borderRadius: 12,
              border: '1px solid var(--muted)',
              background: 'var(--card)',
              color: 'var(--text)',
              fontSize: 16,
              fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={saveLine}
              style={{ ...btn, background: 'var(--warm)', color: '#0f1420', flex: 1 }}
            >
              {saved ? 'Saved ✓' : 'Save line'}
            </button>
            <button
              onClick={onClose}
              style={{ ...btn, background: 'var(--done)', color: '#0f1420', flex: 1 }}
            >
              Back to Today
            </button>
          </div>
        </div>
      ) : !endAt ? (
        <button onClick={start} style={{ ...btn, background: 'var(--warm)', color: '#0f1420' }}>
          Start
        </button>
      ) : (
        <button onClick={reset} style={{ ...btn, background: 'var(--card)', color: 'var(--text)' }}>
          Reset
        </button>
      )}
    </div>
  )
}
import { useState, useEffect, useRef } from 'react'

const TOTAL = 320 // 20s settle-in + 5:00 meditation
const SETTLE = 20
const KEY = 'meditation-end'
const STALE_MS = 10 * 60 * 1000

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

export default function Meditation({ onComplete, onClose }) {
  const [endAt, setEndAt] = useState(readEnd)
  const [now, setNow] = useState(Date.now())
  const [completed, setCompleted] = useState(false)
  const audioRef = useRef(null)
  const lockRef = useRef(null)

  const chime = () => {
    try {
      const ctx =
        audioRef.current || new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 528
      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.5)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 2.6)
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (!endAt) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [endAt])

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

  useEffect(
    () => () => {
      lockRef.current?.release?.()
    },
    []
  )

  const start = async () => {
    const end = Date.now() + TOTAL * 1000
    try {
      localStorage.setItem(KEY, String(end))
    } catch {
      /* ignore */
    }
    setNow(Date.now())
    setEndAt(end)
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (Ctx && !audioRef.current) audioRef.current = new Ctx()
      if (audioRef.current?.state === 'suspended') audioRef.current.resume()
    } catch {
      /* ignore */
    }
    try {
      lockRef.current = await navigator.wakeLock?.request('screen')
    } catch {
      /* ignore */
    }
  }

  const reset = () => {
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* ignore */
    }
    lockRef.current?.release?.()
    setEndAt(null)
  }

  const remaining = endAt ? Math.max(0, Math.ceil((endAt - now) / 1000)) : TOTAL
  const settling = endAt && TOTAL - remaining < SETTLE
  const progress = endAt ? ((TOTAL - remaining) / TOTAL) * 100 : 0

  const message = completed
    ? 'Done. Well done.'
    : !endAt
    ? 'Ready when you are'
    : settling
    ? 'Settle in...'
    : 'Breathe'

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
      <h1 style={{ clear: 'both', paddingTop: 24, marginBottom: 8 }}>Meditate</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 32 }}>{message}</p>

      <div style={{ fontSize: 72, fontWeight: 700, color: 'var(--calm)', marginBottom: 24 }}>
        {completed ? '0:00' : fmt(remaining)}
      </div>

      <div style={{ background: 'var(--card)', borderRadius: 8, height: 8, marginBottom: 32 }}>
        <div
          style={{
            width: `${completed ? 100 : progress}%`,
            height: '100%',
            borderRadius: 8,
            background: 'var(--calm)',
            transition: 'width 0.25s linear',
          }}
        />
      </div>

      {completed ? (
        <button onClick={onClose} style={{ ...btn, background: 'var(--done)', color: '#0f1420' }}>
          Back to Today
        </button>
      ) : !endAt ? (
        <button onClick={start} style={{ ...btn, background: 'var(--calm)', color: '#0f1420' }}>
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
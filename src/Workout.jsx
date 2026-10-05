import { useState, useEffect, useRef } from 'react'

const PUSH = 20
const TRI = 10
const PLANK = 60
const READY_MS = 3000
const PACE_KEY = 'workout-pace'

const loadPace = () => {
  try {
    const v = Number(localStorage.getItem(PACE_KEY))
    return v === 1500 || v === 2000 ? v : 2000
  } catch {
    return 2000
  }
}

export default function Workout({ parts, onPart, onClose }) {
  const [pace, setPace] = useState(loadPace)
  const [active, setActive] = useState(null) // 'push' | 'tri' | 'plank' | null
  const [startAt, setStartAt] = useState(0)
  const [now, setNow] = useState(Date.now())
  const audioRef = useRef(null)
  const lockRef = useRef(null)
  const lastCount = useRef(0)

  const beep = (freq = 780, dur = 0.12, vol = 0.2) => {
    try {
      const ctx = audioRef.current
      if (!ctx) return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = freq
      gain.gain.setValueAtTime(vol, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + dur + 0.02)
    } catch {
      /* ignore */
    }
  }

  const stop = () => {
    lockRef.current?.release?.()
    lockRef.current = null
    setActive(null)
  }

  const finish = (key) => {
    onPart(key, true)
    beep(528, 0.9, 0.3)
    stop()
  }

  const begin = async (which) => {
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
    lastCount.current = 0
    setStartAt(Date.now() + READY_MS)
    setNow(Date.now())
    setActive(which)
  }

  const changePace = (ms) => {
    setPace(ms)
    try {
      localStorage.setItem(PACE_KEY, String(ms))
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [active])

  useEffect(() => {
    if (!active) return
    if (active === 'plank') {
      if (now >= startAt + PLANK * 1000) finish('plank')
      return
    }
    const target = active === 'push' ? PUSH : TRI
    const c = now < startAt ? 0 : Math.min(target, Math.floor((now - startAt) / pace) + 1)
    if (c > lastCount.current) {
      lastCount.current = c
      beep(c % 5 === 0 ? 1100 : 780)
    }
    if (c >= target) finish(active)
  }, [now])

  useEffect(
    () => () => {
      lockRef.current?.release?.()
    },
    []
  )

  const readySecs = active && now < startAt ? Math.ceil((startAt - now) / 1000) : 0
  const repCount =
    active && active !== 'plank' && now >= startAt
      ? Math.min(active === 'push' ? PUSH : TRI, Math.floor((now - startAt) / pace) + 1)
      : 0
  const plankLeft =
    active === 'plank' && now >= startAt
      ? Math.max(0, Math.ceil(PLANK - (now - startAt) / 1000))
      : PLANK

  const doneCount = [parts.push, parts.tri, parts.plank].filter(Boolean).length
  const allDone = doneCount === 3

  const btn = {
    border: 'none',
    borderRadius: 12,
    padding: '12px 20px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  }

  const items = [
    { key: 'push', label: 'Pushups', detail: `${PUSH} reps` },
    { key: 'tri', label: 'Triceps extensions', detail: `${TRI} reps` },
    { key: 'plank', label: 'Plank', detail: `${PLANK} seconds` },
  ]

  return (
    <div>
      <button
        onClick={onClose}
        style={{ ...btn, background: 'transparent', color: 'var(--muted)', padding: 8 }}
      >
        ← Back
      </button>
      <h1 style={{ marginTop: 8, marginBottom: 4 }}>Workout</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 12 }}>{doneCount} of 3 done</p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 8,
              borderRadius: 8,
              background: i < doneCount ? 'var(--done)' : 'var(--card)',
              transition: 'background 0.4s ease',
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <span style={{ color: 'var(--muted)', fontSize: 14 }}>Pace:</span>
        {[2000, 1500].map((ms) => (
          <button
            key={ms}
            disabled={!!active}
            onClick={() => changePace(ms)}
            style={{
              ...btn,
              padding: '8px 14px',
              background: pace === ms ? 'var(--energy)' : 'var(--card)',
              color: pace === ms ? '#0f1420' : 'var(--text)',
              opacity: active ? 0.5 : 1,
            }}
          >
            {ms / 1000}s
          </button>
        ))}
      </div>

      {items.map((it) => {
        const done = !!parts[it.key]
        const running = active === it.key
        return (
          <div
            key={it.key}
            style={{
              background: 'var(--card)',
              borderLeft: `5px solid ${done ? 'var(--done)' : 'var(--energy)'}`,
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              opacity: done ? 0.7 : 1,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{it.label}</div>
                <div style={{ color: 'var(--muted)', fontSize: 14 }}>{it.detail}</div>
              </div>
              {done && <span style={{ color: 'var(--done)', fontSize: 22 }}>✓</span>}
            </div>

            {running && (
              <div style={{ textAlign: 'center', margin: '16px 0' }}>
                {readySecs > 0 ? (
                  <div style={{ fontSize: 56, fontWeight: 700, color: 'var(--warm)' }}>
                    {readySecs}
                  </div>
                ) : it.key === 'plank' ? (
                  <div style={{ fontSize: 56, fontWeight: 700, color: 'var(--energy)' }}>
                    {plankLeft}s
                  </div>
                ) : (
                  <div style={{ fontSize: 56, fontWeight: 700, color: 'var(--energy)' }}>
                    {repCount}
                    <span style={{ fontSize: 24, color: 'var(--muted)' }}>
                      {' '}
                      / {it.key === 'push' ? PUSH : TRI}
                    </span>
                  </div>
                )}
                <div style={{ color: 'var(--muted)', fontSize: 14 }}>
                  {readySecs > 0 ? 'Get ready' : 'Keep going'}
                </div>
              </div>
            )}

            {!done && (
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                {running ? (
                  <button
                    onClick={stop}
                    style={{ ...btn, background: 'var(--bg)', color: 'var(--text)', flex: 1 }}
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    disabled={!!active}
                    onClick={() => begin(it.key)}
                    style={{
                      ...btn,
                      background: 'var(--energy)',
                      color: '#0f1420',
                      flex: 1,
                      opacity: active ? 0.5 : 1,
                    }}
                  >
                    Start
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}

      <div style={{ marginTop: 20 }}>
        <label style={{ color: 'var(--muted)', fontSize: 14 }}>
          Extra reps today (optional)
        </label>
        <input
          type="number"
          min="0"
          value={parts.extra ?? ''}
          onChange={(e) => onPart('extra', Number(e.target.value))}
          style={{
            display: 'block',
            width: '100%',
            marginTop: 8,
            padding: 12,
            borderRadius: 12,
            border: '1px solid var(--muted)',
            background: 'var(--card)',
            color: 'var(--text)',
            fontSize: 16,
          }}
        />
      </div>

      {allDone && (
        <button
          onClick={onClose}
          style={{
            ...btn,
            background: 'var(--done)',
            color: '#0f1420',
            width: '100%',
            marginTop: 20,
          }}
        >
          Workout complete. Back to Today
        </button>
      )}
    </div>
  )
}
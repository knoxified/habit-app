import { useState, useRef, useEffect } from 'react'
import { INSIGHTS } from './insights.js'

const roll = (seen) => {
  const r = Math.random()
  const xp = r < 0.6 ? 10 : r < 0.85 ? 25 : r < 0.95 ? 50 : 100
  const unseen = INSIGHTS.filter((i) => !seen.has(i.id))
  const pool = unseen.length ? unseen : INSIGHTS
  const insight = pool[Math.floor(Math.random() * pool.length)]
  return { xp, insightId: insight.id, rare: xp >= 50 }
}

const playOpen = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = new Ctx()
    ;[523, 659, 784, 1047].forEach((f, i) => {
      const t = ctx.currentTime + 0.8 + i * 0.12
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = f
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.7)
    })
  } catch {
    /* ignore */
  }
}

export default function Chest({ seen, chest, onOpen, onClose }) {
  const [phase, setPhase] = useState(chest ? 'revealed' : 'idle')
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const open = () => {
    if (chest || phase !== 'idle') return
    playOpen()
    onOpen(roll(seen))
    setPhase('shaking')
    timer.current = setTimeout(() => setPhase('revealed'), 900)
  }

  const insight = chest ? INSIGHTS.find((i) => i.id === chest.insightId) : null
  const text = insight?.text || chest?.quote || ''
  const tag = insight?.tag || 'Note'

  const overlay = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(8,11,18,0.88)',
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  }
  const card = {
    background: 'var(--card)',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    textAlign: 'center',
  }
  const btn = {
    border: 'none',
    borderRadius: 12,
    padding: '14px 24px',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    background: 'var(--warm)',
    color: '#0f1420',
    width: '100%',
    marginTop: 16,
  }

  return (
    <div style={overlay}>
      <style>{`
        @keyframes chest-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        @keyframes chest-shake {
          0%,100% { transform: rotate(0); }
          20% { transform: rotate(-12deg); }
          40% { transform: rotate(12deg); }
          60% { transform: rotate(-10deg); }
          80% { transform: rotate(10deg); }
        }
      `}</style>

      {phase === 'idle' && (
        <div style={{ ...card, cursor: 'pointer' }} onClick={open}>
          <div style={{ fontSize: 80, animation: 'chest-pulse 1.6s ease-in-out infinite' }}>🎁</div>
          <div style={{ fontWeight: 700, fontSize: 20, marginTop: 8 }}>Perfect Day!</div>
          <div style={{ color: 'var(--muted)', marginTop: 4 }}>Tap to open your chest</div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            style={{ ...btn, background: 'transparent', color: 'var(--muted)', fontWeight: 600 }}
          >
            Later
          </button>
        </div>
      )}

      {phase === 'shaking' && (
        <div style={card}>
          <div style={{ fontSize: 80, animation: 'chest-shake 0.9s ease' }}>🎁</div>
          <div style={{ color: 'var(--muted)', marginTop: 8 }}>Opening...</div>
        </div>
      )}

      {phase === 'revealed' && chest && (
        <div style={card}>
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Perfect Day chest</div>
          <div style={{ fontSize: 44, fontWeight: 800, color: 'var(--warm)', margin: '4px 0' }}>
            +{chest.xp} XP
          </div>
          {chest.rare && (
            <div style={{ color: 'var(--warm)', fontWeight: 700, marginBottom: 8 }}>Rare find!</div>
          )}
          <div
            style={{
              background: 'var(--bg)',
              borderRadius: 14,
              padding: 16,
              marginTop: 8,
              textAlign: 'left',
            }}
          >
            <div style={{ color: 'var(--calm)', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              NEW INSIGHT · {tag.toUpperCase()}
            </div>
            <div style={{ fontSize: 15, lineHeight: 1.5 }}>{text}</div>
          </div>
          <button onClick={onClose} style={btn}>
            Collect
          </button>
        </div>
      )}
    </div>
  )
}
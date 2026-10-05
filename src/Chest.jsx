import { useState, useRef, useEffect } from 'react'

const QUOTES = [
  'Small things done daily become who you are.',
  'You showed up. That is the whole game.',
  'Consistency is quiet, and it compounds.',
  'Today you kept a promise to yourself.',
  'Every finished day is a vote for who you are becoming.',
  'Momentum starts with one small, finished thing.',
  'Focus is a muscle, and you just trained it.',
  'Your future self just said thank you.',
]

const roll = () => {
  const r = Math.random()
  const xp = r < 0.6 ? 10 : r < 0.85 ? 25 : r < 0.95 ? 50 : 100
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)]
  return { xp, quote, rare: xp >= 50 }
}

const playOpen = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = new Ctx()
    const notes = [523, 659, 784, 1047]
    notes.forEach((f, i) => {
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

export default function Chest({ unlocked, chest, onOpen }) {
  const [phase, setPhase] = useState(chest ? 'revealed' : 'idle')
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const open = () => {
    if (chest || phase !== 'idle') return
    const reward = roll()
    playOpen()
    onOpen(reward)
    setPhase('shaking')
    timer.current = setTimeout(() => setPhase('revealed'), 900)
  }

  const card = {
    background: 'var(--card)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 12,
    textAlign: 'center',
  }

  const styles = (
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
  )

  if (phase === 'revealed' && chest) {
    return (
      <div style={{ ...card, borderLeft: `5px solid ${chest.rare ? 'var(--warm)' : 'var(--done)'}` }}>
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>Perfect Day chest</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--warm)', margin: '4px 0' }}>
          +{chest.xp} XP
        </div>
        {chest.rare && (
          <div style={{ color: 'var(--warm)', fontWeight: 600, marginBottom: 4 }}>Rare find!</div>
        )}
        <div style={{ color: 'var(--text)', fontSize: 15 }}>{chest.quote}</div>
      </div>
    )
  }

  if (phase === 'shaking') {
    return (
      <div style={card}>
        {styles}
        <div style={{ fontSize: 64, animation: 'chest-shake 0.9s ease' }}>🎁</div>
        <div style={{ color: 'var(--muted)' }}>Opening...</div>
      </div>
    )
  }

  if (unlocked) {
    return (
      <div onClick={open} style={{ ...card, cursor: 'pointer' }}>
        {styles}
        <div style={{ fontSize: 64, animation: 'chest-pulse 1.6s ease-in-out infinite' }}>🎁</div>
        <div style={{ fontWeight: 600 }}>Perfect Day. Tap to open your chest</div>
      </div>
    )
  }

  return (
    <div style={{ ...card, opacity: 0.8 }}>
      <div style={{ fontSize: 36 }}>🔒</div>
      <div style={{ fontWeight: 600 }}>Perfect Day chest</div>
      <div style={{ color: 'var(--muted)', fontSize: 14 }}>Finish all four tasks to unlock it</div>
    </div>
  )
}
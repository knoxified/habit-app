import { useState, useEffect, useRef } from 'react'
import Meditation from './Meditation.jsx'
import Reading from './Reading.jsx'
import Workout from './Workout.jsx'
import Journal from './Journal.jsx'
import JournalHistory from './JournalHistory.jsx'
import Chest from './Chest.jsx'
import Commitment from './Commitment.jsx'
import { computeStats } from './stats.js'

const tasks = [
  { id: 'meditate', label: 'Meditate', detail: '5:20', color: 'var(--calm)' },
  { id: 'workout', label: 'Workout', detail: 'Pushups, triceps, plank', color: 'var(--energy)' },
  { id: 'read', label: 'Read', detail: '10:00', color: 'var(--warm)' },
  { id: 'journal', label: 'Journal', detail: '4 prompts', color: 'var(--calm)' },
]

const todayKey = () => {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

const load = () => {
  try {
    return JSON.parse(localStorage.getItem('habit-data')) || {}
  } catch {
    return {}
  }
}

const initialScreen = () => {
  try {
    if (localStorage.getItem('reading-end')) return 'read'
  } catch {
    /* ignore */
  }
  return null
}

const linkBtn = {
  border: 'none',
  background: 'transparent',
  color: 'var(--calm)',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  padding: 8,
}

export default function App() {
  const [data, setData] = useState(load)
  const [screen, setScreen] = useState(initialScreen)
  const fileRef = useRef(null)
  const today = todayKey()
  const doneToday = data[today] || {}

  useEffect(() => {
    try {
      localStorage.setItem('habit-data', JSON.stringify(data))
    } catch {
      // storage unavailable, ignore
    }
  }, [data])

  const setField = (key, value) =>
    setData((prev) => {
      const day = prev[today] || {}
      return { ...prev, [today]: { ...day, [key]: value } }
    })

  const setPart = (key, value) =>
    setData((prev) => {
      const day = prev[today] || {}
      const wo = { ...(day.wo || {}), [key]: value }
      const all = !!(wo.push && wo.tri && wo.plank)
      return { ...prev, [today]: { ...day, wo, workout: all } }
    })

  const setJournal = (key, value) =>
    setData((prev) => {
      const day = prev[today] || {}
      const jr = { ...(day.jr || {}), [key]: value }
      const done = !!(
        (jr.grateful || '').trim() &&
        (jr.learnt || '').trim() &&
        (jr.improve || '').trim()
      )
      return { ...prev, [today]: { ...day, jr, journal: done } }
    })

  const onCardClick = (id) => {
    if (id === 'journal') {
      setScreen('journal')
      return
    }
    if (id === 'meditate' || id === 'read' || id === 'workout') {
      if (!doneToday[id]) setScreen(id)
      return
    }
    setField(id, !doneToday[id])
  }

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `habit-backup-${today}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importData = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result)
        const ok =
          obj &&
          typeof obj === 'object' &&
          !Array.isArray(obj) &&
          Object.keys(obj).every((k) => /^\d{4}-\d{2}-\d{2}$/.test(k))
        if (!ok) {
          alert('That file is not a valid habit backup.')
          return
        }
        if (window.confirm('Replace all current data with this backup?')) setData(obj)
      } catch {
        alert('Could not read that file.')
      }
    }
    reader.readAsText(file)
  }

  if (screen === 'meditate') {
    return (
      <Meditation
        onComplete={() => setField('meditate', true)}
        onClose={() => setScreen(null)}
      />
    )
  }

  if (screen === 'read') {
    return (
      <Reading
        initialLine={doneToday.readingLine}
        onComplete={() => setField('read', true)}
        onSaveLine={(text) => setField('readingLine', text)}
        onClose={() => setScreen(null)}
      />
    )
  }

  if (screen === 'workout') {
    return (
      <Workout
        parts={doneToday.wo || {}}
        onPart={setPart}
        onClose={() => setScreen(null)}
      />
    )
  }

  if (screen === 'journal') {
    return (
      <Journal
        entry={doneToday.jr || {}}
        readingLine={doneToday.readingLine}
        onChange={setJournal}
        onClose={() => setScreen(null)}
        onHistory={() => setScreen('history')}
      />
    )
  }

  if (screen === 'history') {
    return <JournalHistory data={data} onClose={() => setScreen(null)} />
  }

  const stats = computeStats(data, today)
  const count = tasks.filter((t) => doneToday[t.id]).length
  const allDone = count === tasks.length
  const next = tasks.find((t) => !doneToday[t.id])

  const streakMessage = stats.todayCounted
    ? 'Streak safe for today ✓'
    : stats.lightLeft > 0
    ? 'Minimum to keep your streak: Meditate + Journal'
    : 'No light days left this week: finish all 4 to keep your streak'

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--warm)' }}>
          🔥 {stats.streak}
          <span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 400 }}>
            {' '}
            day streak
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 600 }}>Level {stats.level}</div>
          {stats.freezes > 0 && (
            <div style={{ fontSize: 13, color: 'var(--calm)' }}>❄ {stats.freezes} freeze</div>
          )}
        </div>
      </div>

      <div style={{ background: 'var(--card)', borderRadius: 8, height: 8, marginBottom: 6 }}>
        <div
          style={{
            width: `${(stats.xpInLevel / stats.xpNeed) * 100}%`,
            height: '100%',
            borderRadius: 8,
            background: 'var(--warm)',
            transition: 'width 0.4s ease',
          }}
        />
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 4 }}>
        {stats.xpInLevel} / {stats.xpNeed} XP · best streak {stats.best}
      </p>
      <p
        style={{
          color: stats.todayCounted ? 'var(--done)' : 'var(--muted)',
          fontSize: 13,
          marginBottom: 20,
        }}
      >
        {streakMessage}
      </p>

      <Commitment hold={doneToday.hold} onHold={(v) => setField('hold', v)} />

      <h1 style={{ marginBottom: 4 }}>Today</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 12 }}>
        {count} of {tasks.length} done
      </p>

      <div style={{ background: 'var(--card)', borderRadius: 8, height: 8, marginBottom: 20 }}>
        <div
          style={{
            width: `${(count / tasks.length) * 100}%`,
            height: '100%',
            borderRadius: 8,
            background: 'var(--done)',
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      {next ? (
        <div
          style={{
            background: 'var(--card)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Next up</div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{next.label}</div>
            <div style={{ color: 'var(--muted)', fontSize: 14 }}>{next.detail}</div>
          </div>
          <button
            onClick={() => onCardClick(next.id)}
            style={{
              border: 'none',
              borderRadius: 12,
              padding: '12px 24px',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              background: next.color,
              color: '#0f1420',
            }}
          >
            Start
          </button>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--card)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            color: 'var(--done)',
            fontWeight: 600,
          }}
        >
          All four done today. Perfect day ✓
        </div>
      )}

      {tasks.map((t) => {
        const done = !!doneToday[t.id]
        return (
          <div
            key={t.id}
            onClick={() => onCardClick(t.id)}
            style={{
              background: 'var(--card)',
              borderLeft: `5px solid ${done ? 'var(--done)' : t.color}`,
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              cursor: 'pointer',
              opacity: done ? 0.7 : 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{t.label}</div>
              <div style={{ color: 'var(--muted)', fontSize: 14 }}>{t.detail}</div>
            </div>
            {done && <span style={{ color: 'var(--done)', fontSize: 22 }}>✓</span>}
          </div>
        )
      })}

      <Chest
        unlocked={allDone}
        chest={doneToday.chest}
        onOpen={(reward) => setField('chest', reward)}
      />

      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        <button onClick={() => setScreen('history')} style={linkBtn}>
          Journal history
        </button>
        <button onClick={exportData} style={linkBtn}>
          Export backup
        </button>
        <button onClick={() => fileRef.current?.click()} style={linkBtn}>
          Import backup
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={importData}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  )
}
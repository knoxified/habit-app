import { useState, useEffect, useRef } from 'react'
import Meditation from './Meditation.jsx'
import Reading from './Reading.jsx'
import Workout from './Workout.jsx'
import Journal from './Journal.jsx'
import JournalHistory from './JournalHistory.jsx'
import Chest from './Chest.jsx'
import Today from './Today.jsx'
import Me from './Me.jsx'
import Login from './Login.jsx'
import Race from './Race.jsx'
import Progress from './Progress.jsx'
import { INSIGHTS } from './insights.js'
import { computeStats } from './stats.js'
import { supabase } from './supabase.js'
import { pullDays, pushDays } from './sync.js'

const tasks = [
  { id: 'meditate', label: 'Meditate', detail: '5:20', color: 'var(--calm)', icon: '🧘' },
  { id: 'workout', label: 'Workout', detail: 'Pushups, triceps, plank', color: 'var(--energy)', icon: '💪' },
  { id: 'read', label: 'Read', detail: '10:00', color: 'var(--warm)', icon: '📖' },
  { id: 'journal', label: 'Journal', detail: '3 prompts + reading line', color: 'var(--calm)', icon: '✍️' },
]

const TASK_IDS = tasks.map((t) => t.id)

const tabs = [
  { id: 'today', icon: '🏠', label: 'Today' },
  { id: 'journal', icon: '📓', label: 'Journal' },
  { id: 'progress', icon: '📈', label: 'Progress' },
  { id: 'me', icon: '👤', label: 'Me' },
]

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

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

const stamp = (day) => ({ ...day, _u: Date.now() })

// Records when each task was first completed
const withTimes = (day, id, value) => {
  const t = { ...(day.t || {}) }
  if (value) {
    if (!t[id]) t[id] = Date.now()
  } else {
    delete t[id]
  }
  return t
}

// Newer edit wins, per day
const merge = (local, rows) => {
  const out = { ...local }
  for (const r of rows) {
    const l = out[r.day]
    const ru = r.data?._u || 0
    if (!l || (l._u || 0) < ru) out[r.day] = r.data
  }
  return out
}

function TopBar({ stats }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
      }}
    >
      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--warm)' }}>🔥 {stats.streak}</div>
      <div style={{ width: 130, textAlign: 'right' }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>
          Level {stats.level}
          {stats.freezes > 0 && <span style={{ color: 'var(--calm)' }}> · ❄ {stats.freezes}</span>}
        </div>
        <div style={{ background: 'var(--card)', borderRadius: 6, height: 6, marginTop: 4 }}>
          <div
            style={{
              width: `${(stats.xpInLevel / stats.xpNeed) * 100}%`,
              height: '100%',
              borderRadius: 6,
              background: 'var(--warm)',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>
    </div>
  )
}

function TabBar({ tab, setTab }) {
  return (
    <nav
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        background: 'var(--card)',
        borderTop: '1px solid var(--line)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 20,
      }}
    >
      <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              padding: '10px 0 8px',
              color: tab === t.id ? 'var(--warm)' : 'var(--muted)',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 22 }}>{t.icon}</div>
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  )
}

export default function App() {
  const [data, setData] = useState(load)
  const [screen, setScreen] = useState(initialScreen)
  const [tab, setTab] = useState('today')
  const [modal, setModal] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [session, setSession] = useState(undefined) // undefined = loading, null = signed out
  const [synced, setSynced] = useState(false)
  const [status, setStatus] = useState('')
  const [tick, setTick] = useState(0)
  const fileRef = useRef(null)
  const pushed = useRef({})

  const userId = session && session !== 'offline' ? session.user.id : null
  const today = todayKey()
  const doneToday = data[today] || {}
  const count = tasks.filter((t) => doneToday[t.id]).length
  const allDone = count === tasks.length
  const chestReady = allDone && !doneToday.chest

  // Auth
  useEffect(() => {
    let alive = true
    supabase.auth
      .getSession()
      .then(({ data: d }) => {
        if (!alive) return
        if (d.session) {
          setSession(d.session)
        } else {
          let flag = false
          try {
            flag = localStorage.getItem('habit-authed') === '1'
          } catch {
            /* ignore */
          }
          setSession(flag && !navigator.onLine ? 'offline' : null)
        }
      })
      .catch(() => alive && setSession(null))
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (s) setSession(s)
      else if (event === 'SIGNED_OUT') setSession(null)
    })
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // Re-sync when back online or when the app returns to the foreground
  useEffect(() => {
    const bump = () => setTick((t) => t + 1)
    const onVisible = () => document.visibilityState === 'visible' && bump()
    window.addEventListener('online', bump)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('online', bump)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  // Local save
  useEffect(() => {
    try {
      localStorage.setItem('habit-data', JSON.stringify(data))
    } catch {
      // storage unavailable, ignore
    }
  }, [data])

  // Pull from the cloud and merge
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    setStatus('syncing')
    pullDays()
      .then((rows) => {
        if (cancelled) return
        rows.forEach((r) => {
          pushed.current[r.day] = r.data?._u || 0
        })
        setData((prev) => merge(prev, rows))
        setSynced(true)
        setStatus('synced')
      })
      .catch(() => !cancelled && setStatus('error'))
    return () => {
      cancelled = true
    }
  }, [userId, tick])

  // Push local changes (debounced)
  useEffect(() => {
    if (!userId || !synced) return
    const t = setTimeout(async () => {
      const changed = {}
      for (const [day, d] of Object.entries(data)) {
        if (!DATE_RE.test(day)) continue
        const u = d._u || 0
        if (pushed.current[day] === undefined || u > pushed.current[day]) changed[day] = d
      }
      if (!Object.keys(changed).length) return
      setStatus('syncing')
      try {
        await pushDays(userId, changed)
        for (const [day, d] of Object.entries(changed)) pushed.current[day] = d._u || 0
        setStatus('synced')
      } catch {
        setStatus('error')
      }
    }, 1500)
    return () => clearTimeout(t)
  }, [data, userId, synced, tick])

  // Chest popup
  useEffect(() => {
    if (chestReady && screen === null && tab === 'today' && !dismissed) setModal(true)
  }, [chestReady, screen, tab, dismissed])

  const setField = (key, value) =>
    setData((prev) => {
      const day = prev[today] || {}
      const next = { ...day, [key]: value }
      if (TASK_IDS.includes(key)) next.t = withTimes(day, key, value)
      return { ...prev, [today]: stamp(next) }
    })

  const setPart = (key, value) =>
    setData((prev) => {
      const day = prev[today] || {}
      const wo = { ...(day.wo || {}), [key]: value }
      const all = !!(wo.push && wo.tri && wo.plank)
      const next = { ...day, wo, workout: all }
      next.t = withTimes(day, 'workout', all)
      return { ...prev, [today]: stamp(next) }
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
      const next = { ...day, jr, journal: done }
      next.t = withTimes(day, 'journal', done)
      return { ...prev, [today]: stamp(next) }
    })

  const onTask = (id) => {
    if (id === 'journal') {
      setTab('journal')
      return
    }
    if (!doneToday[id]) setScreen(id)
  }

  const signOut = async () => {
    try {
      localStorage.removeItem('habit-authed')
    } catch {
      /* ignore */
    }
    pushed.current = {}
    setSynced(false)
    setStatus('')
    await supabase.auth.signOut()
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
          Object.keys(obj).every((k) => DATE_RE.test(k))
        if (!ok) {
          alert('That file is not a valid habit backup.')
          return
        }
        if (window.confirm('Replace all current data with this backup?')) {
          const now = Date.now()
          setData(
            Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, { ...v, _u: now }]))
          )
        }
      } catch {
        alert('Could not read that file.')
      }
    }
    reader.readAsText(file)
  }

  if (session === undefined) {
    return <div style={{ color: 'var(--muted)', textAlign: 'center', paddingTop: 120 }}>Loading...</div>
  }

  if (session === null) return <Login />

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

  if (screen === 'history') {
    return <JournalHistory data={data} onClose={() => setScreen(null)} />
  }

  const stats = computeStats(data, today)
  const next = tasks.find((t) => !doneToday[t.id])
  const seen = new Set(
    Object.values(data)
      .map((d) => d?.chest?.insightId)
      .filter(Boolean)
  )
  const chest = doneToday.chest
  const insight = chest ? INSIGHTS.find((i) => i.id === chest.insightId) : null
  const insightText = insight?.text || chest?.quote || null
  const insightTag = insight?.tag || 'Note'

  const streakMessage = stats.todayCounted
    ? 'Streak safe for today ✓'
    : stats.lightLeft > 0
    ? 'Minimum to keep your streak: Meditate + Journal'
    : 'No light days left this week: finish all 4 to keep your streak'

  const statusText =
    session === 'offline'
      ? 'Offline. Changes sync when you are back online'
      : status === 'syncing'
      ? 'Syncing...'
      : status === 'synced'
      ? 'Synced ✓'
      : status === 'error'
      ? 'Sync problem. It will retry when you reconnect or reopen the app'
      : ''

  return (
    <div>
      <TopBar stats={stats} />

      {tab === 'today' && (
        <Today
          tasks={tasks}
          doneToday={doneToday}
          count={count}
          streakMessage={streakMessage}
          todayCounted={stats.todayCounted}
          race={<Race data={data} today={today} />}
          chestReady={chestReady}
          onOpenChest={() => setModal(true)}
          insightText={insightText}
          insightTag={insightTag}
          onTask={onTask}
        />
      )}

      {tab === 'journal' && (
        <Journal
          entry={doneToday.jr || {}}
          readingLine={doneToday.readingLine}
          onChange={setJournal}
          onClose={() => setTab('today')}
          onHistory={() => setScreen('history')}
        />
      )}

      {tab === 'progress' && (
        <Progress data={data} today={today} stats={stats} seen={seen} />
      )}

      {tab === 'me' && (
        <div>
          <Me
            hold={doneToday.hold}
            onHold={(v) => setField('hold', v)}
            onExport={exportData}
            onImport={() => fileRef.current?.click()}
          />
          <div style={{ background: 'var(--card)', borderRadius: 16, padding: 16, marginBottom: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Account</div>
            <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 4 }}>
              {session === 'offline' ? 'Offline mode' : session.user.email}
            </div>
            <div
              style={{
                fontSize: 13,
                marginBottom: 10,
                color: status === 'error' ? 'var(--energy)' : 'var(--done)',
              }}
            >
              {statusText}
            </div>
            <button
              onClick={signOut}
              style={{
                border: 'none',
                borderRadius: 10,
                padding: '10px 16px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                background: 'var(--bg)',
                color: 'var(--text)',
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        onChange={importData}
        style={{ display: 'none' }}
      />

      {tab === 'today' && next && (
        <button
          onClick={() => onTask(next.id)}
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            margin: '0 auto',
            width: 'calc(100% - 32px)',
            maxWidth: 448,
            bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))',
            border: 'none',
            borderRadius: 16,
            padding: '16px 0',
            fontSize: 17,
            fontWeight: 800,
            cursor: 'pointer',
            background: next.color,
            color: '#0f1420',
            zIndex: 15,
            boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
          }}
        >
          Start {next.label}
        </button>
      )}

      {modal && (
        <Chest
          seen={seen}
          chest={doneToday.chest}
          onOpen={(reward) => setField('chest', reward)}
          onClose={() => {
            setModal(false)
            setDismissed(true)
          }}
        />
      )}

      <TabBar tab={tab} setTab={setTab} />
    </div>
  )
}
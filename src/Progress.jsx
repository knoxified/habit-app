import { keyOf, dayStatus } from './stats.js'
import { INSIGHTS } from './insights.js'

const TASKS = ['meditate', 'workout', 'read', 'journal']

const parse = (k) => {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const cellStyle = (status) => {
  if (status === 'perfect') return { background: 'var(--done)' }
  if (status === 'light') return { background: 'var(--warm)' }
  if (status === 'some') return { background: 'var(--calm)', opacity: 0.45 }
  return { background: 'var(--line)' }
}

const card = { background: 'var(--card)', borderRadius: 16, padding: 16, marginBottom: 14 }

export default function Progress({ data, today, stats, seen }) {
  const end = parse(today)
  const monday = new Date(end)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const start = new Date(monday)
  start.setDate(start.getDate() - 12 * 7)

  const cells = []
  for (let i = 0; i < 91; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const k = keyOf(d)
    const day = data[k]
    const n = day ? TASKS.filter((t) => day[t]).length : 0
    const s = day ? dayStatus(day) : 'miss'
    const status = s === 'perfect' ? 'perfect' : s === 'light' ? 'light' : n > 0 ? 'some' : 'none'
    cells.push({ k, future: d > end, status, isToday: k === today })
  }

  const perfectDays = Object.keys(data).filter(
    (k) => /^\d{4}-\d{2}-\d{2}$/.test(k) && dayStatus(data[k]) === 'perfect'
  ).length

  const collected = INSIGHTS.filter((i) => seen.has(i.id))

  const legend = [
    ['var(--done)', 'Perfect'],
    ['var(--warm)', 'Light day'],
    ['rgba(45,212,191,0.45)', 'Partial'],
    ['var(--line)', 'Missed'],
  ]

  return (
    <div>
      <h1 style={{ marginBottom: 16 }}>Progress</h1>

      <div style={card}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>
          Level {stats.level} · {stats.xp} XP
        </div>
        <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
          Current streak {stats.streak} · Best {stats.best} · Perfect days {perfectDays}
        </div>
      </div>

      <div style={card}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Last 90 days</div>
        <div
          style={{
            display: 'grid',
            gridTemplateRows: 'repeat(7, auto)',
            gridAutoFlow: 'column',
            gridAutoColumns: '1fr',
            gap: 4,
          }}
        >
          {cells.map((c) => (
            <div
              key={c.k}
              style={{
                aspectRatio: '1',
                borderRadius: 5,
                ...(c.future ? { background: 'transparent' } : cellStyle(c.status)),
                outline: c.isToday ? '2px solid var(--text)' : 'none',
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
          {legend.map(([color, label]) => (
            <div
              key={label}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}
            >
              <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>
          Insights collected: {collected.length} of {INSIGHTS.length}
        </div>
        {collected.length === 0 && (
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>
            Complete a Perfect Day to open your first chest.
          </div>
        )}
        {collected.map((i) => (
          <div
            key={i.id}
            style={{
              background: 'var(--bg)',
              borderLeft: '4px solid var(--calm)',
              borderRadius: 12,
              padding: 12,
              marginTop: 10,
            }}
          >
            <div style={{ color: 'var(--calm)', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
              {i.tag.toUpperCase()}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>{i.text}</div>
          </div>
        ))}
        {collected.length > 0 && collected.length < INSIGHTS.length && (
          <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 12 }}>
            {INSIGHTS.length - collected.length} more to discover
          </div>
        )}
      </div>
    </div>
  )
}
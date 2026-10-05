const pretty = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const sections = [
  { key: 'grateful', label: 'Grateful for' },
  { key: 'learnt', label: 'Learnt' },
  { key: 'improve', label: 'To improve on' },
  { key: 'line', label: 'Line from reading' },
]

export default function JournalHistory({ data, onClose }) {
  const days = Object.keys(data)
    .filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k))
    .sort()
    .reverse()
    .map((k) => {
      const jr = data[k].jr || {}
      return {
        key: k,
        grateful: jr.grateful || '',
        learnt: jr.learnt || '',
        improve: jr.improve || '',
        line: jr.line ?? data[k].readingLine ?? '',
      }
    })
    .filter((d) => d.grateful.trim() || d.learnt.trim() || d.improve.trim() || d.line.trim())

  return (
    <div>
      <button
        onClick={onClose}
        style={{
          border: 'none',
          background: 'transparent',
          color: 'var(--muted)',
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
          padding: 8,
        }}
      >
        ← Back
      </button>
      <h1 style={{ marginTop: 8, marginBottom: 16 }}>Journal history</h1>

      {days.length === 0 && (
        <p style={{ color: 'var(--muted)' }}>No entries yet. Your first one will show up here.</p>
      )}

      {days.map((d) => (
        <div
          key={d.key}
          style={{
            background: 'var(--card)',
            borderLeft: '5px solid var(--calm)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>{pretty(d.key)}</div>
          {sections.map(
            (s) =>
              d[s.key].trim() && (
                <div key={s.key} style={{ marginBottom: 8 }}>
                  <div style={{ color: 'var(--muted)', fontSize: 13 }}>{s.label}</div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{d[s.key]}</div>
                </div>
              )
          )}
        </div>
      ))}
    </div>
  )
}
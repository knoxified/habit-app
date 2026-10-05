const fields = [
  { key: 'grateful', label: "What I'm grateful for today", required: true },
  { key: 'learnt', label: 'What I learnt today', required: true },
  { key: 'improve', label: "What I'm going to improve on", required: true },
  { key: 'line', label: 'A line I learnt from my reading (optional)', required: false },
]

export default function Journal({ entry, readingLine, onChange, onClose, onHistory }) {
  const valueOf = (k) => entry[k] ?? (k === 'line' ? readingLine || '' : '')
  const filled = fields.filter((f) => f.required && valueOf(f.key).trim()).length
  const complete = filled === 3

  const btn = {
    border: 'none',
    borderRadius: 12,
    padding: '12px 20px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button
          onClick={onClose}
          style={{ ...btn, background: 'transparent', color: 'var(--muted)', padding: 8 }}
        >
          ← Back
        </button>
        <button
          onClick={onHistory}
          style={{ ...btn, background: 'transparent', color: 'var(--calm)', padding: 8 }}
        >
          History
        </button>
      </div>

      <h1 style={{ marginTop: 8, marginBottom: 4 }}>Journal</h1>
      <p style={{ color: complete ? 'var(--done)' : 'var(--muted)', marginBottom: 20 }}>
        {complete ? 'Journal complete ✓' : `${filled} of 3 required boxes filled`} · saves automatically
      </p>

      {fields.map((f) => (
        <div key={f.key} style={{ marginBottom: 16 }}>
          <label style={{ color: 'var(--muted)', fontSize: 14 }}>{f.label}</label>
          <textarea
            value={valueOf(f.key)}
            onChange={(e) => onChange(f.key, e.target.value)}
            rows={3}
            style={{
              display: 'block',
              width: '100%',
              marginTop: 8,
              padding: 12,
              borderRadius: 12,
              border: `1px solid ${valueOf(f.key).trim() ? 'var(--calm)' : 'var(--muted)'}`,
              background: 'var(--card)',
              color: 'var(--text)',
              fontSize: 16,
              fontFamily: 'inherit',
            }}
          />
        </div>
      ))}

      <button
        onClick={onClose}
        style={{
          ...btn,
          width: '100%',
          background: complete ? 'var(--done)' : 'var(--card)',
          color: complete ? '#0f1420' : 'var(--text)',
        }}
      >
        Back to Today
      </button>
    </div>
  )
}
const IDENTITY = "I'm a man who controls his attention and protects his focus."
const PLAN = 'When I feel pulled off track: put the phone down, stand up, and do 10 pushups.'

const options = [
  { value: 'yes', label: 'Yes' },
  { value: 'mostly', label: 'Mostly' },
  { value: 'no', label: 'No' },
]

export default function Commitment({ hold, onHold }) {
  return (
    <div
      style={{
        background: 'var(--card)',
        borderLeft: '5px solid var(--calm)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{IDENTITY}</div>
      <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 14 }}>{PLAN}</div>

      <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 6 }}>
        Evening check-in: did I hold the line today? (private, never affects your streak)
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onHold(hold === o.value ? null : o.value)}
            style={{
              flex: 1,
              border: 'none',
              borderRadius: 10,
              padding: '10px 0',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              background: hold === o.value ? 'var(--calm)' : 'var(--bg)',
              color: hold === o.value ? '#0f1420' : 'var(--text)',
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
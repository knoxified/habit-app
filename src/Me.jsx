import { useState } from 'react'

const KEY = 'habit-me'

const loadMe = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}

const options = [
  { value: 'yes', label: 'Yes' },
  { value: 'mostly', label: 'Mostly' },
  { value: 'no', label: 'No' },
]

const card = { background: 'var(--card)', borderRadius: 16, padding: 16, marginBottom: 14 }
const area = {
  display: 'block',
  width: '100%',
  marginTop: 6,
  marginBottom: 10,
  padding: 10,
  borderRadius: 10,
  border: '1px solid var(--muted)',
  background: 'var(--bg)',
  color: 'var(--text)',
  fontSize: 15,
  fontFamily: 'inherit',
}
const btn = {
  border: 'none',
  borderRadius: 10,
  padding: '10px 16px',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
}

export default function Me({ hold, onHold, onExport, onImport }) {
  const [me, setMe] = useState(loadMe)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ identity: '', plan: '' })

  const startEdit = () => {
    setDraft({ identity: me.identity || '', plan: me.plan || '' })
    setEditing(true)
  }

  const save = () => {
    const next = { identity: draft.identity.trim(), plan: draft.plan.trim() }
    setMe(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
    setEditing(false)
  }

  return (
    <div>
      <h1 style={{ marginBottom: 16 }}>Me</h1>

      <div style={{ ...card, borderLeft: '4px solid var(--calm)' }}>
        <div style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
          MY COMMITMENT · stored only on this device
        </div>
        {editing ? (
          <div>
            <label style={{ color: 'var(--muted)', fontSize: 13 }}>Identity line</label>
            <textarea
              rows={2}
              value={draft.identity}
              onChange={(e) => setDraft({ ...draft, identity: e.target.value })}
              style={area}
            />
            <label style={{ color: 'var(--muted)', fontSize: 13 }}>If-then plan</label>
            <textarea
              rows={3}
              value={draft.plan}
              onChange={(e) => setDraft({ ...draft, plan: e.target.value })}
              style={area}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={save} style={{ ...btn, background: 'var(--calm)', color: '#0f1420' }}>
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                style={{ ...btn, background: 'var(--bg)', color: 'var(--text)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : me.identity || me.plan ? (
          <div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{me.identity}</div>
            <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 12 }}>{me.plan}</div>
            <button onClick={startEdit} style={{ ...btn, background: 'var(--bg)', color: 'var(--text)' }}>
              Edit
            </button>
          </div>
        ) : (
          <button onClick={startEdit} style={{ ...btn, background: 'var(--calm)', color: '#0f1420' }}>
            Write my identity line and plan
          </button>
        )}
      </div>

      <div style={card}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Evening check-in</div>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 10 }}>
          Did I hold the line today? Private, and it never affects your streak or XP.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => onHold(hold === o.value ? null : o.value)}
              style={{
                ...btn,
                flex: 1,
                padding: '12px 0',
                background: hold === o.value ? 'var(--calm)' : 'var(--bg)',
                color: hold === o.value ? '#0f1420' : 'var(--text)',
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Backup</div>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 10 }}>
          Saves your days, streak, and journal as a file you can restore later.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onExport} style={{ ...btn, background: 'var(--bg)', color: 'var(--text)' }}>
            Export backup
          </button>
          <button onClick={onImport} style={{ ...btn, background: 'var(--bg)', color: 'var(--text)' }}>
            Import backup
          </button>
        </div>
      </div>
    </div>
  )
}
import Ring from './Ring.jsx'

export default function Today({
  tasks,
  doneToday,
  count,
  streakMessage,
  todayCounted,
  race,
  chestReady,
  onOpenChest,
  insightText,
  insightTag,
  onTask,
}) {
  const dateText = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

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
        <div style={{ color: 'var(--muted)' }}>{dateText}</div>
        {race}
      </div>

      <Ring tasks={tasks} done={doneToday} count={count} />
      <p
        style={{
          textAlign: 'center',
          fontSize: 13,
          margin: '12px 0 20px',
          color: todayCounted ? 'var(--done)' : 'var(--muted)',
        }}
      >
        {streakMessage}
      </p>

      {chestReady && (
        <div
          onClick={onOpenChest}
          style={{
            background: 'var(--card)',
            border: '1px solid var(--warm)',
            borderRadius: 16,
            padding: 16,
            marginBottom: 14,
            cursor: 'pointer',
            textAlign: 'center',
            fontWeight: 700,
            color: 'var(--warm)',
          }}
        >
          🎁 Your Perfect Day chest is ready. Tap to open
        </div>
      )}

      {insightText && (
        <div
          style={{
            background: 'var(--card)',
            borderLeft: '4px solid var(--calm)',
            borderRadius: 16,
            padding: 16,
            marginBottom: 14,
          }}
        >
          <div style={{ color: 'var(--calm)', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
            TODAY'S INSIGHT · {insightTag.toUpperCase()}
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.5 }}>{insightText}</div>
        </div>
      )}

      {tasks.map((t) => {
        const done = !!doneToday[t.id]
        return (
          <div
            key={t.id}
            onClick={() => onTask(t.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              background: 'var(--card)',
              borderRadius: 16,
              padding: '14px 16px',
              marginBottom: 10,
              cursor: 'pointer',
              opacity: done ? 0.75 : 1,
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                background: done ? 'var(--done)' : t.color,
                color: '#0f1420',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: done ? 22 : 24,
              }}
            >
              {done ? '✓' : t.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{t.label}</div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>{t.detail}</div>
            </div>
            {!done && <span style={{ color: 'var(--muted)', fontSize: 22 }}>›</span>}
          </div>
        )
      })}
    </div>
  )
}
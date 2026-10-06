const R = 54
const C = 2 * Math.PI * R
const GAP = 22

export default function Ring({ tasks, done, count }) {
  const seg = C / tasks.length - GAP
  return (
    <div style={{ position: 'relative', width: 150, height: 150, margin: '0 auto' }}>
      <svg width="150" height="150" viewBox="0 0 140 140">
        {tasks.map((t, i) => (
          <circle
            key={t.id}
            cx="70"
            cy="70"
            r={R}
            fill="none"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${seg} ${C - seg}`}
            transform={`rotate(${-90 + i * (360 / tasks.length) + (GAP / 2 / C) * 360} 70 70)`}
            style={{ stroke: done[t.id] ? t.color : 'var(--line)', transition: 'stroke 0.4s ease' }}
          />
        ))}
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 800 }}>
          {count}
          <span style={{ fontSize: 18, color: 'var(--muted)' }}>/{tasks.length}</span>
        </div>
        <div style={{ color: 'var(--muted)', fontSize: 12 }}>done today</div>
      </div>
    </div>
  )
}
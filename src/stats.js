const pad = (n) => String(n).padStart(2, '0')

export const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const parse = (k) => {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Monday-start week key
const weekOf = (d) => {
  const x = new Date(d)
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  return keyOf(x)
}

const TASKS = ['meditate', 'workout', 'read', 'journal']
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export const dayStatus = (day = {}) => {
  const n = TASKS.filter((t) => day[t]).length
  if (n === 4) return 'perfect'
  if (day.meditate && day.journal) return 'light'
  return 'miss'
}

export function computeStats(data, today) {
  const keys = Object.keys(data).filter((k) => DATE_RE.test(k)).sort()

  // XP: 20 per task, +40 for a perfect day, plus chest bonus
  let xp = 0
  for (const k of keys) {
    const n = TASKS.filter((t) => data[k][t]).length
    xp += n * 20 + (n === 4 ? 40 : 0)
    xp += data[k].chest?.xp || 0
  }

  // Level: 200 XP for level 1, each next level needs 50 more
  let level = 1
  let need = 200
  let rem = xp
  while (rem >= need) {
    rem -= need
    level++
    need = 200 + (level - 1) * 50
  }

  // Streak
  let streak = 0
  let best = 0
  let freezes = 0
  let todayCounted = false
  const lightUsed = {}

  if (keys.length) {
    const end = parse(today)
    for (const d = parse(keys[0]); d <= end; d.setDate(d.getDate() + 1)) {
      const k = keyOf(d)
      const isToday = k === today
      const status = dayStatus(data[k])
      let ok = false
      if (status === 'perfect') {
        ok = true
      } else if (status === 'light') {
        const w = weekOf(d)
        const used = lightUsed[w] || 0
        if (used < 2) {
          ok = true
          lightUsed[w] = used + 1
        }
      }

      if (ok) {
        streak++
        if (streak % 7 === 0) freezes = Math.min(1, freezes + 1)
        best = Math.max(best, streak)
        if (isToday) todayCounted = true
      } else if (!isToday) {
        if (freezes > 0) freezes--
        else streak = 0
      }
    }
  }

  const lightLeft = 2 - (lightUsed[weekOf(parse(today))] || 0)

  return {
    xp,
    level,
    xpInLevel: rem,
    xpNeed: need,
    streak,
    best,
    freezes,
    todayCounted,
    lightLeft,
  }
}
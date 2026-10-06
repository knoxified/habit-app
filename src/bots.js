import { keyOf } from './stats.js'

const TASKS = ['meditate', 'workout', 'read', 'journal']

// Tunables
const SAM_TIMES = { meditate: 7, workout: 12.5, read: 17, journal: 21 }
const SAM_RELIABILITY = 0.85
const DEFAULT_TIMES = { meditate: 8, workout: 13, read: 18, journal: 21 }
const RIVAL_START = 6
const RIVAL_END = 22
const RIVAL_BEAT = 1.05
const RIVAL_BONUS = 10
const RIVAL_MIN = 40
const RIVAL_CAP = 110
const RIVAL_DEFAULT = 60

const parse = (k) => {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const shift = (k, n) => {
  const d = parse(k)
  d.setDate(d.getDate() + n)
  return keyOf(d)
}

const hash = (s) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 10000) / 10000
}

const hourOf = (ms) => {
  const d = new Date(ms)
  return d.getHours() + d.getMinutes() / 60
}

export const pointsOfDay = (day = {}) => {
  const n = TASKS.filter((t) => day[t]).length
  return n * 20 + (n === 4 ? 40 : 0)
}

const pointsAt = (times, h) => {
  const done = Object.values(times).filter((t) => t <= h).length
  return done * 20 + (done === 4 ? 40 : 0)
}

export function computeRace(data, today, now = new Date()) {
  const h = now.getHours() + now.getMinutes() / 60

  // You
  const you = pointsOfDay(data[today])

  // Steady Sam
  const samTimes = {}
  for (const id of TASKS) {
    if (hash(today + id) < SAM_RELIABILITY) samTimes[id] = SAM_TIMES[id]
  }
  const sam = pointsAt(samTimes, h)

  // Yesterday You
  const yDay = data[shift(today, -1)]
  const yTimes = {}
  if (yDay) {
    for (const id of TASKS) {
      if (yDay[id]) yTimes[id] = yDay.t?.[id] ? hourOf(yDay.t[id]) : DEFAULT_TIMES[id]
    }
  }
  const ghost = pointsAt(yTimes, h)

  // Rival: adapts to your last 7 days
  let total = 0
  let withData = 0
  for (let i = 1; i <= 7; i++) {
    const day = data[shift(today, -i)]
    if (day) withData++
    total += pointsOfDay(day)
  }
  const target =
    withData < 3
      ? RIVAL_DEFAULT
      : Math.min(
          RIVAL_CAP,
          Math.max(RIVAL_MIN, Math.round((total / 7) * RIVAL_BEAT + RIVAL_BONUS))
        )
  const progress = Math.min(1, Math.max(0, (h - RIVAL_START) / (RIVAL_END - RIVAL_START)))
  const rival = Math.round((target * progress) / 5) * 5

  const rows = [
    { id: 'you', name: 'You', emoji: '🔥', points: you, isYou: true },
    { id: 'rival', name: 'Rival', emoji: '😈', points: rival },
    { id: 'sam', name: 'Steady Sam', emoji: '🐢', points: sam },
    { id: 'ghost', name: 'Yesterday You', emoji: '👻', points: ghost },
  ].sort((a, b) => b.points - a.points || (b.isYou ? 1 : 0) - (a.isYou ? 1 : 0))

  return { rows, rank: rows.findIndex((r) => r.isYou) + 1, max: 120 }
}
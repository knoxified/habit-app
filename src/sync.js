import { supabase } from './supabase.js'

export async function pullDays() {
  const { data, error } = await supabase.from('habit_days').select('day, data')
  if (error) throw error
  return data || []
}

export async function pushDays(userId, days) {
  const rows = Object.entries(days).map(([day, data]) => ({
    user_id: userId,
    day,
    data,
    updated_at: new Date().toISOString(),
  }))
  if (!rows.length) return
  const { error } = await supabase
    .from('habit_days')
    .upsert(rows, { onConflict: 'user_id,day' })
  if (error) throw error
}
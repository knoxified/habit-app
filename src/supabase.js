import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://ywmmtjdbxyjkwahwzfig.supabase.co',
  'sb_publishable_93nWowe3ty-PczS1V4RsMA_TwjqXyI_',
  { auth: { persistSession: true, autoRefreshToken: true } }
)
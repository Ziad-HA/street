import { createClient } from '@supabase/supabase-js'

// The publishable key is designed for browser use. Keep all authorization in RLS policies.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://hmyasmkguxkawhnyojtb.supabase.co'
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_6vbLWo2BguDY-6oghYkMCg_9zHTXXfW'

export const supabase = createClient(supabaseUrl, supabasePublishableKey)

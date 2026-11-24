import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://hmyasmkguxkawhnyojtb.supabase.co'

// This is the active publishable key registered for the STREET Supabase project.
const supabasePublishableKey = 'sb_publishable_6vbLWo2BguDY-6oghYkMCg_9zHTXXfW'

// Authenticated client for account, checkout and admin operations.
export const supabase = createClient(supabaseUrl, supabasePublishableKey)

// Isolated public client for catalog stock and approved reviews.
// It deliberately does not reuse a possibly expired signed-in user's JWT.
export const supabasePublic = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})

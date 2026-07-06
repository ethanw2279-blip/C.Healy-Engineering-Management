import { createClient } from '@supabase/supabase-js'

// Configured from Vite env vars — set these in `.env.local` (local dev) and in
// your Vercel project settings (production). See SUPABASE_SETUP.md.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True once the Supabase env vars are present. */
export const isSupabaseConfigured = Boolean(url && anonKey)

// A single shared browser client. Falls back to harmless placeholder values
// when unconfigured so the app can still build/run on the in-memory store.
export const supabase = createClient(
  url ?? 'http://localhost:54321',
  anonKey ?? 'public-anon-key',
)

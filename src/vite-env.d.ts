/// <reference types="vite/client" />

// Types only — the real values live in .env.local (local) and your Vercel
// project's Environment Variables (production). Never hardcode them here.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

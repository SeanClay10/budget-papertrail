import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

function safeUrl(raw: string | undefined): string {
  try {
    new URL(raw ?? '')
    return raw!
  } catch {
    // During build/SSR with placeholder env vars — return a no-op valid URL.
    // Real network calls will fail gracefully; this prevents a build-time throw.
    return 'https://placeholder.supabase.co'
  }
}

export function createClient() {
  return createBrowserClient<Database>(
    safeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  )
}

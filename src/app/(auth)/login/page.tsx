'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { ReceiptText } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else { router.push('/dashboard'); router.refresh() }
  }

  const labelClass = 'block text-[10px] font-heading font-bold uppercase tracking-widest text-muted-foreground mb-1.5'

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Background decoration */}
      <div
        className="absolute top-[-120px] right-[-150px] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ backgroundColor: 'var(--primary)', opacity: 0.06 }}
      />
      <div
        className="absolute bottom-[-80px] left-[-100px] w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ backgroundColor: 'var(--secondary)', opacity: 0.08 }}
      />
      <div
        className="absolute top-[30%] left-[8%] w-12 h-12 rounded-full pointer-events-none"
        style={{ backgroundColor: 'var(--tertiary)', opacity: 0.5, boxShadow: 'var(--shadow-hard-amber)' }}
      />
      <div
        className="absolute bottom-[20%] right-[8%] w-8 h-8 rounded-full pointer-events-none"
        style={{ backgroundColor: 'var(--quaternary)', opacity: 0.5, boxShadow: 'var(--shadow-hard-emerald)' }}
      />

      {/* Card */}
      <div className="relative w-full max-w-[420px] bg-card rounded-2xl border-2 border-border shadow-[8px_8px_0px_0px_var(--border)] animate-pop-in">
        {/* Pink triangle decoration — top right corner */}
        <div
          className="absolute -top-3 -right-3 w-0 h-0 pointer-events-none"
          style={{
            borderLeft: '20px solid transparent',
            borderBottom: `20px solid var(--secondary)`,
            filter: 'drop-shadow(2px 2px 0px var(--border))',
          }}
        />

        <div className="px-8 pt-10 pb-8 space-y-6">
          {/* Icon */}
          <div className="flex flex-col items-center gap-4 text-center">
            <div
              className="flex items-center justify-center w-18 h-18 rounded-full border-2 border-border"
              style={{
                width: 72, height: 72,
                backgroundColor: 'var(--primary)',
                boxShadow: 'var(--shadow-hard-violet)',
              }}
            >
              <ReceiptText className="h-8 w-8 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-3xl">Welcome back.</h1>
              <p className="text-muted-foreground mt-1 text-sm">Sign in to Budget Papertrail</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-xl border-2 border-destructive/30">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className={labelClass}>Email</label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className={labelClass}>Password</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={[
                'w-full h-12 flex items-center justify-center rounded-full',
                'bg-primary text-white font-heading font-bold text-base',
                'border-2 border-border shadow-[5px_5px_0px_0px_var(--border)]',
                'transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
                'hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[7px_7px_0px_0px_var(--border)]',
                'active:translate-x-[1px] active:translate-y-[1px] active:shadow-[3px_3px_0px_0px_var(--border)]',
                'disabled:opacity-50 disabled:pointer-events-none',
              ].join(' ')}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Amber circle — bottom left */}
        <div
          className="absolute -bottom-3 -left-3 w-8 h-8 rounded-full border-2 border-border pointer-events-none"
          style={{ backgroundColor: 'var(--tertiary)', boxShadow: 'var(--shadow-hard-sm)' }}
        />
      </div>
    </div>
  )
}

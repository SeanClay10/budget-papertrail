'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, ScanLine, Receipt, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/theme-toggle'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/scan',      label: 'Scan',      icon: ScanLine },
  { href: '/receipts',  label: 'Receipts',  icon: Receipt },
  { href: '/settings',  label: 'Settings',  icon: Settings },
]

export function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen border-r-2 border-border bg-card px-4 py-6">
        {/* Wordmark */}
        <Link href="/dashboard" className="flex items-center gap-3 px-2 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary border-2 border-border shadow-[var(--shadow-hard-sm)] hover-wiggle">
            <Receipt className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="leading-none">
            <span className="font-heading font-extrabold text-xl text-primary">Budget</span>
            <span className="font-heading font-bold text-xl text-foreground"> Papertrail</span>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="flex-1 space-y-1.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-heading font-bold transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-[var(--shadow-hard-sm)]'
                    : 'text-muted-foreground hover:bg-[var(--tertiary)] hover:text-[var(--tertiary-foreground)]'
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2.5} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom: sign out + theme toggle */}
        <div className="flex items-center justify-between pt-4 border-t-2 border-border/30">
          <button
            onClick={handleSignOut}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-heading font-bold',
              'text-muted-foreground border-2 border-transparent',
              'transition-all duration-200',
              'hover:bg-muted hover:text-foreground'
            )}
          >
            <LogOut className="h-4 w-4" strokeWidth={2.5} />
            Sign Out
          </button>
          <ThemeToggle />
        </div>
      </aside>

      {/* ── Mobile Bottom Nav ───────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t-2 border-border bg-card flex items-end">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isScan = href === '/scan'
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-end pb-2 pt-2 text-[10px] font-heading font-bold relative',
                'transition-colors duration-200',
                isActive && !isScan ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {isScan ? (
                <>
                  <div className={cn(
                    'absolute -top-6 flex items-center justify-center w-14 h-14 rounded-full',
                    'bg-primary border-2 border-border shadow-[var(--shadow-hard)]',
                    'transition-all duration-200 active:scale-95 active:shadow-[var(--shadow-hard-sm)]'
                  )}>
                    <Icon className="h-6 w-6 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="mt-9 text-primary">{label}</span>
                </>
              ) : (
                <>
                  <Icon className={cn('h-5 w-5 mb-1', isActive ? 'text-primary' : 'text-muted-foreground')} strokeWidth={2.5} />
                  <span>{label}</span>
                </>
              )}
            </Link>
          )
        })}
      </nav>
    </>
  )
}

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, ScanLine, Receipt, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/scan', label: 'Scan', icon: ScanLine },
  { href: '/receipts', label: 'Receipts', icon: Receipt },
  { href: '/settings', label: 'Settings', icon: Settings },
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
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen border-r bg-card px-3 py-6">
        <div className="flex items-center gap-2 px-3 mb-8">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Receipt className="h-5 w-5 text-primary" />
          </div>
          <span className="font-semibold text-sm">Budget Papertrail</span>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-3 text-muted-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-card flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isScan = href === '/scan'
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium transition-colors relative',
                isScan ? 'text-primary-foreground' : isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {isScan ? (
                <div className="absolute -top-5 flex items-center justify-center w-14 h-14 rounded-full bg-primary shadow-lg">
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </div>
              ) : (
                <Icon className={cn('h-5 w-5 mb-1', isActive && 'text-primary')} />
              )}
              {isScan ? <span className="mt-8">{label}</span> : <span>{label}</span>}
            </Link>
          )
        })}
      </nav>
    </>
  )
}

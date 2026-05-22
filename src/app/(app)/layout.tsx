import { Nav } from '@/components/nav'
import { ThemeToggle } from '@/components/theme-toggle'
import { Receipt } from 'lucide-react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Nav />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile-only top header */}
        <header className="md:hidden flex items-center justify-between px-4 h-12 border-b bg-card shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-primary/10">
              <Receipt className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold text-sm">Budget Papertrail</span>
          </div>
          <ThemeToggle />
        </header>
        <main className="flex-1 flex flex-col pb-20 md:pb-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}

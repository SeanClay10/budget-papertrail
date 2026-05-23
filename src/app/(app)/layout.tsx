import { Nav } from '@/components/nav'
import { ThemeToggle } from '@/components/theme-toggle'
import { Receipt } from 'lucide-react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Nav />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile-only top header */}
        <header
          className="md:hidden flex items-center justify-between px-4 h-14 border-b-2 border-border bg-card shrink-0"
          style={{
            backgroundImage: 'radial-gradient(circle, color-mix(in srgb, var(--border) 20%, transparent) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary border-2 border-border">
              <Receipt className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="leading-none">
              <span className="font-heading font-extrabold text-base text-primary">Budget</span>
              <span className="font-heading font-bold text-base text-foreground"> Papertrail</span>
            </div>
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

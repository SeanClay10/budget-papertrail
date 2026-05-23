'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-10 h-10" />

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'flex items-center justify-center w-10 h-10 rounded-full',
        'border-2 border-border bg-card text-foreground',
        'shadow-[var(--shadow-hard-sm)]',
        'transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
        'hover:bg-[var(--tertiary)] hover:text-[var(--tertiary-foreground)] hover:[&_svg]:rotate-[15deg]',
        'active:shadow-none active:translate-x-[1px] active:translate-y-[1px]',
        '[&_svg]:transition-transform [&_svg]:duration-200',
        className
      )}
    >
      {isDark
        ? <Sun className="h-4 w-4" strokeWidth={2.5} />
        : <Moon className="h-4 w-4" strokeWidth={2.5} />
      }
    </button>
  )
}

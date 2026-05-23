"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressBarProps {
  value: number      // 0–100
  color?: string     // CSS color for the fill
  className?: string
}

function ProgressBar({ value, color, className }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div
      data-slot="progress"
      className={cn(
        "relative h-[10px] w-full overflow-hidden rounded-full",
        "border-2 border-border bg-muted",
        className
      )}
    >
      <div
        data-slot="progress-indicator"
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{ width: `${pct}%`, backgroundColor: color ?? 'var(--primary)' }}
      />
    </div>
  )
}

// Keep legacy shadcn exports for any existing code that imports them
export { ProgressBar }
export { ProgressBar as Progress }

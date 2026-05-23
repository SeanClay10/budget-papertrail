function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-card border-2 border-border shadow-[5px_5px_0px_0px_var(--border)] overflow-hidden">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="w-12 h-12 rounded-full border-2 border-border bg-muted animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-28 bg-muted animate-pulse rounded-full" />
          <div className="h-3 w-16 bg-muted animate-pulse rounded-full" />
        </div>
      </div>
      <div className="h-[2px] bg-border/20 mx-4" />
      <div className="px-4 py-3 space-y-2.5">
        <div className="h-[10px] w-full bg-muted animate-pulse rounded-full border-2 border-border" />
        <div className="flex justify-between">
          <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
          <div className="h-3 w-20 bg-muted animate-pulse rounded-full" />
        </div>
      </div>
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto w-full">
      {/* Header skeleton */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted animate-pulse border-2 border-border" />
          <div className="h-8 w-44 bg-muted animate-pulse rounded-full" />
          <div className="w-10 h-10 rounded-full bg-muted animate-pulse border-2 border-border" />
        </div>
        <div className="h-10 w-32 bg-muted animate-pulse rounded-full border-2 border-border shadow-[3px_3px_0px_0px_var(--border)]" />
      </div>

      {/* Budget cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="rounded-2xl bg-card border-2 border-border shadow-[5px_5px_0px_0px_var(--border)] p-5">
        <div className="h-5 w-40 bg-muted animate-pulse rounded-full mb-4" />
        <div className="h-48 bg-muted/50 animate-pulse rounded-xl" />
      </div>

      {/* Recent receipts skeleton */}
      <div className="rounded-2xl bg-card border-2 border-border shadow-[5px_5px_0px_0px_var(--border)] p-5 space-y-4">
        <div className="h-5 w-36 bg-muted animate-pulse rounded-full" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center py-1 border-t border-border/20 first:border-0">
            <div className="space-y-1.5">
              <div className="h-4 w-32 bg-muted animate-pulse rounded-full" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded-full" />
            </div>
            <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

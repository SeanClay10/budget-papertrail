import { Card, CardContent, CardHeader } from '@/components/ui/card'

function SkeletonCard() {
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-24 bg-muted animate-pulse rounded" />
          <div className="h-3 w-16 bg-muted animate-pulse rounded" />
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <div className="h-2 w-full bg-muted animate-pulse rounded-full" />
        <div className="flex justify-between">
          <div className="h-3 w-20 bg-muted animate-pulse rounded" />
          <div className="h-3 w-20 bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto w-full">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-7 w-40 bg-muted animate-pulse rounded" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-8 w-28 bg-muted animate-pulse rounded-lg" />
      </div>

      {/* Budget cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Recent receipts skeleton */}
      <Card>
        <CardHeader className="pb-2">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center py-1">
              <div className="space-y-1.5">
                <div className="h-4 w-28 bg-muted animate-pulse rounded" />
                <div className="h-3 w-20 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-4 w-14 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

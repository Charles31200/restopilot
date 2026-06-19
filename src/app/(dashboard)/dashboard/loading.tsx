function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-gray-100 ${className}`} />
}

export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="hidden lg:block mb-6 space-y-2">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-4 w-32 rounded-lg" />
      </div>

      {/* KPI 2×2 */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-[100px]" />
        ))}
      </div>

      {/* Section title */}
      <Skeleton className="h-5 w-32 rounded-lg mt-2" />

      {/* Liste alertes */}
      <Skeleton className="h-[160px]" />

      {/* Section title */}
      <Skeleton className="h-5 w-28 rounded-lg" />

      {/* Graphe */}
      <Skeleton className="h-[180px]" />
    </div>
  )
}

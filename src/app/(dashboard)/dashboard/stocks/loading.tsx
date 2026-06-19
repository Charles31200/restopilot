function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-gray-100 ${className}`} />
}

export default function StocksLoading() {
  return (
    <div className="space-y-4">
      {/* Titre desktop */}
      <div className="hidden lg:block mb-6 space-y-2">
        <Skeleton className="h-8 w-56 rounded-xl" />
        <Skeleton className="h-4 w-80 rounded-lg" />
      </div>

      {/* Barre recherche + filtre */}
      <Skeleton className="h-12" />

      {/* Tabs catégories */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>

      {/* Lignes produits */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <Skeleton key={i} className="h-[72px]" />
        ))}
      </div>
    </div>
  )
}

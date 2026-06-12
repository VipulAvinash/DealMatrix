export const Skeleton = ({ className = "" }) => (
  <div className={`bg-slate-800 rounded-lg animate-pulse ${className}`} />
);

export const ProductCardSkeleton = () => (
  <div className="card p-4 space-y-3">
    <Skeleton className="h-40 w-full rounded-xl" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-3 w-1/2" />
    <div className="flex justify-between items-center pt-1">
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-4 w-16" />
    </div>
    <Skeleton className="h-9 w-full rounded-xl" />
  </div>
);

export const SearchSkeletonGrid = ({ count = 8 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

export const RecommendationSkeleton = () => (
  <div className="card p-6 space-y-4">
    <Skeleton className="h-6 w-40" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  </div>
);

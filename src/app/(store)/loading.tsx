export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse space-y-6">
      <div className="h-10 w-64 rounded-xl bg-blush-100" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-square rounded-card bg-blush-100" />
            <div className="h-4 w-3/4 rounded bg-blush-100" />
            <div className="h-4 w-1/3 rounded bg-blush-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
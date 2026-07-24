export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-1">
        <div className="h-7 w-40 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-10 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        ))}
      </div>
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="space-y-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

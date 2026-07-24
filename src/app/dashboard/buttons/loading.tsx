export default function ButtonsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-1">
        <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
                <div className="h-3 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
              <div className="flex gap-1">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-7 w-7 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SocialLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-1">
        <div className="h-7 w-40 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-4 w-56 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
              <div className="flex gap-1">
                {[...Array(2)].map((_, j) => (
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

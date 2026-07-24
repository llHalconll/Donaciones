export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-1">
        <div className="h-7 w-52 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
      {[...Array(2)].map((_, i) => (
        <div key={i} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="space-y-3 max-w-md">
            {[...Array(2)].map((_, j) => (
              <div key={j} className="space-y-1.5">
                <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
              </div>
            ))}
          </div>
          <div className="h-9 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      ))}
    </div>
  )
}

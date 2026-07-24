export default function ProfileLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-1">
        <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="space-y-3">
                <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
                <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <div className="h-48 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

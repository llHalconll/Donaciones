export default function GoalLevelsLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Cargando niveles">
      <div className="h-11 w-40 rounded-xl bg-slate-200 dark:bg-slate-800" />
      <div className="space-y-2">
        <div className="h-7 w-56 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-80 max-w-full rounded bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="h-20 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          />
        ))}
      </div>
    </div>
  )
}

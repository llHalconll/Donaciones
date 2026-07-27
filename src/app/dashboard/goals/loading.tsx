export default function GoalsLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Cargando objetivos">
      <div className="space-y-2">
        <div className="h-8 w-56 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-80 max-w-full rounded bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="h-36 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          />
        ))}
      </div>
    </div>
  )
}

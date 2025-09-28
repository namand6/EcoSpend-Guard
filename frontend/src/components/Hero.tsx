export default function Hero() {
  return (
    <div className="relative mb-6">
      <div className="hero-surface rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-6 sm:p-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              Amazon Climate Pledge
            </span>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
              FinOps Ready
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Track spend → CO₂e, surface risks, and auto-compose reduction plans.
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Live stream from the extension or upload a CSV. Agents turn insights into actions aligned to
            Amazon’s Climate Pledge and pragmatic FinOps best practices.
          </p>
        </div>
      </div>
    </div>
  );
}

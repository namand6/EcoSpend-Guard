import { PropsWithChildren } from "react";

export default function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Sticky, translucent top bar */}
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <span className="inline-flex size-6 items-center justify-center rounded-md bg-emerald-600 text-white">🌱</span>
            EcoSpend Guard
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              demo
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* room for future icons / links */}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

      {/* Footer (optional) */}
      <footer className="py-8 text-center text-xs text-slate-500">
        Built for sunhacks — Amazon Climate Pledge x FinOps friendly
      </footer>
    </div>
  );
}

import { PropsWithChildren } from "react";
import clsx from "clsx";

export function Card({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={clsx("rounded-2xl border border-slate-200 bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </Card>
  );
}

export function SectionTitle({ children }: PropsWithChildren) {
  return <h3 className="mb-3 text-lg font-medium">{children}</h3>;
}

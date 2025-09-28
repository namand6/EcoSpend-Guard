import React from "react";

export default function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_-10%,#ecfdf5,transparent)]" />
      <div className="absolute -top-24 -left-24 h-[32rem] w-[32rem] bg-gradient-to-tr from-emerald-300 via-cyan-300 to-sky-300 blur-3xl opacity-30 animate-pulse" />
      <div className="absolute -bottom-32 -right-24 h-[36rem] w-[36rem] bg-gradient-to-tr from-amber-200 via-rose-200 to-fuchsia-200 blur-3xl opacity-25 animate-[pulse_8s_ease-in-out_infinite]" />
    </div>
  );
}

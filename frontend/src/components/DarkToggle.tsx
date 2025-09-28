import React from "react";

export default function DarkToggle() {
  return (
    <button
      onClick={() => document.documentElement.classList.toggle("dark")}
      className="text-sm px-2 py-1 rounded-md ring-1 ring-black/10 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
      title="Toggle dark mode"
    >
      🌓
    </button>
  );
}

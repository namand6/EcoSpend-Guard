import React from "react";

export function Empty({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl">🗂️</div>
      <h3 className="mt-3 text-lg font-medium">{title}</h3>
      {subtitle && <p className="mt-1 text-gray-500">{subtitle}</p>}
    </div>
  );
}

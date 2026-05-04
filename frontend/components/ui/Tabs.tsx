"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";

export type Tab = { id: string; label: string; count?: number };

type TabsProps = {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  children?: ReactNode;
};

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div
      role="tablist"
      className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white p-1 shadow-[0_18px_30px_rgba(25,30,42,0.08)]"
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={clsx(
              "rounded-full px-4 py-2 text-sm font-bold transition",
              isActive
                ? "bg-[var(--gold)] text-[#16181f] shadow-[0_8px_18px_rgba(242,201,76,0.32)]"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            )}
          >
            {tab.label}
            {typeof tab.count === "number" ? (
              <span
                className={clsx(
                  "ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-extrabold",
                  isActive
                    ? "bg-black/10 text-black"
                    : "bg-black/5 text-[var(--muted)]"
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

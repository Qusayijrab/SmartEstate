import Link from "next/link";
import { Building2 } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle: string;
  side: ReactNode;
  children: ReactNode;
};

export function AuthShell({ title, subtitle, children, side }: Props) {
  return (
    <div
      className="relative min-h-[calc(100vh-100px)] overflow-hidden text-white"
      style={{
        background:
          "radial-gradient(circle at 15% 20%, rgba(214,178,93,0.12), transparent 25%)," +
          "radial-gradient(circle at 85% 15%, rgba(88,133,255,0.14), transparent 22%)," +
          "radial-gradient(circle at 75% 75%, rgba(214,178,93,0.08), transparent 24%)," +
          "linear-gradient(180deg, #05101c 0%, #07111f 35%, #091426 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage:
            "linear-gradient(180deg, rgba(0,0,0,.7), transparent 90%)",
          WebkitMaskImage:
            "linear-gradient(180deg, rgba(0,0,0,.7), transparent 90%)",
        }}
      />
      <div className="container relative grid min-h-[calc(100vh-100px)] grid-cols-1 items-center gap-12 py-16 lg:grid-cols-[1.05fr_1fr]">
        <div className="hidden lg:block">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-white"
          >
            <span
              className="grid h-[42px] w-[42px] place-items-center rounded-xl text-[18px] text-[#f3dfaa]"
              style={{
                background:
                  "linear-gradient(135deg, rgba(214,178,93,0.22), rgba(255,255,255,0.08))",
                border: "1px solid rgba(214,178,93,0.24)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
              }}
            >
              <Building2 size={20} />
            </span>
            <span className="text-lg font-extrabold tracking-wide">SmartEstate</span>
          </Link>
          <h1 className="mt-12 text-[64px] leading-[0.95] tracking-tight">
            {title} <span className="text-[var(--gold)]">SmartEstate</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-white/70">{subtitle}</p>
          <div className="mt-10 grid grid-cols-3 gap-3 max-w-md">
            {side}
          </div>
        </div>

        <div
          className="surface-card !rounded-[24px] !border-white/10 !bg-[rgba(9,18,35,0.78)] !p-8 text-white shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-md"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function SidePillar({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="rounded-2xl border border-white/8 bg-white/5 p-4 backdrop-blur"
    >
      <div className="text-xs uppercase tracking-wider text-white/55">{label}</div>
      <div className="mt-1 text-lg font-extrabold text-white">{value}</div>
    </div>
  );
}

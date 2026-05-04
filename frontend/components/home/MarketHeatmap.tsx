"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDownIcon } from "@/components/ui/Button";
import { clsx } from "clsx";

type AreaKey = "abdoun" | "dabouq" | "khalda";

type AreaData = {
  title: string;
  subtitle: string;
  score: string;
  badge: string;
  position: string;
  fill: number;
  price: string;
  priceNote: string;
  trend: string;
  trendNote: string;
  risk: string;
  riskNote: string;
  bestFor: string;
  bestForNote: string;
  tag: string;
  summary: string;
  reasons: string[];
};

const AREAS: Record<AreaKey, AreaData> = {
  abdoun: {
    title: "Abdoun",
    subtitle:
      "Premium district with strong pricing stability and excellent long-term appeal.",
    score: "9.2",
    badge: "Luxury",
    position: "left-[6%] top-[14%]",
    fill: 92,
    price: "1,850 JOD/m²",
    priceNote: "High-value market",
    trend: "Rising",
    trendNote: "+6% annual momentum",
    risk: "Low",
    riskNote: "Stable premium segment",
    bestFor: "Luxury living",
    bestForNote: "Also strong for prestige investment",
    tag: "Featured zone",
    summary:
      "Abdoun is a strong premium-market choice for users seeking stability, high-end positioning, and long-term value retention. Entry costs are higher, but the area remains one of the most attractive options for luxury residential decisions.",
    reasons: [
      "Strong district reputation supports price resilience.",
      "High-income residential profile improves long-term demand quality.",
      "Suitable for premium homes, upscale apartments, and prestige buyers.",
    ],
  },
  dabouq: {
    title: "Dabouq",
    subtitle:
      "Elite villa-focused area with strong prestige positioning and quality residential stock.",
    score: "8.8",
    badge: "Villa",
    position: "right-[10%] top-[26%]",
    fill: 88,
    price: "1,650 JOD/m²",
    priceNote: "Premium villa market",
    trend: "Stable",
    trendNote: "Consistent long-term demand",
    risk: "Low",
    riskNote: "Low volatility segment",
    bestFor: "Upscale villas",
    bestForNote: "Best for high-end family homes",
    tag: "Long-term hold",
    summary:
      "Dabouq performs well for buyers focused on upscale residential value, privacy, and strong neighborhood status. It is less dynamic than mass-demand zones, but it offers strong long-term positioning for premium property decisions.",
    reasons: [
      "Known for upscale homes and strong residential quality.",
      "Appeals to buyers seeking privacy, space, and premium neighborhood identity.",
      "Suitable for long-term ownership and selective high-value investment.",
    ],
  },
  khalda: {
    title: "Khalda",
    subtitle:
      "Balanced residential market with broad demand and flexible buyer interest.",
    score: "8.5",
    badge: "Balanced",
    position: "left-1/2 -translate-x-1/2 bottom-[14%]",
    fill: 85,
    price: "1,250 JOD/m²",
    priceNote: "Accessible mid-high segment",
    trend: "Rising",
    trendNote: "+4% annual momentum",
    risk: "Medium",
    riskNote: "More competition in supply",
    bestFor: "Mixed demand",
    bestForNote: "Good for living and practical investment",
    tag: "Balanced choice",
    summary:
      "Khalda offers one of the most practical balances between price, demand, and livability. It works well for users who want a strong everyday residential area with good market activity and more accessible entry points than ultra-premium zones.",
    reasons: [
      "Broad demand profile supports strong transaction activity.",
      "More accessible pricing makes it attractive for wider buyer groups.",
      "Useful for both residential living and practical investment entry.",
    ],
  },
};

export function MarketHeatmap() {
  const [active, setActive] = useState<AreaKey>("abdoun");
  const data = AREAS[active];

  return (
    <section
      id="places"
      className="reveal relative overflow-hidden text-white"
      style={{
        background:
          "linear-gradient(120deg,#020816 0%, #08142f 45%, #323d52 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg,var(--grid) 1px, transparent 1px)",
          backgroundSize: "92px 92px",
          opacity: 0.96,
        }}
      />
      <div className="container relative z-10 py-24">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[44px] tracking-tight md:text-[56px]">
              <span className="text-[var(--gold)]">AI Market Insights</span> – Amman
            </h2>
            <p className="mt-3 max-w-[480px] text-sm leading-7 text-white/70">
              Explore area-level intelligence, compare demand strength,
              understand pricing direction, and see which neighborhoods offer
              the best fit for living or investment.
            </p>
          </div>
          <Link href="/areas" className="gold-btn">
            View Market Areas <ArrowDownIcon />
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="dark-panel relative overflow-hidden p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-[28px] tracking-tight">Interactive Area Heatmap</h3>
                <p className="mt-1 max-w-[430px] text-sm text-white/70">
                  Click any zone to view SmartEstate AI signals, demand
                  intensity, pricing quality, and suitability guidance.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Chip color="bg-[var(--success)]">High demand</Chip>
                  <Chip color="bg-[var(--warning)]">Balanced market</Chip>
                  <Chip color="bg-[var(--danger)]">Higher entry risk</Chip>
                </div>
              </div>
              <span className="rounded-full bg-white/8 px-3 py-1 text-[11px] font-bold text-white/80">
                Live preview
              </span>
            </div>

            <div className="relative mt-2 min-h-[390px] overflow-hidden rounded-3xl border border-white/8">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                  backgroundSize: "42px 42px",
                }}
              />
              <div className="pointer-events-none absolute inset-4 rounded-3xl border border-dashed border-white/8" />
              <span className="absolute left-1/2 top-5 -translate-x-1/2 text-[12px] font-bold uppercase tracking-wider text-white/40">
                North Amman
              </span>
              <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[12px] font-bold uppercase tracking-wider text-white/40">
                South Amman
              </span>

              {(Object.keys(AREAS) as AreaKey[]).map((key) => {
                const a = AREAS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActive(key)}
                    className={clsx(
                      "absolute flex min-w-[160px] flex-col gap-1 rounded-3xl border border-white/12 bg-[rgba(8,16,30,0.58)] p-4 text-left text-white backdrop-blur transition",
                      a.position,
                      active === key
                        ? "-translate-y-1 border-[var(--gold)] bg-gradient-to-b from-[rgba(242,201,76,0.22)] to-white/5 shadow-[0_18px_38px_rgba(0,0,0,0.28)]"
                        : "hover:-translate-y-1 hover:border-[var(--gold)]/40"
                    )}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <strong className="text-[18px]">{a.title}</strong>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-extrabold">
                        {a.badge}
                      </span>
                    </span>
                    <small className="text-[11px] text-white/65">
                      {a.title === "Abdoun"
                        ? "Premium demand · stable high-end"
                        : a.title === "Dabouq"
                        ? "Elite homes · strong long-term"
                        : "Broad appeal · flexible mid-high"}
                    </small>
                    <span className="mt-1 flex items-center gap-2 text-[12px] font-bold">
                      <span>{a.score}</span>
                      <span className="h-[6px] flex-1 overflow-hidden rounded-full bg-white/10">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${a.fill}%`,
                            background:
                              "linear-gradient(90deg, var(--gold), #ffe08a)",
                          }}
                        />
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="dark-panel flex flex-col gap-4 p-6">
            <span className="inline-flex w-max items-center gap-2 rounded-full bg-[rgba(242,201,76,0.14)] px-3 py-1.5 text-[12px] font-extrabold uppercase tracking-wider text-[var(--gold)]">
              SmartEstate AI Analysis
            </span>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[32px] tracking-tight">{data.title}</h3>
                <p className="mt-1 max-w-[360px] text-sm leading-7 text-white/70">
                  {data.subtitle}
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/5 px-4 py-3 text-center">
                <strong className="block text-[26px] text-white">{data.score}</strong>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/55">
                  AI Score
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Insight label="Average price" value={data.price} hint={data.priceNote} />
              <Insight label="Demand trend" value={data.trend} hint={data.trendNote} />
              <Insight label="Risk level" value={data.risk} hint={data.riskNote} />
              <Insight label="Best for" value={data.bestFor} hint={data.bestForNote} />
            </div>

            <div className="rounded-3xl border border-white/8 bg-white/5 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="text-[18px] text-white">Why AI likes this area</h4>
                <span className="rounded-full bg-white/8 px-2.5 py-1 text-[11px] font-bold text-white/75">
                  {data.tag}
                </span>
              </div>
              <ul className="grid gap-2">
                {data.reasons.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-3 text-sm leading-7 text-white/85"
                  >
                    <span className="grid h-[22px] w-[22px] flex-none place-items-center rounded-full bg-[rgba(242,201,76,0.18)] text-[12px] font-extrabold text-[var(--gold)]">
                      ✓
                    </span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="rounded-3xl border border-white/8 bg-white/5 p-4 text-sm leading-7 text-white/80">
              {data.summary}
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/areas" className="gold-btn">
                Full area report <ArrowDownIcon />
              </Link>
              <Link href="/property-estimator" className="ghost-btn">
                Run a property estimate
              </Link>
            </div>
          </aside>
        </div>
      </div>

      <div
        className="absolute bottom-[-110px] left-[-8%] right-[-8%] z-[1] h-[220px]"
        style={{
          background: "var(--bg)",
          borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
        }}
      />
    </section>
  );
}

function Chip({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/6 px-3 py-1.5 text-[12px] font-bold text-white">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {children}
    </span>
  );
}

function Insight({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-3xl border border-white/8 bg-white/5 p-4">
      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-white/55">
        {label}
      </span>
      <strong className="mt-1 block text-[20px] text-white">{value}</strong>
      <span className="text-[11px] text-white/65">{hint}</span>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Sparkles, TreePine } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { formatNumber } from "@/lib/utils";

type LandResponse = {
  predictedLandValueJod: number;
  predictedPricePerSqmJod: number;
  fairnessLabel: "Underpriced" | "Overpriced" | "Fair Price" | "N/A";
  priceRatio: number | null;
  differenceJod: number | null;
  differencePct: number | null;
  recommendationText: string;
  inputUsed: Record<string, unknown>;
};

export function LandValuationForm() {
  const { toast } = useToast();
  const [districts, setDistricts] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LandResponse | null>(null);

  const [district, setDistrict] = useState("Abdoun");
  const [areaName, setAreaName] = useState("Abdoun South");
  const [landAreaSqm, setLandAreaSqm] = useState("500");
  const [landType, setLandType] = useState<
    "residential" | "commercial" | "agricultural"
  >("residential");
  const [streetWidth, setStreetWidth] = useState("12");
  const [mainRoadAccess, setMainRoadAccess] = useState(false);
  const [nearServices, setNearServices] = useState(true);
  const [zoningCategory, setZoningCategory] = useState("B");
  const [zoningScore, setZoningScore] = useState("6.5");
  const [developmentLevel, setDevelopmentLevel] = useState<
    "low" | "medium" | "high" | "prime"
  >("high");
  const [cornerPlot, setCornerPlot] = useState(false);
  const [shapeRegular, setShapeRegular] = useState(true);
  const [slopeLevel, setSlopeLevel] = useState<"flat" | "moderate" | "steep">(
    "flat"
  );
  const [askingPrice, setAskingPrice] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/ai/land", { method: "GET" });
        const json = (await res.json()) as { districts?: string[] };
        if (!active) return;
        const list = Array.isArray(json.districts) ? json.districts : [];
        setDistricts(list);
        setDistrict((d) => d || list[0] || "Abdoun");
      } catch {
        // keep default
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const body = {
        district,
        areaName,
        landAreaSqm: Number(landAreaSqm),
        landType,
        streetWidthM: Number(streetWidth),
        mainRoadAccess,
        nearServices,
        zoningCategory,
        zoningScore: Number(zoningScore),
        developmentLevel,
        cornerPlot,
        shapeRegular,
        slopeLevel,
        askingPriceJod: askingPrice ? Number(askingPrice) : undefined,
      };

      const res = await fetch("/api/ai/land", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message || json.detail || "Could not run land AI.");
        toast(json.message || json.detail || "AI failed.", "error");
        return;
      }
      setResult(json as LandResponse);
      toast("Land valuation ready.", "success");
    } catch {
      setError("Could not reach the AI service.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr]">
      <form onSubmit={onSubmit} className="surface-card !p-7 flex flex-col gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label="District"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            options={
              districts.length
                ? districts.map((d) => ({ value: d, label: d }))
                : [{ value: district, label: district }]
            }
          />
          <Input
            label="Area / locality name"
            value={areaName}
            onChange={(e) => setAreaName(e.target.value)}
          />
          <Input
            label="Land area (m²)"
            inputMode="numeric"
            required
            value={landAreaSqm}
            onChange={(e) => setLandAreaSqm(e.target.value)}
          />
          <Select
            label="Land type"
            value={landType}
            onChange={(e) =>
              setLandType(
                e.target.value as "residential" | "commercial" | "agricultural"
              )
            }
            options={[
              { value: "residential", label: "Residential" },
              { value: "commercial", label: "Commercial" },
              { value: "agricultural", label: "Agricultural" },
            ]}
          />
          <Input
            label="Street width (m)"
            inputMode="decimal"
            value={streetWidth}
            onChange={(e) => setStreetWidth(e.target.value)}
          />
          <Input
            label="Zoning category"
            value={zoningCategory}
            onChange={(e) => setZoningCategory(e.target.value)}
            placeholder="A, B, C…"
          />
          <Input
            label="Zoning score (0–10)"
            inputMode="decimal"
            value={zoningScore}
            onChange={(e) => setZoningScore(e.target.value)}
          />
          <Select
            label="Development level"
            value={developmentLevel}
            onChange={(e) =>
              setDevelopmentLevel(
                e.target.value as "low" | "medium" | "high" | "prime"
              )
            }
            options={[
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
              { value: "prime", label: "Prime" },
            ]}
          />
          <Select
            label="Slope"
            value={slopeLevel}
            onChange={(e) =>
              setSlopeLevel(e.target.value as "flat" | "moderate" | "steep")
            }
            options={[
              { value: "flat", label: "Flat" },
              { value: "moderate", label: "Moderate" },
              { value: "steep", label: "Steep" },
            ]}
          />
          <Input
            label="Asking price (JOD, optional)"
            inputMode="numeric"
            value={askingPrice}
            onChange={(e) => setAskingPrice(e.target.value)}
            placeholder="leave blank for value-only"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Toggle
            label="Main road access"
            value={mainRoadAccess}
            onChange={setMainRoadAccess}
          />
          <Toggle
            label="Near services"
            value={nearServices}
            onChange={setNearServices}
          />
          <Toggle label="Corner plot" value={cornerPlot} onChange={setCornerPlot} />
          <Toggle
            label="Regular shape"
            value={shapeRegular}
            onChange={setShapeRegular}
          />
        </div>

        {error ? (
          <div className="rounded-2xl border border-[rgba(255,107,107,0.32)] bg-[rgba(255,107,107,0.08)] p-3 text-sm text-[var(--danger)]">
            {error}
          </div>
        ) : null}

        <Button type="submit" disabled={busy}>
          <TreePine size={16} />
          {busy ? "Valuing…" : "Run land AI"}
        </Button>
      </form>

      <aside className="flex flex-col gap-4">
        {result ? (
          <>
            <div className="surface-card !p-7">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Predicted land value
              </p>
              <strong className="block text-[42px] leading-none text-[var(--gold-deep)]">
                {formatNumber(result.predictedLandValueJod)} JOD
              </strong>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {formatNumber(result.predictedPricePerSqmJod)} JOD / m²
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <Metric
                  label="Fairness"
                  value={result.fairnessLabel}
                  hint={
                    result.differenceJod !== null
                      ? `${result.differenceJod >= 0 ? "+" : ""}${formatNumber(
                          result.differenceJod
                        )} JOD`
                      : "Add asking price to compare"
                  }
                />
                <Metric
                  label="Asking ratio"
                  value={
                    result.priceRatio !== null
                      ? `${(result.priceRatio * 100).toFixed(1)}%`
                      : "—"
                  }
                  hint={
                    result.differencePct !== null
                      ? `${result.differencePct >= 0 ? "+" : ""}${result.differencePct.toFixed(
                          1
                        )}% vs model`
                      : ""
                  }
                />
              </div>

              <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-[var(--muted)]">
                <Sparkles size={12} />
                Random Forest pipeline trained on the synthetic land dataset.
              </p>
            </div>

            <div className="surface-card !p-7">
              <h3 className="text-[20px] tracking-tight">Recommendation</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--ink)]/80">
                {result.recommendationText}
              </p>
            </div>
          </>
        ) : (
          <div className="surface-card !p-7 text-center text-[var(--muted)]">
            Run the land AI to see predicted value, fairness, and a written
            recommendation.
          </div>
        )}
      </aside>
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex items-center justify-between gap-2 rounded-2xl border px-3 py-2.5 text-sm font-bold transition ${
        value
          ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold-deep)]"
          : "border-black/10 text-[var(--ink)] hover:bg-black/5"
      }`}
    >
      <span>{label}</span>
      <span
        className={`inline-flex h-5 w-9 items-center rounded-full p-0.5 transition ${
          value ? "bg-[var(--gold)]" : "bg-black/15"
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-white transition-transform ${
            value ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-black/[0.02] p-3">
      <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
        {label}
      </p>
      <strong className="mt-1 block text-[18px] text-[var(--ink)]">
        {value}
      </strong>
      {hint ? <span className="text-[11px] text-[var(--muted)]">{hint}</span> : null}
    </div>
  );
}

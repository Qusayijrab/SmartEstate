"use client";

import { useEffect, useState } from "react";
import { Camera, Sparkles, TrendingUp, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { formatNumber } from "@/lib/utils";

type PropertyResponse = {
  predictedPrice: number;
  modelEstimate: number | null;
  ruleBasedEstimate: number;
  range: { low: number; high: number; tolerance: number };
  conditionScore: number;
  imagesUsed: number;
  imageDetails: {
    name: string;
    brightness?: number;
    contrast?: number;
    sharpness?: number;
    score?: number;
    error?: string;
  }[];
  breakdown: {
    baseRate: number;
    basePrice: number;
    furnishedBonus: number;
    ageFactor: number;
    propertyTypeFactor: number;
    photoMultiplier: number;
    estimate: number;
  };
  usedModel: boolean;
  districtHint?: string | null;
};

export function PropertyEstimatorForm() {
  const { toast } = useToast();
  const [districts, setDistricts] = useState<string[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PropertyResponse | null>(null);

  const [area, setArea] = useState("145");
  const [bedrooms, setBedrooms] = useState("3");
  const [bathrooms, setBathrooms] = useState("2");
  const [floor, setFloor] = useState("3");
  const [buildingAge, setBuildingAge] = useState("5");
  const [district, setDistrict] = useState("");
  const [propertyType, setPropertyType] = useState<"apartment" | "house">("apartment");
  const [furnished, setFurnished] = useState<"yes" | "no">("no");
  const [neighborhood, setNeighborhood] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/ai/property", { method: "GET" });
        const json = (await res.json()) as { districts?: string[] };
        if (!active) return;
        const list = Array.isArray(json.districts) ? json.districts : [];
        setDistricts(list);
        setDistrict((d) => d || list[0] || "Abdoun");
      } catch {
        setDistrict("Abdoun");
      } finally {
        if (active) setLoadingDistricts(false);
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
      const form = new FormData();
      form.set("area", area);
      form.set("bedrooms", bedrooms);
      form.set("bathrooms", bathrooms);
      form.set("floor", floor);
      form.set("buildingAge", buildingAge);
      form.set("district", district);
      form.set("propertyType", propertyType);
      form.set("furnished", furnished);
      if (neighborhood) form.set("neighborhood", neighborhood);
      files.forEach((f) => form.append("images", f));

      const res = await fetch("/api/ai/property", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message || json.detail || "Could not run property AI.");
        toast(json.message || json.detail || "AI failed.", "error");
        return;
      }
      setResult(json as PropertyResponse);
      toast("Property estimate ready.", "success");
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
          <Input
            label="Area (m²)"
            inputMode="numeric"
            required
            value={area}
            onChange={(e) => setArea(e.target.value)}
          />
          <Select
            label="Property type"
            value={propertyType}
            onChange={(e) =>
              setPropertyType(e.target.value as "apartment" | "house")
            }
            options={[
              { value: "apartment", label: "Apartment" },
              { value: "house", label: "House" },
            ]}
          />
          <Input
            label="Bedrooms"
            inputMode="numeric"
            required
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
          />
          <Input
            label="Bathrooms"
            inputMode="numeric"
            required
            value={bathrooms}
            onChange={(e) => setBathrooms(e.target.value)}
          />
          <Input
            label="Floor"
            inputMode="numeric"
            required
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
          />
          <Input
            label="Building age (yrs)"
            inputMode="numeric"
            required
            value={buildingAge}
            onChange={(e) => setBuildingAge(e.target.value)}
          />
          <Select
            label="District"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            options={
              loadingDistricts
                ? [{ value: "", label: "Loading…" }]
                : districts.map((d) => ({ value: d, label: d }))
            }
          />
          <Input
            label="Neighborhood (optional)"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            placeholder="defaults to district"
          />
          <Select
            label="Furnished?"
            value={furnished}
            onChange={(e) => setFurnished(e.target.value as "yes" | "no")}
            options={[
              { value: "no", label: "No" },
              { value: "yes", label: "Yes" },
            ]}
          />
        </div>

        <label
          htmlFor="prop-photos"
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black/10 bg-black/[0.02] p-7 text-center text-sm text-[var(--muted)] hover:border-[var(--gold)] hover:text-[var(--ink)]"
        >
          <Upload size={20} />
          <span className="font-bold text-[var(--ink)]">
            {files.length
              ? `${files.length} photo(s) ready`
              : "Add photos for AI condition scoring"}
          </span>
          <span>JPG, PNG, WEBP — up to 20 photos</span>
          <input
            id="prop-photos"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const list = Array.from(e.target.files ?? []);
              setFiles(list.slice(0, 20));
            }}
          />
        </label>

        {error ? (
          <div className="rounded-2xl border border-[rgba(255,107,107,0.32)] bg-[rgba(255,107,107,0.08)] p-3 text-sm text-[var(--danger)]">
            {error}
          </div>
        ) : null}

        <Button type="submit" disabled={busy}>
          <TrendingUp size={16} />
          {busy ? "Estimating…" : "Run property AI"}
        </Button>
      </form>

      <aside className="flex flex-col gap-4">
        {result ? (
          <>
            <div className="surface-card !p-7">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Predicted price
              </p>
              <strong className="block text-[42px] leading-none text-[var(--gold-deep)]">
                {formatNumber(result.predictedPrice)} JOD
              </strong>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Range {formatNumber(result.range.low)} –{" "}
                {formatNumber(result.range.high)} JOD (±
                {Math.round(result.range.tolerance * 100)}%)
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Metric
                  label="Model estimate"
                  value={
                    result.modelEstimate !== null
                      ? `${formatNumber(result.modelEstimate)}`
                      : "—"
                  }
                  hint="JOD"
                />
                <Metric
                  label="Rule-based"
                  value={`${formatNumber(result.ruleBasedEstimate)}`}
                  hint="JOD"
                />
                <Metric
                  label="Photo score"
                  value={result.conditionScore.toFixed(2)}
                  hint={`${result.imagesUsed} photo(s)`}
                />
                <Metric
                  label="Base /m²"
                  value={`${formatNumber(result.breakdown.baseRate)} JOD`}
                  hint="District prior"
                />
              </div>
              <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-[var(--muted)]">
                <Sparkles size={12} />
                {result.usedModel
                  ? "ML model + photo score"
                  : "Rule-based fallback (model unavailable)"}
              </p>
              {result.districtHint ? (
                <p className="mt-2 rounded-xl bg-[rgba(255,176,32,0.12)] p-3 text-xs text-[#a06a00]">
                  {result.districtHint}
                </p>
              ) : null}
            </div>

            {result.imageDetails.length ? (
              <div className="surface-card !p-7">
                <h3 className="mb-3 text-[20px] tracking-tight">Photo analysis</h3>
                <ul className="flex flex-col gap-2">
                  {result.imageDetails.map((img) => (
                    <li
                      key={img.name}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-black/5 bg-black/[0.02] p-3"
                    >
                      <span className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[rgba(242,201,76,0.16)] text-[#7d5c00]">
                          <Camera size={16} />
                        </span>
                        <span className="truncate text-sm">{img.name}</span>
                      </span>
                      {img.error ? (
                        <span className="text-xs text-[var(--danger)]">
                          {img.error}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--muted)]">
                          score{" "}
                          <strong className="text-[var(--ink)]">
                            {img.score?.toFixed(2)}
                          </strong>{" "}
                          · brightness {img.brightness?.toFixed(2)} · sharp{" "}
                          {img.sharpness?.toFixed(2)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : (
          <div className="surface-card !p-7 text-center text-[var(--muted)]">
            Provide property details and (optionally) photos to get an AI
            assisted price with a fairness range.
          </div>
        )}
      </aside>
    </div>
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

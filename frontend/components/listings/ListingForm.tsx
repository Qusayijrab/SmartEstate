"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import type { ListingDTO } from "@/lib/listings";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

type Mode = "create" | "edit";

type Props = {
  mode: Mode;
  initial?: ListingDTO;
};

const PROPERTY_TYPES = ["apartment", "villa", "studio", "office", "shop", "land"];

export function ListingForm({ mode, initial }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState(initial?.type ?? "apartment");
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");
  const [size, setSize] = useState(initial?.size?.toString() ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [areaName, setAreaName] = useState(initial?.areaName ?? "");
  const [bedrooms, setBedrooms] = useState(initial?.bedrooms?.toString() ?? "0");
  const [bathrooms, setBathrooms] = useState(initial?.bathrooms?.toString() ?? "0");
  const [floor, setFloor] = useState(initial?.floor ?? "");
  const [buildingAge, setBuildingAge] = useState(initial?.buildingAge ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [extras, setExtras] = useState<string[]>(initial?.extras ?? []);
  const [extrasDraft, setExtrasDraft] = useState("");
  const [aiPricing, setAiPricing] = useState<"yes" | "no">(initial?.trust === "ai" ? "yes" : "no");
  const [estimatedYield, setEstimatedYield] = useState(
    initial?.estimatedYield?.toString() ?? ""
  );
  const [demandScore, setDemandScore] = useState(initial?.demandScore?.toString() ?? "");
  const [aiConfidence, setAiConfidence] = useState(
    initial?.aiConfidence !== null && initial?.aiConfidence !== undefined
      ? String(initial.aiConfidence)
      : ""
  );
  const [nearbyDevelopment, setNearbyDevelopment] = useState(
    initial?.nearbyDevelopment ?? ""
  );
  const [sellerNote, setSellerNote] = useState(
    initial?.sellerNote ?? "Ready for buyer inquiries"
  );
  const [status, setStatus] = useState<"available" | "sold">(
    (initial?.status as "available" | "sold") || "available"
  );
  const [existingImages, setExistingImages] = useState<{ src: string; label: string }[]>(
    initial?.images ?? []
  );
  const [files, setFiles] = useState<File[]>([]);

  function addExtra() {
    const v = extrasDraft.trim();
    if (!v) return;
    if (extras.includes(v)) {
      setExtrasDraft("");
      return;
    }
    setExtras((arr) => [...arr, v]);
    setExtrasDraft("");
  }

  function removeExtra(value: string) {
    setExtras((arr) => arr.filter((e) => e !== value));
  }

  function removeExisting(src: string) {
    setExistingImages((arr) => arr.filter((img) => img.src !== src));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setIssues({});

    const form = new FormData();
    form.set("title", title);
    form.set("type", type);
    form.set("price", price);
    form.set("size", size);
    form.set("location", location);
    form.set("areaName", areaName);
    form.set("bedrooms", bedrooms);
    form.set("bathrooms", bathrooms);
    if (floor) form.set("floor", floor);
    if (buildingAge) form.set("buildingAge", buildingAge);
    if (description) form.set("description", description);
    form.set("aiPricing", aiPricing);
    if (estimatedYield) form.set("estimatedYield", estimatedYield);
    if (demandScore) form.set("demandScore", demandScore);
    if (aiConfidence) form.set("aiConfidence", aiConfidence);
    if (nearbyDevelopment) form.set("nearbyDevelopment", nearbyDevelopment);
    form.set("sellerNote", sellerNote);
    form.set("status", status);

    extras.forEach((v) => form.append("extras", v));
    existingImages.forEach((img) => form.append("existingImages", img.src));
    files.forEach((file) => form.append("images", file));

    const url =
      mode === "create" ? "/api/listings" : `/api/listings/${initial?.id}`;
    const method = mode === "create" ? "POST" : "PUT";

    try {
      const res = await fetch(url, { method, body: form });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setIssues(json.issues || {});
        setError(json.message || "Could not save listing.");
        toast(json.message || "Could not save listing.", "error");
        return;
      }
      toast(
        mode === "create" ? "Listing posted." : "Listing updated.",
        "success"
      );
      router.refresh();
      router.push(`/property-details/${json.listing.id}`);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      <div className="flex flex-col gap-5">
        <section className="surface-card !p-7">
          <h3 className="text-[22px] tracking-tight text-[var(--ink)]">
            Basics
          </h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Input
              label="Listing title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={issues.title}
              placeholder="Bright Abdoun apartment"
            />
            <Select
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={PROPERTY_TYPES.map((t) => ({
                value: t,
                label: t.charAt(0).toUpperCase() + t.slice(1),
              }))}
            />
            <Input
              label="Price (JOD)"
              required
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              error={issues.price}
            />
            <Input
              label="Size (m²)"
              required
              inputMode="numeric"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              error={issues.size}
            />
            <Input
              label="Location"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Abdoun, West Amman"
              error={issues.location}
            />
            <Input
              label="Area name"
              required
              value={areaName}
              onChange={(e) => setAreaName(e.target.value)}
              placeholder="Abdoun"
              error={issues.areaName}
            />
            <Input
              label="Bedrooms"
              inputMode="numeric"
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
            />
            <Input
              label="Bathrooms"
              inputMode="numeric"
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
            />
            <Input
              label="Floor"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              placeholder="3"
            />
            <Input
              label="Building age (years)"
              value={buildingAge}
              onChange={(e) => setBuildingAge(e.target.value)}
              placeholder="5"
            />
          </div>
          <Textarea
            className="mt-4"
            label="Description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell buyers what makes this property stand out."
          />
        </section>

        <section className="surface-card !p-7">
          <h3 className="text-[22px] tracking-tight text-[var(--ink)]">Extras</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            One per chip. Press add to append.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {extras.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => removeExtra(v)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f5f7] px-3 py-1.5 text-[12px] font-bold text-[#344054] hover:bg-[rgba(255,107,107,0.12)] hover:text-[var(--danger)]"
              >
                {v} <Trash2 size={12} />
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              className="flex-1 rounded-full border border-black/10 bg-white px-4 py-2 text-sm focus:border-[var(--gold)] focus:outline-none focus:ring-4 focus:ring-[rgba(242,201,76,0.18)]"
              placeholder="e.g. Garden, Solar water"
              value={extrasDraft}
              onChange={(e) => setExtrasDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addExtra();
                }
              }}
            />
            <Button type="button" variant="small-gold" onClick={addExtra}>
              <Plus size={14} /> Add
            </Button>
          </div>
        </section>

        <section className="surface-card !p-7">
          <h3 className="text-[22px] tracking-tight text-[var(--ink)]">Photos</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Upload up to 8 photos. The first one becomes the cover.
          </p>

          {existingImages.length ? (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {existingImages.map((img) => (
                <div
                  key={img.src}
                  className="group relative h-[110px] overflow-hidden rounded-2xl border border-black/5"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.src}
                    alt={img.label}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeExisting(img.src)}
                    aria-label="Remove photo"
                    className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/95 text-[var(--danger)] opacity-0 transition group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <label
            htmlFor="listing-images"
            className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black/10 bg-black/[0.02] p-7 text-center text-sm text-[var(--muted)] hover:border-[var(--gold)] hover:text-[var(--ink)]"
          >
            <Upload size={20} />
            <span className="font-bold text-[var(--ink)]">
              {files.length
                ? `${files.length} new photo(s) selected`
                : "Click to add photos"}
            </span>
            <span>JPG, PNG, WEBP — up to 8 MB each</span>
            <input
              id="listing-images"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const list = Array.from(e.target.files ?? []);
                setFiles(list.slice(0, 8));
              }}
            />
          </label>
        </section>
      </div>

      <aside className="flex flex-col gap-5">
        <section className="surface-card !p-7">
          <h3 className="text-[22px] tracking-tight text-[var(--ink)]">
            AI signals (optional)
          </h3>
          <div className="mt-4 grid gap-4">
            <Select
              label="Use AI assisted price?"
              value={aiPricing}
              onChange={(e) =>
                setAiPricing(e.target.value as "yes" | "no")
              }
              options={[
                { value: "no", label: "No, seller-set" },
                { value: "yes", label: "Yes, AI assisted" },
              ]}
            />
            <Input
              label="Estimated yield (%)"
              inputMode="decimal"
              value={estimatedYield}
              onChange={(e) => setEstimatedYield(e.target.value)}
              placeholder="6.4"
            />
            <Input
              label="Demand score (/10)"
              inputMode="decimal"
              value={demandScore}
              onChange={(e) => setDemandScore(e.target.value)}
              placeholder="8.7"
            />
            <Input
              label="AI confidence (0–1)"
              inputMode="decimal"
              value={aiConfidence}
              onChange={(e) => setAiConfidence(e.target.value)}
              placeholder="0.86"
            />
          </div>
        </section>

        <section className="surface-card !p-7">
          <h3 className="text-[22px] tracking-tight text-[var(--ink)]">
            Context
          </h3>
          <div className="mt-4 flex flex-col gap-4">
            <Textarea
              label="Nearby development"
              rows={3}
              value={nearbyDevelopment}
              onChange={(e) => setNearbyDevelopment(e.target.value)}
              placeholder="Schools, malls, hospitals, road projects…"
            />
            <Input
              label="Seller note"
              value={sellerNote}
              onChange={(e) => setSellerNote(e.target.value)}
            />
            <Select
              label="Status"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "available" | "sold")
              }
              options={[
                { value: "available", label: "Available" },
                { value: "sold", label: "Sold" },
              ]}
            />
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-[rgba(255,107,107,0.32)] bg-[rgba(255,107,107,0.08)] p-4 text-sm text-[var(--danger)]">
            {error}
          </div>
        ) : null}

        <Button type="submit" disabled={busy}>
          {busy
            ? mode === "create"
              ? "Posting…"
              : "Saving…"
            : mode === "create"
            ? "Post listing"
            : "Save changes"}
        </Button>
      </aside>
    </form>
  );
}

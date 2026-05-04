"use client";

import { Search } from "lucide-react";
import { Input, Select } from "@/components/ui/Input";

export type Filters = {
  query: string;
  type: string;
  area: string;
  minPrice: string;
  maxPrice: string;
  minBeds: string;
  trust: string;
};

export const initialFilters: Filters = {
  query: "",
  type: "any",
  area: "any",
  minPrice: "",
  maxPrice: "",
  minBeds: "any",
  trust: "any",
};

type Props = {
  filters: Filters;
  onChange: (next: Filters) => void;
  onReset: () => void;
  areas: string[];
  types: string[];
};

export function FilterSidebar({ filters, onChange, onReset, areas, types }: Props) {
  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <aside className="surface-card flex flex-col gap-5 !p-6">
      <div>
        <h3 className="mb-1 text-[22px] tracking-tight text-[var(--ink)]">Filter listings</h3>
        <p className="text-sm text-[var(--muted)]">Narrow down by area, price, and trust signal.</p>
      </div>

      <Input
        label="Search"
        placeholder="title, area, location"
        value={filters.query}
        onChange={(e) => set("query", e.target.value)}
        type="search"
      />

      <Select
        label="Property type"
        value={filters.type}
        onChange={(e) => set("type", e.target.value)}
        options={[
          { value: "any", label: "Any type" },
          ...types.map((t) => ({
            value: t,
            label: t.charAt(0).toUpperCase() + t.slice(1),
          })),
        ]}
      />

      <Select
        label="Area"
        value={filters.area}
        onChange={(e) => set("area", e.target.value)}
        options={[
          { value: "any", label: "Any area" },
          ...areas.map((a) => ({ value: a, label: a })),
        ]}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Min price"
          inputMode="numeric"
          placeholder="0"
          value={filters.minPrice}
          onChange={(e) => set("minPrice", e.target.value)}
        />
        <Input
          label="Max price"
          inputMode="numeric"
          placeholder="—"
          value={filters.maxPrice}
          onChange={(e) => set("maxPrice", e.target.value)}
        />
      </div>

      <Select
        label="Min bedrooms"
        value={filters.minBeds}
        onChange={(e) => set("minBeds", e.target.value)}
        options={[
          { value: "any", label: "Any" },
          { value: "1", label: "1+" },
          { value: "2", label: "2+" },
          { value: "3", label: "3+" },
          { value: "4", label: "4+" },
        ]}
      />

      <Select
        label="Trust"
        value={filters.trust}
        onChange={(e) => set("trust", e.target.value)}
        options={[
          { value: "any", label: "Any" },
          { value: "ai", label: "AI Price Assisted" },
          { value: "manual", label: "Seller Price Only" },
        ]}
      />

      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 px-4 py-2.5 text-sm font-bold text-[var(--ink)] transition hover:bg-black/5"
      >
        <Search size={14} /> Reset filters
      </button>
    </aside>
  );
}

export function applyFilters(items: { type: string; areaName: string; price: number; bedrooms: number; trust: string; title: string; location: string }[], filters: Filters) {
  const q = filters.query.trim().toLowerCase();
  const min = filters.minPrice ? Number(filters.minPrice) : null;
  const max = filters.maxPrice ? Number(filters.maxPrice) : null;
  const minBeds = filters.minBeds && filters.minBeds !== "any" ? Number(filters.minBeds) : null;

  return items.filter((it) => {
    if (filters.type !== "any" && it.type !== filters.type) return false;
    if (filters.area !== "any" && it.areaName !== filters.area) return false;
    if (filters.trust !== "any" && it.trust !== filters.trust) return false;
    if (min !== null && it.price < min) return false;
    if (max !== null && it.price > max) return false;
    if (minBeds !== null && it.bedrooms < minBeds) return false;
    if (q) {
      const haystack = `${it.title} ${it.areaName} ${it.location}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

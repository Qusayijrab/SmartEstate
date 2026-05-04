"use client";

import { useMemo, useState } from "react";
import { ListingCard } from "@/components/listings/ListingCard";
import {
  FilterSidebar,
  applyFilters,
  initialFilters,
  type Filters,
} from "@/components/listings/FilterSidebar";
import type { ListingDTO } from "@/lib/listings";

export function MarketplaceList({
  initialListings,
  signedIn: _signedIn,
}: {
  initialListings: ListingDTO[];
  signedIn: boolean;
}) {
  const [filters, setFilters] = useState<Filters>(initialFilters);

  const areas = useMemo(
    () =>
      Array.from(new Set(initialListings.map((l) => l.areaName).filter(Boolean))).sort(),
    [initialListings]
  );
  const types = useMemo(
    () =>
      Array.from(new Set(initialListings.map((l) => l.type).filter(Boolean))).sort(),
    [initialListings]
  );

  const filtered = useMemo(
    () => applyFilters(initialListings, filters),
    [initialListings, filters]
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <FilterSidebar
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(initialFilters)}
        areas={areas}
        types={types}
      />
      <div>
        <div className="mb-5 flex items-center justify-between text-sm text-[var(--muted)]">
          <span>{filtered.length} listings</span>
          <span>Sorted by newest</span>
        </div>
        {filtered.length === 0 ? (
          <div className="surface-card grid place-items-center !p-12 text-center text-[var(--muted)]">
            No listings match your filters yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Tabs } from "@/components/ui/Tabs";
import { ListingCard } from "@/components/listings/ListingCard";
import type { ListingDTO } from "@/lib/listings";

type Props = {
  myListings: ListingDTO[];
  favorites: ListingDTO[];
  comparisons: ListingDTO[];
};

export function DashboardTabs({ myListings, favorites, comparisons }: Props) {
  const [active, setActive] = useState("my");

  const tabs = [
    { id: "my", label: "My listings", count: myListings.length },
    { id: "favorites", label: "Favorites", count: favorites.length },
    { id: "compare", label: "Compare", count: comparisons.length },
  ];

  const visible =
    active === "my" ? myListings : active === "favorites" ? favorites : comparisons;

  const empty = (() => {
    if (active === "my") {
      return (
        <EmptyState
          title="You haven’t posted a property yet"
          subtitle="When you do, it shows up here for quick edits."
          actionLabel="Post a property"
          actionHref="/post-property"
        />
      );
    }
    if (active === "favorites") {
      return (
        <EmptyState
          title="No favorites yet"
          subtitle="Tap the heart on any listing to save it for later."
          actionLabel="Browse listings"
          actionHref="/marketplace"
        />
      );
    }
    return (
      <EmptyState
        title="Compare list is empty"
        subtitle="Pick up to 3 listings to see them side by side."
        actionLabel="Browse listings"
        actionHref="/marketplace"
      />
    );
  })();

  return (
    <div className="flex flex-col gap-6">
      <Tabs tabs={tabs} active={active} onChange={setActive} />
      {visible.length === 0 ? (
        empty
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
      {active === "compare" && comparisons.length > 0 ? (
        <div>
          <Link
            href="/compare"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-5 py-3 text-sm font-extrabold text-[#16181f] shadow-md transition hover:-translate-y-0.5"
          >
            Open side-by-side compare →
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function EmptyState({
  title,
  subtitle,
  actionLabel,
  actionHref,
}: {
  title: string;
  subtitle: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="surface-card grid place-items-center !p-12 text-center">
      <h3 className="text-[24px] tracking-tight text-[var(--ink)]">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-[var(--muted)]">{subtitle}</p>
      <Link
        href={actionHref}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-5 py-3 text-sm font-extrabold text-[#16181f] shadow-md"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

import Link from "next/link";
import { Bed, Bath, Ruler, MapPin, Sparkles } from "lucide-react";
import type { ListingDTO } from "@/lib/listings";
import { formatNumber } from "@/lib/utils";

type Props = { listing: ListingDTO };

export function ListingCard({ listing }: Props) {
  const cover = listing.images[0]?.src;
  return (
    <article className="surface-card flex flex-col gap-4 !p-4">
      <Link
        href={`/property-details/${listing.id}`}
        className="group relative block h-[200px] overflow-hidden rounded-2xl"
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-[#f4f3ee] to-[#e7e2d5] text-[var(--muted)]">
            No photo yet
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
          {listing.trust === "ai" ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold text-[#16181f]"
              style={{ background: "var(--gold)" }}
            >
              <Sparkles size={12} /> AI Price Assisted
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(13,21,40,0.78)] px-2.5 py-1 text-[11px] font-extrabold text-white">
              Seller Price
            </span>
          )}
          {listing.status === "sold" ? (
            <span className="inline-flex items-center rounded-full bg-[rgba(255,107,107,0.16)] px-2.5 py-1 text-[11px] font-extrabold text-[#ff8a8a]">
              SOLD
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/property-details/${listing.id}`}
            className="line-clamp-2 text-[18px] font-extrabold tracking-tight text-[var(--ink)] hover:underline"
          >
            {listing.title}
          </Link>
          <strong
            className="whitespace-nowrap text-[18px]"
            style={{ color: "var(--gold-deep)" }}
          >
            {formatNumber(listing.price)} JOD
          </strong>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--muted)]">
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={14} /> {listing.location}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Bed size={14} /> {listing.bedrooms} bd
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Bath size={14} /> {listing.bathrooms} ba
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Ruler size={14} /> {formatNumber(listing.size)} m²
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
            {listing.type}
          </span>
          <Link
            href={`/property-details/${listing.id}`}
            className="text-sm font-bold text-[var(--gold-deep)] hover:underline"
          >
            View details →
          </Link>
        </div>
      </div>
    </article>
  );
}

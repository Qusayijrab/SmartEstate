"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Heart, GitCompare, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

type Props = {
  listingId: string;
  currentUserId: number | null;
  ownerId: number;
  isFavoritedInitially: boolean;
  isComparedInitially: boolean;
};

export function ListingActions({
  listingId,
  currentUserId,
  ownerId,
  isFavoritedInitially,
  isComparedInitially,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [favorited, setFavorited] = useState(isFavoritedInitially);
  const [compared, setCompared] = useState(isComparedInitially);
  const [busy, setBusy] = useState(false);

  const isOwner = currentUserId !== null && currentUserId === ownerId;

  async function toggleFavorite() {
    if (!currentUserId) {
      router.push(`/login?next=/property-details/${listingId}`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(
        `/api/users/${currentUserId}/favorites/${listingId}`,
        { method: favorited ? "DELETE" : "POST" }
      );
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast(json.message || "Could not update favorite.", "error");
        return;
      }
      setFavorited(!favorited);
      toast(
        !favorited ? "Saved to favorites." : "Removed from favorites.",
        "success"
      );
    } finally {
      setBusy(false);
    }
  }

  async function toggleCompare() {
    if (!currentUserId) {
      router.push(`/login?next=/property-details/${listingId}`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(
        `/api/users/${currentUserId}/compare/${listingId}`,
        { method: compared ? "DELETE" : "POST" }
      );
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast(json.message || "Could not update compare list.", "error");
        return;
      }
      setCompared(!compared);
      toast(
        !compared ? "Added to compare list." : "Removed from compare list.",
        "success"
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteListing() {
    if (!confirm("Delete this listing? This cannot be undone.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast(json.message || "Could not delete listing.", "error");
        return;
      }
      toast("Listing deleted.", "success");
      router.refresh();
      router.push("/dashboard");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={toggleFavorite}
        disabled={busy}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition ${
          favorited
            ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold-deep)]"
            : "border-black/10 text-[var(--ink)] hover:bg-black/5"
        }`}
      >
        <Heart
          size={16}
          fill={favorited ? "currentColor" : "none"}
        />
        {favorited ? "Saved" : "Save to favorites"}
      </button>

      <button
        type="button"
        onClick={toggleCompare}
        disabled={busy}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition ${
          compared
            ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold-deep)]"
            : "border-black/10 text-[var(--ink)] hover:bg-black/5"
        }`}
      >
        <GitCompare size={16} />
        {compared ? "In compare list" : "Add to compare"}
      </button>

      {isOwner ? (
        <>
          <Link
            href={`/post-property/${listingId}/edit`}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--ink)] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--navy-2)]"
          >
            <Pencil size={16} /> Edit listing
          </Link>
          <button
            type="button"
            onClick={deleteListing}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,107,107,0.4)] px-4 py-2.5 text-sm font-bold text-[var(--danger)] transition hover:bg-[rgba(255,107,107,0.1)]"
          >
            <Trash2 size={16} /> Delete
          </button>
        </>
      ) : null}
    </div>
  );
}

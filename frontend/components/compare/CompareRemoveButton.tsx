"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function CompareRemoveButton({
  userId,
  listingId,
}: {
  userId: number;
  listingId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/users/${userId}/compare/${listingId}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast(json.message || "Could not update.", "error");
        return;
      }
      toast("Removed from compare list.", "success");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={remove}
      aria-label="Remove from compare"
      className="grid h-7 w-7 place-items-center rounded-full bg-black/5 text-[var(--ink)]/70 transition hover:bg-[rgba(255,107,107,0.12)] hover:text-[var(--danger)]"
    >
      <X size={14} />
    </button>
  );
}

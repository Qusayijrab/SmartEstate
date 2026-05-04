"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { clsx } from "clsx";
import type { ImageRef } from "@/lib/listings";

export function ListingGallery({ images }: { images: ImageRef[] }) {
  const [active, setActive] = useState(0);
  if (!images.length) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-3xl bg-gradient-to-br from-[#f4f3ee] to-[#e7e2d5] text-[var(--muted)]">
        <ImageIcon className="mr-2" size={20} />
        No photos uploaded yet.
      </div>
    );
  }

  function step(delta: number) {
    setActive((v) => (v + delta + images.length) % images.length);
  }

  const current = images[active];

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-[420px] overflow-hidden rounded-3xl bg-black/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.src}
          alt={current.label}
          className="h-full w-full object-cover"
        />
        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[var(--ink)] shadow-md transition hover:bg-white"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[var(--ink)] shadow-md transition hover:bg-white"
            >
              <ChevronRight size={18} />
            </button>
          </>
        ) : null}
        <div className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white">
          {current.label}
        </div>
      </div>
      {images.length > 1 ? (
        <div className="flex gap-3 overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={`${img.src}-${idx}`}
              type="button"
              onClick={() => setActive(idx)}
              className={clsx(
                "relative h-[80px] w-[120px] flex-none overflow-hidden rounded-xl border-2 transition",
                idx === active
                  ? "border-[var(--gold)] shadow-[0_0_0_3px_rgba(242,201,76,0.18)]"
                  : "border-transparent opacity-80 hover:opacity-100"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt={img.label}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, HttpError } from "@/lib/session";
import { listingToDTO } from "@/lib/listings";
import { saveUploadedImages, normalizeExistingImages } from "@/lib/uploads";
import { slugify, safeJson } from "@/lib/utils";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ id: string }> };

async function buildUniqueSlug(title: string, currentId?: number) {
  const base = slugify(title);
  let candidate = base;
  let counter = 2;
  while (true) {
    const existing = await prisma.listing.findUnique({
      where: { slug: candidate },
    });
    if (!existing || existing.id === currentId) return candidate;
    candidate = `${base}-${counter}`;
    counter += 1;
  }
}

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function num(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function int(value: unknown): number | null {
  const n = num(value);
  return n === null ? null : Math.trunc(n);
}

function str(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s || null;
}

function truthyYes(value: unknown): "yes" | "no" {
  return ["yes", "true", "1", "on"].includes(
    String(value || "").trim().toLowerCase()
  )
    ? "yes"
    : "no";
}

export async function GET(_req: Request, ctx: RouteCtx) {
  const { id: idStr } = await ctx.params;
  const id = parseId(idStr);
  if (!id) {
    return NextResponse.json(
      { ok: false, message: "Listing not found." },
      { status: 404 }
    );
  }
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { owner: true },
  });
  if (!listing) {
    return NextResponse.json(
      { ok: false, message: "Listing not found." },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true, listing: listingToDTO(listing) });
}

export async function PUT(req: Request, ctx: RouteCtx) {
  let user;
  try {
    user = await requireUser();
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json(
        { ok: false, message: err.message },
        { status: err.status }
      );
    }
    throw err;
  }

  const { id: idStr } = await ctx.params;
  const id = parseId(idStr);
  if (!id) {
    return NextResponse.json(
      { ok: false, message: "Listing not found." },
      { status: 404 }
    );
  }

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) {
    return NextResponse.json(
      { ok: false, message: "Listing not found." },
      { status: 404 }
    );
  }

  if (listing.ownerId !== user.id) {
    return NextResponse.json(
      { ok: false, message: "You can only edit your own listings." },
      { status: 403 }
    );
  }

  const contentType = req.headers.get("content-type") || "";
  const isMultipart = contentType.includes("multipart/form-data");

  const payload: Record<string, unknown> = {};
  let extrasUpdated: string[] | null = null;
  let imagesUpdated: { src: string; label: string }[] | null = null;

  if (isMultipart) {
    const form = await req.formData();
    for (const [key, value] of form.entries()) {
      if (key === "extras" || key === "existingImages" || key === "images") continue;
      payload[key] = value;
    }
    if ([...form.keys()].includes("extras")) {
      extrasUpdated = form
        .getAll("extras")
        .map((v) => String(v ?? "").trim())
        .filter(Boolean);
    }
    const existing = normalizeExistingImages(form.getAll("existingImages"));
    const uploaded = await saveUploadedImages(form, "images");
    if (existing.length || uploaded.length || form.has("existingImages") || form.has("images")) {
      imagesUpdated = [...existing, ...uploaded];
    }
  } else {
    try {
      const json = (await req.json()) as Record<string, unknown>;
      Object.assign(payload, json);
      if (Array.isArray(json.extras)) {
        extrasUpdated = (json.extras as unknown[])
          .map((v) => String(v ?? "").trim())
          .filter(Boolean);
      }
      if (Array.isArray(json.images)) {
        imagesUpdated = (json.images as unknown[])
          .map((item, idx) => {
            if (typeof item === "string")
              return { src: item, label: idx === 0 ? "Main View" : `Gallery ${idx}` };
            if (item && typeof item === "object") {
              const src = String((item as { src?: unknown }).src ?? "").trim();
              if (!src) return null;
              const label =
                String((item as { label?: unknown }).label ?? "") ||
                (idx === 0 ? "Main View" : `Gallery ${idx}`);
              return { src, label };
            }
            return null;
          })
          .filter((v): v is { src: string; label: string } => Boolean(v));
      }
    } catch {
      return NextResponse.json(
        { ok: false, message: "Invalid request body." },
        { status: 400 }
      );
    }
  }

  const title = str(payload.title) ?? listing.title;
  const location = str(payload.location) ?? listing.location;
  const areaName = str(payload.areaName) ?? listing.areaName;

  if (!title || !location || !areaName) {
    return NextResponse.json(
      { ok: false, message: "Title, location, and area name are required." },
      { status: 400 }
    );
  }

  const update: Record<string, unknown> = {
    title,
    slug:
      title === listing.title
        ? listing.slug
        : await buildUniqueSlug(title, listing.id),
    location,
    areaName,
  };

  const stringPairs: Array<[string, keyof typeof listing]> = [
    ["type", "propertyType"],
    ["floor", "floor"],
    ["buildingAge", "buildingAge"],
    ["description", "description"],
    ["nearbyDevelopment", "nearbyDevelopment"],
    ["sellerNote", "sellerNote"],
    ["status", "status"],
  ];
  for (const [field, attr] of stringPairs) {
    if (payload[field] !== undefined) {
      const value = str(payload[field]);
      update[attr as string] =
        value ??
        (["floor", "buildingAge", "description", "nearbyDevelopment"].includes(
          attr as string
        )
          ? null
          : "");
    }
  }

  const numericPairs: Array<[string, string, "float" | "int"]> = [
    ["price", "price", "float"],
    ["size", "size", "float"],
    ["bedrooms", "bedrooms", "int"],
    ["bathrooms", "bathrooms", "int"],
    ["estimatedYield", "estimatedYield", "float"],
    ["demandScore", "demandScore", "float"],
    ["aiConfidence", "aiConfidence", "float"],
  ];
  for (const [field, attr, kind] of numericPairs) {
    if (payload[field] !== undefined && payload[field] !== "") {
      update[attr] = kind === "float" ? num(payload[field]) : int(payload[field]);
    }
  }

  if (extrasUpdated !== null) {
    update.extrasJson = JSON.stringify(extrasUpdated);
  }

  if (imagesUpdated !== null) {
    const merged = imagesUpdated.length
      ? imagesUpdated
      : safeJson(listing.imagesJson, []);
    update.imagesJson = JSON.stringify(merged);
  }

  if (payload.aiPricing !== undefined) {
    update.aiPricing = truthyYes(payload.aiPricing);
  }

  if (
    update.status &&
    !["available", "sold"].includes(String(update.status))
  ) {
    update.status = "available";
  }

  const updated = await prisma.listing.update({
    where: { id },
    data: update,
    include: { owner: true },
  });

  return NextResponse.json({
    ok: true,
    message: "Listing updated successfully.",
    listing: listingToDTO(updated),
  });
}

export async function DELETE(_req: Request, ctx: RouteCtx) {
  let user;
  try {
    user = await requireUser();
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json(
        { ok: false, message: err.message },
        { status: err.status }
      );
    }
    throw err;
  }

  const { id: idStr } = await ctx.params;
  const id = parseId(idStr);
  if (!id) {
    return NextResponse.json(
      { ok: false, message: "Listing not found." },
      { status: 404 }
    );
  }

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) {
    return NextResponse.json(
      { ok: false, message: "Listing not found." },
      { status: 404 }
    );
  }
  if (listing.ownerId !== user.id) {
    return NextResponse.json(
      { ok: false, message: "You can only delete your own listings." },
      { status: 403 }
    );
  }

  await prisma.listing.delete({ where: { id } });
  return NextResponse.json({
    ok: true,
    message: "Listing deleted successfully.",
  });
}

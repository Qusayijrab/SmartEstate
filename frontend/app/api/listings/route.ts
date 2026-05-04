import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, HttpError } from "@/lib/session";
import { listingToCardDTO } from "@/lib/listings";
import { listingCreateSchema } from "@/lib/validations";
import { saveUploadedImages, normalizeExistingImages } from "@/lib/uploads";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";

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

export async function GET() {
  const items = await prisma.listing.findMany({
    orderBy: { createdAt: "desc" },
    include: { owner: true },
  });
  return NextResponse.json({
    ok: true,
    listings: items.map(listingToCardDTO),
  });
}

export async function POST(req: Request) {
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

  const contentType = req.headers.get("content-type") || "";
  let payload: Record<string, unknown> = {};
  let extras: string[] = [];
  let images: { src: string; label: string }[] = [];

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    payload = Object.fromEntries(
      [...form.entries()].filter(
        ([key]) =>
          key !== "extras" && key !== "existingImages" && key !== "images"
      )
    );
    extras = form
      .getAll("extras")
      .map((v) => String(v ?? "").trim())
      .filter(Boolean);
    images = [
      ...normalizeExistingImages(form.getAll("existingImages")),
      ...(await saveUploadedImages(form, "images")),
    ];
  } else {
    try {
      const json = (await req.json()) as Record<string, unknown>;
      payload = json;
      const e = json.extras;
      if (Array.isArray(e)) {
        extras = e.map((v) => String(v ?? "").trim()).filter(Boolean);
      }
      const i = json.images;
      if (Array.isArray(i)) {
        images = i
          .map((item, idx) => {
            if (typeof item === "string")
              return {
                src: item,
                label: idx === 0 ? "Main View" : `Gallery ${idx}`,
              };
            if (item && typeof item === "object") {
              const src = String(
                (item as { src?: unknown }).src ?? ""
              ).trim();
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

  const parsed = listingCreateSchema.safeParse(payload);
  if (!parsed.success) {
    const issues = Object.fromEntries(
      parsed.error.issues.map((i) => [i.path.join(".") || "form", i.message])
    );
    return NextResponse.json(
      { ok: false, message: "Please fix the errors and try again.", issues },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const slug = await buildUniqueSlug(data.title);

  const listing = await prisma.listing.create({
    data: {
      slug,
      ownerId: user.id,
      title: data.title.trim(),
      propertyType: data.type.trim() || "apartment",
      price: data.price,
      location: data.location.trim(),
      areaName: data.areaName.trim(),
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      size: data.size,
      floor: data.floor?.trim() || null,
      buildingAge: data.buildingAge?.trim() || null,
      description: data.description?.trim() || null,
      extrasJson: JSON.stringify(extras),
      imagesJson: JSON.stringify(images),
      aiPricing: data.aiPricing,
      estimatedYield: data.estimatedYield ?? null,
      demandScore: data.demandScore ?? null,
      aiConfidence: data.aiConfidence ?? null,
      nearbyDevelopment: data.nearbyDevelopment?.trim() || null,
      sellerNote: data.sellerNote?.trim() || "Ready for buyer inquiries",
      status: data.status,
    },
    include: { owner: true },
  });

  return NextResponse.json(
    {
      ok: true,
      message: "Listing created successfully.",
      listing: listingToCardDTO(listing),
    },
    { status: 201 }
  );
}

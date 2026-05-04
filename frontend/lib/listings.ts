import type { Listing, User } from "@prisma/client";
import { safeJson } from "@/lib/utils";

export type ImageRef = { src: string; label: string };

export type ListingDTO = {
  id: string;
  slug: string;
  title: string;
  type: string;
  price: number;
  location: string;
  areaName: string;
  bedrooms: number;
  bathrooms: number;
  size: number;
  floor: string | null;
  buildingAge: string | null;
  description: string | null;
  extras: string[];
  images: ImageRef[];
  trust: "ai" | "manual";
  trustLabel: string;
  estimatedYield: number | null;
  demandScore: number | null;
  aiConfidence: number | null;
  nearbyDevelopment: string | null;
  seller: string;
  sellerEmail: string | null;
  sellerAvatar: string | null;
  sellerNote: string | null;
  status: string;
  verified: boolean;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
};

type ListingWithOwner = Listing & { owner?: User | null };

export function listingToDTO(listing: ListingWithOwner): ListingDTO {
  const extras = safeJson<string[]>(listing.extrasJson, []);
  const images = safeJson<ImageRef[]>(listing.imagesJson, []);
  const trust =
    String(listing.aiPricing || "").toLowerCase() === "yes" ? "ai" : "manual";

  return {
    id: String(listing.id),
    slug: listing.slug,
    title: listing.title,
    type: listing.propertyType,
    price: listing.price,
    location: listing.location,
    areaName: listing.areaName,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    size: listing.size,
    floor: listing.floor,
    buildingAge: listing.buildingAge,
    description: listing.description,
    extras,
    images,
    trust,
    trustLabel: trust === "ai" ? "AI Price Assisted" : "Seller Price Only",
    estimatedYield: listing.estimatedYield,
    demandScore: listing.demandScore,
    aiConfidence: listing.aiConfidence,
    nearbyDevelopment: listing.nearbyDevelopment,
    seller: listing.owner?.fullName || "SmartEstate Seller",
    sellerEmail: listing.owner?.email ?? null,
    sellerAvatar: listing.owner?.avatarUrl ?? null,
    sellerNote: listing.sellerNote,
    status: listing.status,
    verified: listing.verified,
    ownerId: listing.ownerId,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
  };
}

/** Trims a listing DTO down to a single image (the primary card view). */
export function listingToCardDTO(listing: ListingWithOwner): ListingDTO {
  const dto = listingToDTO(listing);
  const first = dto.images[0];
  if (!first) {
    return { ...dto, images: [] };
  }
  if (typeof first.src === "string" && first.src.startsWith("data:image/")) {
    return { ...dto, images: [] };
  }
  return { ...dto, images: [first] };
}

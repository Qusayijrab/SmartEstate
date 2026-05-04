import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { listingToCardDTO } from "@/lib/listings";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const { id: idStr } = await ctx.params;
  const userId = Number(idStr);
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json(
      { ok: false, message: "Invalid user." },
      { status: 400 }
    );
  }

  const session = await getCurrentUser();
  if (!session || session.id !== userId) {
    return NextResponse.json(
      { ok: false, message: "You can only view your own dashboard." },
      { status: 403 }
    );
  }

  const [myListings, favorites, comparisons] = await Promise.all([
    prisma.listing.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
      include: { owner: true },
    }),
    prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { listing: { include: { owner: true } } },
    }),
    prisma.compareListing.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { listing: { include: { owner: true } } },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    myListings: myListings.map(listingToCardDTO),
    favorites: favorites.map((f) => listingToCardDTO(f.listing)),
    comparisons: comparisons.map((c) => listingToCardDTO(c.listing)),
  });
}

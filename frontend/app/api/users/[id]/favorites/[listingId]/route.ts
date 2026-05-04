import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

type RouteCtx = { params: Promise<{ id: string; listingId: string }> };

async function readIds(ctx: RouteCtx) {
  const { id, listingId } = await ctx.params;
  const userId = Number(id);
  const lid = Number(listingId);
  return {
    userId: Number.isInteger(userId) && userId > 0 ? userId : null,
    listingId: Number.isInteger(lid) && lid > 0 ? lid : null,
  };
}

export async function POST(_req: Request, ctx: RouteCtx) {
  const session = await getCurrentUser();
  const { userId, listingId } = await readIds(ctx);
  if (!userId || !listingId) {
    return NextResponse.json({ ok: false, message: "Invalid params." }, { status: 400 });
  }
  if (!session || session.id !== userId) {
    return NextResponse.json(
      { ok: false, message: "You can only manage your own favorites." },
      { status: 403 }
    );
  }
  const exists = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!exists) {
    return NextResponse.json(
      { ok: false, message: "Listing not found." },
      { status: 404 }
    );
  }
  await prisma.favorite.upsert({
    where: { userId_listingId: { userId, listingId } },
    update: {},
    create: { userId, listingId },
  });
  return NextResponse.json({ ok: true, message: "Added to favorites." });
}

export async function DELETE(_req: Request, ctx: RouteCtx) {
  const session = await getCurrentUser();
  const { userId, listingId } = await readIds(ctx);
  if (!userId || !listingId) {
    return NextResponse.json({ ok: false, message: "Invalid params." }, { status: 400 });
  }
  if (!session || session.id !== userId) {
    return NextResponse.json(
      { ok: false, message: "You can only manage your own favorites." },
      { status: 403 }
    );
  }
  await prisma.favorite.deleteMany({ where: { userId, listingId } });
  return NextResponse.json({ ok: true, message: "Removed from favorites." });
}

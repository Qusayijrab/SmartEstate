import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

type RouteCtx = { params: Promise<{ id: string; listingId: string }> };
const COMPARE_CAP = 3;

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
      { ok: false, message: "You can only manage your own compare list." },
      { status: 403 }
    );
  }
  const exists = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!exists) {
    return NextResponse.json({ ok: false, message: "Listing not found." }, { status: 404 });
  }

  const already = await prisma.compareListing.findUnique({
    where: { userId_listingId: { userId, listingId } },
  });
  if (already) {
    return NextResponse.json({ ok: true, message: "Already in compare list." });
  }

  const count = await prisma.compareListing.count({ where: { userId } });
  if (count >= COMPARE_CAP) {
    return NextResponse.json(
      {
        ok: false,
        message: `You can only compare up to ${COMPARE_CAP} listings at a time. Remove one and try again.`,
      },
      { status: 400 }
    );
  }

  await prisma.compareListing.create({ data: { userId, listingId } });
  return NextResponse.json({ ok: true, message: "Added to compare list." });
}

export async function DELETE(_req: Request, ctx: RouteCtx) {
  const session = await getCurrentUser();
  const { userId, listingId } = await readIds(ctx);
  if (!userId || !listingId) {
    return NextResponse.json({ ok: false, message: "Invalid params." }, { status: 400 });
  }
  if (!session || session.id !== userId) {
    return NextResponse.json(
      { ok: false, message: "You can only manage your own compare list." },
      { status: 403 }
    );
  }
  await prisma.compareListing.deleteMany({ where: { userId, listingId } });
  return NextResponse.json({ ok: true, message: "Removed from compare list." });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkEmailSchema } from "@/lib/validations";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, available: false }, { status: 400 });
  }
  const parsed = checkEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, available: false }, { status: 400 });
  }
  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  return NextResponse.json({ ok: true, available: !existing });
}

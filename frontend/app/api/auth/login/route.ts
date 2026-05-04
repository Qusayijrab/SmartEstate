import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { loginSchema } from "@/lib/validations";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Email and password are required." },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!user) {
    return NextResponse.json(
      { ok: false, message: "We couldn’t find an account with that email." },
      { status: 401 }
    );
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    return NextResponse.json(
      { ok: false, message: "Wrong password. Please try again." },
      { status: 401 }
    );
  }

  const session = await getSession();
  session.user = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    avatarUrl: user.avatarUrl,
  };
  await session.save();

  return NextResponse.json({
    ok: true,
    user: session.user,
    message: "Welcome back.",
  });
}

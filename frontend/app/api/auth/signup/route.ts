import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { signupSchema } from "@/lib/validations";

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

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    const issues = Object.fromEntries(
      parsed.error.issues.map((i) => [i.path.join(".") || "form", i.message])
    );
    return NextResponse.json(
      { ok: false, message: "Please fix the errors and try again.", issues },
      { status: 400 }
    );
  }

  const { fullName, email, password, role } = parsed.data;
  const lowerEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: lowerEmail } });
  if (existing) {
    return NextResponse.json(
      { ok: false, message: "An account with that email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      fullName: fullName.trim(),
      email: lowerEmail,
      passwordHash,
      role,
    },
  });

  const session = await getSession();
  session.user = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    avatarUrl: user.avatarUrl,
  };
  await session.save();

  return NextResponse.json(
    { ok: true, user: session.user, message: "Welcome to SmartEstate." },
    { status: 201 }
  );
}

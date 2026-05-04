import { NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/validations";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid request body." },
      { status: 400 }
    );
  }
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  // Stub – matches the original Flask behaviour. We do not leak whether the
  // email exists. A real implementation would queue an email here.
  return NextResponse.json({
    ok: true,
    message:
      "If an account exists for that email, we’ve sent password reset instructions. Please check your inbox.",
  });
}

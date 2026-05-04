import { proxyMultipart, fetchAi } from "@/lib/ai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The Python service expects multipart/form-data; we MUST forward the raw body.
export const bodyParser = false;

export async function POST(req: Request) {
  return proxyMultipart(req, "/api/ai/property");
}

export async function GET() {
  const data = await fetchAi<unknown>("/api/ai/property/districts");
  if (!data) {
    return NextResponse.json(
      { ok: false, message: "AI service unreachable." },
      { status: 502 }
    );
  }
  return NextResponse.json(data);
}

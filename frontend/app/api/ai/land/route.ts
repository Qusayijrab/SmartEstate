import { proxyJson, fetchAi } from "@/lib/ai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return proxyJson(req, "/api/ai/land");
}

export async function GET() {
  const data = await fetchAi<unknown>("/api/ai/land/districts");
  if (!data) {
    return NextResponse.json(
      { ok: false, message: "AI service unreachable." },
      { status: 502 }
    );
  }
  return NextResponse.json(data);
}

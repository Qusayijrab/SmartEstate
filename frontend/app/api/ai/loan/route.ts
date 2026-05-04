import { proxyJson } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return proxyJson(req, "/api/ai/loan");
}

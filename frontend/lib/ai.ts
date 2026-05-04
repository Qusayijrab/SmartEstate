const PY_AI_URL = process.env.PY_AI_URL || "http://127.0.0.1:5000";

export function pyAiUrl(path: string): string {
  const base = PY_AI_URL.replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

/** Forward a JSON body straight through to the Python AI service. */
export async function proxyJson(req: Request, path: string): Promise<Response> {
  const body = await req.text();
  try {
    const upstream = await fetch(pyAiUrl(path), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      cache: "no-store",
    });
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        message:
          "Could not reach the AI service. Is the Python backend running on " +
          PY_AI_URL +
          "?",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }
}

/** Proxy a multipart body straight through to the Python AI service. */
export async function proxyMultipart(
  req: Request,
  path: string
): Promise<Response> {
  if (!req.body) {
    return Response.json(
      { ok: false, message: "Missing multipart body." },
      { status: 400 }
    );
  }
  const contentType = req.headers.get("content-type") || "multipart/form-data";
  try {
    const upstream = await fetch(pyAiUrl(path), {
      method: "POST",
      headers: { "content-type": contentType },
      body: req.body,
      // @ts-expect-error -- duplex is required when sending a stream body
      duplex: "half",
      cache: "no-store",
    });
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: {
        "content-type":
          upstream.headers.get("content-type") || "application/json",
      },
    });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        message:
          "Could not reach the AI service. Is the Python backend running on " +
          PY_AI_URL +
          "?",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }
}

/** Server-side fetch from the Python service (e.g. for districts). */
export async function fetchAi<T>(path: string): Promise<T | null> {
  try {
    const r = await fetch(pyAiUrl(path), { cache: "no-store" });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

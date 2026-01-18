export {};

type DenoLike = {
  env: { get(key: string): string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

const Deno = (globalThis as unknown as { Deno: DenoLike }).Deno;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...corsHeaders,
      ...(init.headers ?? {}),
    },
  });
}

type IncomingMessage = { role: string; content: string; imageUrl?: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseMessages(value: unknown): IncomingMessage[] | null {
  if (!Array.isArray(value)) return null;
  const out: IncomingMessage[] = [];
  for (const m of value) {
    if (!isRecord(m)) return null;
    const role = typeof m.role === "string" ? m.role : "";
    const content = typeof m.content === "string" ? m.content : "";
    const imageUrl = typeof m.imageUrl === "string" ? m.imageUrl : undefined;
    if (!role || !content) return null;
    out.push({ role, content, imageUrl });
  }
  return out;
}

function normalizeModel(value: unknown) {
  const m = typeof value === "string" ? value.trim() : "";
  return m || "gemini-3-flash-preview";
}

function normalizeTemperature(value: unknown) {
  const t = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(t)) return 0.1;
  return Math.max(0, Math.min(2, t));
}

function base64UrlToUtf8(b64url: string) {
  const base64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return atob(padded);
}

function requireAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return { ok: false as const, status: 401, error: "Missing Authorization" };
  }

  const token = authHeader.slice(7).trim();
  const parts = token.split(".");
  if (parts.length < 2) return { ok: false as const, status: 401, error: "Invalid token" };

  let payload: { role?: unknown; sub?: unknown };
  try {
    const payloadJson = base64UrlToUtf8(parts[1] ?? "");
    payload = JSON.parse(payloadJson) as { role?: unknown; sub?: unknown };
  } catch {
    return { ok: false as const, status: 401, error: "Invalid token" };
  }

  const role = typeof payload.role === "string" ? payload.role : "";
  if (role !== "authenticated") {
    return { ok: false as const, status: 401, error: "Not authenticated" };
  }

  const userId = typeof payload.sub === "string" ? payload.sub : "";
  if (!userId) return { ok: false as const, status: 401, error: "Invalid token" };

  return { ok: true as const, userId };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = requireAuthenticatedUser(req);
    if (!auth.ok) return json({ error: auth.error }, { status: auth.status });

    const GEMINI_API_KEY =
      Deno.env.get("GEMINI_API_KEY") ?? Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY") ?? Deno.env.get("GOOGLE_API_KEY") ?? "";

    if (!GEMINI_API_KEY) return json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });

    const body = await req.json().catch(() => null);
    const messages = parseMessages(isRecord(body) ? body.messages : null);
    const model = normalizeModel(isRecord(body) ? body.model : null);
    const temperature = normalizeTemperature(isRecord(body) ? body.temperature : null);

    if (!messages || messages.length === 0) return json({ error: "Invalid messages" }, { status: 400 });

    const contents = messages.map((msg) => {
      const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [];
      parts.push({ text: msg.content });

      if (msg.imageUrl && msg.imageUrl.startsWith("data:image")) {
        const [header, base64Data] = msg.imageUrl.split(",", 2);
        if (header && base64Data) {
          const mimeType = header.match(/:(.*?);/)?.[1] || "image/jpeg";
          parts.push({
            inline_data: {
              mime_type: mimeType,
              data: base64Data,
            },
          });
        }
      }

      return {
        role: msg.role === "user" ? "user" : "model",
        parts,
      };
    });

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature },
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const message =
        (isRecord(data) && isRecord(data.error) && typeof data.error.message === "string" && data.error.message) ||
        "Failed to generate content";
      return json({ error: message }, { status: 500 });
    }

    return json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return json({ error: message }, { status: 500 });
  }
});

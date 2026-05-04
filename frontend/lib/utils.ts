export function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "listing";
}

export function formatPrice(value: number, currency = "JOD"): string {
  if (Number.isNaN(value)) return "—";
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 0 })} ${currency}`;
}

export function formatNumber(value: number, fraction = 0): string {
  if (Number.isNaN(value)) return "—";
  return value.toLocaleString("en-US", {
    maximumFractionDigits: fraction,
    minimumFractionDigits: fraction,
  });
}

export function initials(text: string | null | undefined): string {
  if (!text) return "U";
  const trimmed = String(text).trim();
  if (!trimmed) return "U";
  return trimmed.charAt(0).toUpperCase();
}

export function safeJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

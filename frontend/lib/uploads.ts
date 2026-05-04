import { mkdir, writeFile } from "node:fs/promises";
import { join, extname, basename } from "node:path";
import { randomBytes } from "node:crypto";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const ALLOWED = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB per file

export type StoredImage = { src: string; label: string };

function safeStem(name: string): string {
  const stem = basename(name, extname(name));
  return stem.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") ||
    "image";
}

function titleize(stem: string): string {
  return stem
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Persist any uploaded `images` files in a multipart form to public/uploads/.
 * Returns the list of stored images in the same shape the legacy Flask backend
 * used so the rest of the UI can stay shape-stable.
 */
export async function saveUploadedImages(
  form: FormData,
  field = "images"
): Promise<StoredImage[]> {
  const files = form.getAll(field).filter((v): v is File => v instanceof File);
  if (files.length === 0) return [];

  await mkdir(UPLOAD_DIR, { recursive: true });

  const saved: StoredImage[] = [];
  for (const file of files) {
    if (!file.name) continue;
    const ext = extname(file.name).toLowerCase();
    if (!ALLOWED.has(ext)) continue;
    if (file.size > MAX_BYTES) continue;

    const stem = safeStem(file.name);
    const unique = `${stem}-${randomBytes(5).toString("hex")}${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(join(UPLOAD_DIR, unique), buf);

    saved.push({ src: `/uploads/${unique}`, label: titleize(stem) });
  }
  return saved;
}

export function normalizeExistingImages(values: FormDataEntryValue[]): StoredImage[] {
  return values
    .map((v) => String(v ?? "").trim())
    .filter(Boolean)
    .map((src) => ({ src, label: titleize(safeStem(src)) }));
}

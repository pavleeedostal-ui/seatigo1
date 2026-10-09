import { rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/** Above this, an SVG costs more than the resolution it buys us. */
export const SVG_INLINE_LIMIT = 40 * 1024;

/** File extension of an artwork URL, ignoring any query string. */
export function extOf(url: string): string {
  const match = /\.(svg|png|webp|jpg|jpeg)(?:\?|$)/i.exec(url);
  return match ? match[1].toLowerCase() : "png";
}

export interface SavedAsset {
  file: string;
  bytes: number;
  rasterizedFrom?: number;
}

/**
 * Fetches the first URL that yields a real image and writes it to `dir` as
 * `<name>.<ext>`, rasterizing oversized SVGs to a transparent PNG at
 * `rasterSize` (next/image cannot optimize SVGs, and these render small).
 * Returns null when no source produced an image.
 */
export async function downloadArtwork(
  sources: { url: string; ext: string }[],
  dir: string,
  name: string,
  rasterSize: number,
): Promise<SavedAsset | null> {
  for (const { url, ext } of sources) {
    let res: Response;
    try {
      res = await fetch(url);
    } catch {
      continue;
    }
    if (!res.ok) continue;

    const body = Buffer.from(await res.arrayBuffer());
    // A 404 page or an empty body is not artwork.
    if (body.byteLength < 512) continue;

    const rasterize = ext === "svg" && body.byteLength > SVG_INLINE_LIMIT;

    // A raster source may be far larger than anywhere it renders — UEFA
    // publishes crests at 700px, and we never draw one above 72. Shrinking
    // it here keeps the repository small; next/image would otherwise be
    // resizing the same oversized original on every cold request.
    const oversized =
      ext !== "svg" && (await sharp(body).metadata()).width! > rasterSize;

    const outExt = rasterize || oversized ? "png" : ext;
    const out =
      rasterize || oversized
        ? await sharp(body, { density: 384 })
            .resize(rasterSize, rasterSize, {
              fit: "contain",
              background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .png({ compressionLevel: 9, palette: true })
            .toBuffer()
        : body;

    // The same entry must not end up with two formats on disk.
    for (const stale of ["svg", "png", "webp"]) {
      if (stale !== outExt) await rm(path.join(dir, `${name}.${stale}`), { force: true });
    }

    await writeFile(path.join(dir, `${name}.${outExt}`), out);
    return {
      file: `${name}.${outExt}`,
      bytes: out.byteLength,
      rasterizedFrom: rasterize || oversized ? body.byteLength : undefined,
    };
  }

  return null;
}

/** Writes a sorted slug -> filename manifest. */
export async function writeManifest(
  file: string,
  manifest: Record<string, string>,
): Promise<void> {
  const sorted = Object.fromEntries(
    Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)),
  );
  await writeFile(file, `${JSON.stringify(sorted, null, 2)}\n`);
}

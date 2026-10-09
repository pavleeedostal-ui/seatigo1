/**
 * Downloads a logo for every competition in the registry into
 * /public/images/competitions, so logos are served from our own origin
 * instead of being hotlinked on every page view.
 *
 *   npm run sync:logos
 *
 * Source and rights: docs/competition-logos.md.
 *
 * The registry (src/lib/football/competition-logos.ts) lists every
 * competition Seatigo knows how to brand, including ones it does not list
 * fixtures for yet, so a new competition is branded the moment the football
 * provider starts returning it. Competitions the provider has no emblem for
 * are reported at the end and render the neutral fallback — another
 * competition's logo is never substituted.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { COMPETITION_LOGOS } from "@/lib/football/competition-logos";
import { downloadArtwork, extOf, writeManifest } from "./lib/crest-io";

const OUT_DIR = path.join(process.cwd(), "public", "images", "competitions");
const MANIFEST = path.join(
  process.cwd(),
  "src",
  "lib",
  "football",
  "competition-logo-manifest.json",
);
const CDN = "https://crests.football-data.org";
/** 2x the largest place a competition logo renders (72px on its own page). */
const RASTER_SIZE = 144;

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const manifest: Record<string, string> = {};
  const missing: string[] = [];

  for (const entry of COMPETITION_LOGOS) {
    const sources = [
      ...(entry.logoUrl
        ? [{ url: entry.logoUrl, ext: extOf(entry.logoUrl) }]
        : []),
      { url: `${CDN}/${entry.code}.svg`, ext: "svg" },
      { url: `${CDN}/${entry.code}.png`, ext: "png" },
    ];
    const saved = await downloadArtwork(
      sources,
      OUT_DIR,
      entry.slug,
      RASTER_SIZE,
    );

    if (!saved) {
      missing.push(`${entry.slug} (${entry.code})`);
      continue;
    }

    manifest[entry.slug] = saved.file;
    console.log(
      `✓ ${saved.file}  (${saved.bytes} bytes` +
        (saved.rasterizedFrom ? `, rasterized from ${saved.rasterizedFrom}` : "") +
        ")",
    );
  }

  await writeManifest(MANIFEST, manifest);

  console.log(
    `\n${Object.keys(manifest).length}/${COMPETITION_LOGOS.length} logos written to ` +
      `public/images/competitions`,
  );
  console.log(`manifest: ${path.relative(process.cwd(), MANIFEST)}`);

  if (missing.length) {
    console.log(
      `\nThe provider has no emblem for ${missing.length} competition(s); ` +
        `these render the neutral fallback:\n  ${missing.join("\n  ")}`,
    );
    console.log(
      "\nDrop a licensed file into public/images/competitions named after the " +
        "slug and add it to the manifest to light one up — no code change needed.",
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

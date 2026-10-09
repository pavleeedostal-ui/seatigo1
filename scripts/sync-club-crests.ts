/**
 * Downloads a club crest for every club in the active fixture database into
 * /public/images/clubs, so crests are served from our own origin instead of
 * being hotlinked on every page view.
 *
 * Run it after the football provider picks up new competitions or clubs:
 *
 *   npm run sync:crests
 *
 * Source and rights: docs/club-crests.md.
 *
 * Coverage follows whatever the provider returns — nothing here is a
 * hand-maintained shortlist. Clubs the provider has no crest for are
 * reported at the end and render the neutral fallback; a wrong badge is
 * never substituted.
 *
 * Crests only ever render between 24px and 72px, but some source SVGs are
 * hundreds of kilobytes of path data (and next/image passes SVGs through
 * unoptimized). Anything above SVG_INLINE_LIMIT is therefore rasterized to a
 * transparent PNG at RASTER_SIZE, which next/image can then serve as WebP or
 * AVIF. Small SVGs are kept as vectors so they stay crisp at any size.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { getFootballDataProvider } from "@/lib/football";
import { CLUB_CRESTS } from "@/lib/football/club-logos";
import type { Club } from "@/types/football";
import { downloadArtwork, extOf, writeManifest } from "./lib/crest-io";

const OUT_DIR = path.join(process.cwd(), "public", "images", "clubs");
const MANIFEST = path.join(
  process.cwd(),
  "src",
  "lib",
  "football",
  "club-crest-manifest.json",
);
const CDN = "https://crests.football-data.org";
/** 2x the largest place a crest is rendered (72px on the match detail page). */
const RASTER_SIZE = 144;

/** Registry entries carry the provider id; fall back to parsing the club id. */
function crestSourcesFor(club: Club): { url: string; ext: string }[] {
  const entry =
    CLUB_CRESTS.find((c) => c.slug === club.slug) ??
    CLUB_CRESTS.find((c) => c.aliases.includes(club.name.toLowerCase()));
  const fromRegistry = entry?.footballDataId ?? null;
  const fromId = /^fd-(\d+)$/.exec(club.id)?.[1];
  const id = fromRegistry ?? (fromId ? Number(fromId) : null);

  const sources: { url: string; ext: string }[] = [];
  // An explicit source wins: it is there precisely because the default CDN
  // has no crest for this club.
  if (entry?.crestUrl) {
    sources.push({ url: entry.crestUrl, ext: extOf(entry.crestUrl) });
  }
  if (id != null) {
    sources.push({ url: `${CDN}/${id}.svg`, ext: "svg" });
    sources.push({ url: `${CDN}/${id}.png`, ext: "png" });
  }
  // A provider that hands us a crest URL directly is used as-is.
  if (club.logo?.startsWith("https://")) {
    sources.push({ url: club.logo, ext: extOf(club.logo) });
  }
  return sources;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const clubs = await getFootballDataProvider().getClubs();
  const missing: string[] = [];
  const manifest: Record<string, string> = {};
  let written = 0;

  for (const club of clubs) {
    const saved = await downloadArtwork(
      crestSourcesFor(club),
      OUT_DIR,
      club.slug,
      RASTER_SIZE,
    );

    if (!saved) {
      missing.push(`${club.slug} — ${club.name}`);
      continue;
    }

    manifest[club.slug] = saved.file;
    written += 1;
    console.log(
      `✓ ${saved.file}  (${saved.bytes} bytes` +
        (saved.rasterizedFrom ? `, rasterized from ${saved.rasterizedFrom}` : "") +
        ")",
    );
  }

  // The registry owns ids and aliases (curated); the manifest owns filenames
  // (generated), so a format change here never needs a hand edit there.
  await writeManifest(MANIFEST, manifest);

  console.log(`\n${written}/${clubs.length} crests written to public/images/clubs`);
  console.log(`manifest: ${path.relative(process.cwd(), MANIFEST)}`);
  if (missing.length) {
    console.log(
      `\nNo crest available for ${missing.length} club(s); these render the ` +
        `neutral fallback:\n  ${missing.join("\n  ")}`,
    );
    console.log(
      "\nAdd a locally licensed file and point its registry entry at it in " +
        "src/lib/football/club-logos.ts once you have one.",
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

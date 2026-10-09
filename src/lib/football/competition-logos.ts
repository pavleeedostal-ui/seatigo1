import type { Competition } from "@/types/football";
import logoManifest from "./competition-logo-manifest.json";

/**
 * Centralized competition logo resolution — the competition counterpart to
 * club-logos.ts, and it works the same way.
 *
 * Logos are keyed by a *stable competition code* (football-data.org's
 * `PL`, `PD`, `CL`, …), not by name, because the same competition travels
 * under several names and sponsor lockups ("La Liga" / "Primera División",
 * "UEFA Champions League" / "Champions League", "Czech First League" /
 * "Chance Liga"). Names are only a last-resort alias lookup, and no alias
 * is shared between two entries, so one competition can never inherit
 * another's logo.
 *
 * Files live in /public/images/competitions and are written by
 * `npm run sync:logos` (scripts/sync-competition-logos.ts).
 */
export interface CompetitionLogo {
  /** football-data.org competition code — the join key across providers. */
  code: string;
  /** Seatigo's own competition slug, and the manifest key for its file. */
  slug: string;
  /**
   * Explicit logo source, used when the provider's emblem is missing or is a
   * superseded sponsor lockup. The sync script prefers it over the CDN.
   */
  logoUrl?: string;
  /**
   * Lowercase name variants seen across providers and sponsor lockups.
   * Never shared between entries.
   */
  aliases: string[];
}

/**
 * slug -> filename under /public/images/competitions, written by the sync
 * script. This file owns the curated part (codes and aliases); the manifest
 * owns the generated part, so re-syncing needs no hand edit here.
 *
 * A competition with no entry in the manifest renders the neutral fallback —
 * it is never given another competition's logo.
 */
const logoFiles = logoManifest as Record<string, string | undefined>;

const LOGO_DIR = "/images/competitions";

/**
 * Every competition Seatigo knows how to brand, including ones it does not
 * yet list fixtures for — so a competition lights up the moment the football
 * provider starts returning it, with no code change.
 */
export const COMPETITION_LOGOS: CompetitionLogo[] = [
  // Top-five domestic leagues
  { code: "PL", slug: "premier-league", aliases: ["premier league", "english premier league", "epl"] },
  // The provider still serves the LaLiga Santander mark; take the current
  // LALIGA EA SPORTS lockup from the league's own site instead.
  { code: "PD", slug: "la-liga", logoUrl: "https://www.laliga.com/logos/laliga-eaSports-navbar.svg", aliases: ["la liga", "laliga", "primera division", "laliga santander", "laliga ea sports", "campeonato nacional de liga de primera division"] },
  // The provider still serves the superseded Serie A TIM mark; take the
  // current Serie A Enilive lockup from the league's own site instead.
  { code: "SA", slug: "serie-a", logoUrl: "https://images.legaseriea.it/image/private/t_q_good/v1766422496/prd/assets/icons/nav-serieaeni-v2_qoj76t.png", aliases: ["serie a", "italian serie a", "serie a tim", "serie a enilive", "lega serie a"] },
  { code: "BL1", slug: "bundesliga", aliases: ["bundesliga", "german bundesliga", "1 bundesliga", "fussball bundesliga"] },
  { code: "FL1", slug: "ligue-1", aliases: ["ligue 1", "french ligue 1", "ligue 1 uber eats", "ligue 1 mcdonald s"] },

  // UEFA club competitions
  // The provider serves a flat black starball; take UEFA's own current
  // navy lockup from their brand asset host instead.
  { code: "CL", slug: "champions-league", logoUrl: "https://img.uefa.com/imgml/uefacom/elements/logos/competitions/color/full/1.svg", aliases: ["uefa champions league", "champions league", "ucl"] },
  // The provider serves an older rendering of the trophy mark; take UEFA's
  // own current orange lockup from their brand asset host instead.
  { code: "EL", slug: "europa-league", logoUrl: "https://img.uefa.com/imgml/uefacom/elements/logos/competitions/color/full/14.svg", aliases: ["uefa europa league", "europa league", "uel"] },
  { code: "ECL", slug: "conference-league", aliases: ["uefa conference league", "uefa europa conference league", "conference league", "uecl"] },

  // Second tiers and domestic cups
  { code: "ELC", slug: "championship", aliases: ["championship", "efl championship", "sky bet championship", "english championship"] },
  { code: "FAC", slug: "fa-cup", aliases: ["fa cup", "the fa cup", "emirates fa cup"] },
  { code: "EFL", slug: "efl-cup", aliases: ["efl cup", "carabao cup", "league cup", "english league cup"] },
  { code: "CDR", slug: "copa-del-rey", aliases: ["copa del rey", "spanish cup"] },
  { code: "DFB", slug: "dfb-pokal", aliases: ["dfb pokal", "dfb cup", "german cup"] },
  { code: "CIT", slug: "coppa-italia", aliases: ["coppa italia", "italian cup"] },

  // Other European leagues
  { code: "DED", slug: "eredivisie", aliases: ["eredivisie", "dutch eredivisie"] },
  { code: "PPL", slug: "primeira-liga", aliases: ["primeira liga", "liga portugal", "portuguese primeira liga", "liga nos"] },
  { code: "BJL", slug: "belgian-pro-league", aliases: ["belgian pro league", "jupiler pro league", "first division a"] },
  { code: "SPL", slug: "scottish-premiership", aliases: ["scottish premiership", "scottish premier league", "cinch premiership"] },
  { code: "CFL", slug: "czech-first-league", aliases: ["czech first league", "chance liga", "fortuna liga", "czech liga", "1 ceska liga"] },
  { code: "ABL", slug: "austrian-bundesliga", aliases: ["austrian bundesliga", "osterreichische bundesliga", "admiral bundesliga"] },
  { code: "SSL", slug: "swiss-super-league", aliases: ["swiss super league", "super league", "credit suisse super league"] },
  { code: "EKS", slug: "ekstraklasa", aliases: ["ekstraklasa", "polish ekstraklasa", "pko bp ekstraklasa"] },
  { code: "TSL", slug: "super-lig", aliases: ["super lig", "turkish super lig", "suoer lig", "trendyol super lig"] },
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const byCode = new Map(COMPETITION_LOGOS.map((c) => [c.code, c]));
const bySlug = new Map(COMPETITION_LOGOS.map((c) => [c.slug, c]));
const byAlias = new Map<string, CompetitionLogo>();
for (const entry of COMPETITION_LOGOS) {
  for (const alias of entry.aliases) {
    const key = normalize(alias);
    const clash = byAlias.get(key);
    if (clash && clash.slug !== entry.slug) {
      // Two competitions claiming one alias is how a league ends up wearing
      // another league's logo. Fail loudly rather than guess.
      throw new Error(
        `Duplicate competition alias "${alias}": ${clash.slug} vs ${entry.slug}`,
      );
    }
    byAlias.set(key, entry);
  }
}

/** Hosts we are willing to load a remote emblem from. */
const TRUSTED_LOGO_HOSTS = new Set(["crests.football-data.org"]);

function isTrustedLogoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && TRUSTED_LOGO_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * The logo to render for a competition, or null when none is known.
 *
 * Code first, then slug, then name alias — so a competition a provider
 * spells differently still resolves, while an unknown competition gets the
 * neutral fallback instead of a wrong badge.
 */
export function resolveCompetitionLogo(competition: Competition): string | null {
  const entry =
    byCode.get(competition.id) ??
    bySlug.get(competition.slug) ??
    byAlias.get(normalize(competition.name)) ??
    byAlias.get(normalize(competition.shortName));

  const file = entry ? logoFiles[entry.slug] : undefined;
  if (file) return `${LOGO_DIR}/${file}`;

  // A competition outside the registry can still carry an emblem URL straight
  // from the football API, which keeps new competitions covered automatically.
  if (competition.logo && isTrustedLogoUrl(competition.logo)) return competition.logo;

  return null;
}

import type { Club } from "@/types/football";
import crestManifest from "./club-crest-manifest.json";

/**
 * Centralized club crest resolution.
 *
 * Crests are keyed by a *stable club id* — football-data.org's numeric team
 * id — not by club name, because providers disagree on names for the same
 * club ("Bayern München" / "Bayern Munich", "Internazionale" / "Inter
 * Milan"). Names are only ever used as a last-resort alias lookup, and each
 * alias is scoped to exactly one entry so two similarly named clubs can
 * never collide.
 *
 * Crest files live in /public/images/clubs and are synced by
 * `npm run sync:crests` (scripts/sync-club-crests.ts), so coverage follows
 * the fixture database rather than a hand-maintained shortlist.
 */
export interface ClubCrest {
  /**
   * football-data.org team id — the join key across providers. Null for a
   * club that provider does not cover, which then needs `crestUrl`.
   */
  footballDataId: number | null;
  /**
   * Explicit crest source, used when football-data.org has no crest for the
   * club (e.g. LALIGA's own club shields). The sync script prefers it.
   */
  crestUrl?: string;
  /** Seatigo's own club slug, and the manifest key for its crest file. */
  slug: string;
  /**
   * Lowercase name variants seen across providers. Used only when neither
   * id nor slug matches; never shared between entries.
   */
  aliases: string[];
}

/**
 * slug -> filename under /public/images/clubs, written by the sync script.
 * This file owns the curated part (ids and aliases); the manifest owns the
 * generated part (which file, and in which format), so re-syncing never
 * requires a hand edit here.
 */
const crestFiles = crestManifest as Record<string, string | undefined>;

const CREST_DIR = "/images/clubs";

export const CLUB_CRESTS: ClubCrest[] = [
  // Premier League 2026/27 — all 20 participating clubs
  { footballDataId: 1044, slug: "afc-bournemouth", aliases: ["afc bournemouth", "bournemouth"] },
  { footballDataId: 57, slug: "arsenal", aliases: ["arsenal", "arsenal fc"] },
  { footballDataId: 58, slug: "aston-villa", aliases: ["aston villa", "aston villa fc", "villa"] },
  { footballDataId: 402, slug: "brentford", aliases: ["brentford", "brentford fc"] },
  { footballDataId: 397, slug: "brighton-hove-albion", aliases: ["brighton hove albion", "brighton & hove albion", "brighton and hove albion", "brighton"] },
  { footballDataId: 61, slug: "chelsea", aliases: ["chelsea", "chelsea fc"] },
  { footballDataId: 1076, slug: "coventry-city", aliases: ["coventry city", "coventry"] },
  { footballDataId: 354, slug: "crystal-palace", aliases: ["crystal palace", "crystal palace fc", "palace"] },
  { footballDataId: 62, slug: "everton", aliases: ["everton", "everton fc"] },
  { footballDataId: 63, slug: "fulham", aliases: ["fulham", "fulham fc"] },
  { footballDataId: 322, slug: "hull-city", aliases: ["hull city", "hull", "hull city afc"] },
  { footballDataId: 349, slug: "ipswich-town", aliases: ["ipswich town", "ipswich"] },
  { footballDataId: 341, slug: "leeds-united", aliases: ["leeds united", "leeds"] },
  { footballDataId: 64, slug: "liverpool", aliases: ["liverpool", "liverpool fc"] },
  { footballDataId: 65, slug: "manchester-city", aliases: ["manchester city", "manchester city fc", "man city"] },
  { footballDataId: 66, slug: "manchester-united", aliases: ["manchester united", "manchester united fc", "man united", "man utd"] },
  { footballDataId: 67, slug: "newcastle-united", aliases: ["newcastle united", "newcastle united fc", "newcastle"] },
  { footballDataId: 351, slug: "nottingham-forest", aliases: ["nottingham forest", "nott m forest", "notts forest", "forest"] },
  { footballDataId: 71, slug: "sunderland", aliases: ["sunderland", "sunderland afc"] },
  { footballDataId: 73, slug: "tottenham-hotspur", aliases: ["tottenham hotspur", "tottenham hotspur fc", "tottenham", "spurs"] },

  // LALIGA EA SPORTS 2026/27 — all 20 participating clubs.
  // Clubs football-data.org does not cover carry LALIGA's own club shield.
  { footballDataId: 86, slug: "real-madrid", aliases: ["real madrid", "real madrid cf"] },
  { footballDataId: 81, slug: "barcelona", aliases: ["barcelona", "fc barcelona", "barca", "barça"] },
  { footballDataId: 78, slug: "atletico-madrid", aliases: ["atletico madrid", "atlético madrid", "club atletico de madrid", "atletico de madrid", "atletico", "atlético", "atleti"] },
  { footballDataId: 263, slug: "deportivo-alaves", aliases: ["deportivo alaves", "deportivo alavés", "alaves", "alavés"] },
  { footballDataId: 77, slug: "athletic-club", aliases: ["athletic club", "athletic bilbao", "athletic"] },
  { footballDataId: 90, slug: "real-betis", aliases: ["real betis", "real betis balompie", "betis"] },
  { footballDataId: 558, slug: "celta-vigo", aliases: ["rc celta de vigo", "celta de vigo", "celta vigo", "celta"] },
  { footballDataId: null, slug: "deportivo-la-coruna", crestUrl: "https://assets.laliga.com/assets/2026/06/24/medium/6b88661529a2c06840c8bf6bddd90970.png", aliases: ["rc deportivo de la coruna", "rc deportivo de la coruña", "deportivo de la coruna", "deportivo la coruna", "rc deportivo", "deportivo", "depor"] },
  { footballDataId: 285, slug: "elche", aliases: ["elche cf", "elche"] },
  { footballDataId: 80, slug: "espanyol", aliases: ["rcd espanyol", "rcd espanyol de barcelona", "espanyol"] },
  { footballDataId: 82, slug: "getafe", aliases: ["getafe cf", "getafe"] },
  { footballDataId: 88, slug: "levante", aliases: ["levante ud", "levante"] },
  { footballDataId: null, slug: "malaga", crestUrl: "https://assets.laliga.com/assets/2019/06/07/medium/malaga.png", aliases: ["malaga cf", "málaga cf", "malaga", "málaga"] },
  { footballDataId: 79, slug: "osasuna", aliases: ["ca osasuna", "c a osasuna", "osasuna"] },
  { footballDataId: 87, slug: "rayo-vallecano", aliases: ["rayo vallecano", "rayo"] },
  { footballDataId: null, slug: "racing-santander", crestUrl: "https://assets.laliga.com/assets/2019/06/07/medium/racing.png", aliases: ["real racing club de santander", "racing de santander", "racing santander", "r racing club", "racing"] },
  { footballDataId: 92, slug: "real-sociedad", aliases: ["real sociedad", "real sociedad de futbol", "la real"] },
  { footballDataId: 559, slug: "sevilla", aliases: ["sevilla fc", "sevilla"] },
  { footballDataId: 95, slug: "valencia", aliases: ["valencia cf", "valencia"] },
  { footballDataId: 94, slug: "villarreal", aliases: ["villarreal cf", "villarreal"] },

  // Serie A Enilive 2026/27 — all 20 participating clubs
  { footballDataId: 102, slug: "atalanta", aliases: ["atalanta bc", "atalanta bergamasca calcio", "atalanta"] },
  { footballDataId: 103, slug: "bologna", aliases: ["bologna fc", "bologna fc 1909", "bologna"] },
  { footballDataId: 104, slug: "cagliari", aliases: ["cagliari calcio", "cagliari"] },
  // football-data.org id 1049 serves a different club's crest, so Como takes
  // the Lega Serie A asset instead. Caught by the visual crest check.
  { footballDataId: null, slug: "como", crestUrl: "https://media-sdp.legaseriea.it/clubLogos/367e70bf50b346209f8a0f16429850cb.webp", aliases: ["como 1907", "como"] },
  { footballDataId: 99, slug: "fiorentina", aliases: ["acf fiorentina", "fiorentina", "viola"] },
  { footballDataId: 470, slug: "frosinone", aliases: ["frosinone calcio", "frosinone"] },
  { footballDataId: 107, slug: "genoa", aliases: ["genoa cfc", "genoa cricket and football club", "genoa"] },
  { footballDataId: 108, slug: "inter-milan", aliases: ["inter milan", "fc internazionale milano", "internazionale", "inter"] },
  { footballDataId: 109, slug: "juventus", aliases: ["juventus fc", "juventus", "juve"] },
  { footballDataId: 110, slug: "lazio", aliases: ["ss lazio", "societa sportiva lazio", "lazio"] },
  { footballDataId: 5890, slug: "lecce", aliases: ["us lecce", "unione sportiva lecce", "lecce"] },
  { footballDataId: 98, slug: "ac-milan", aliases: ["ac milan", "milan", "associazione calcio milan"] },
  { footballDataId: 5911, slug: "monza", aliases: ["ac monza", "as monza", "monza"] },
  { footballDataId: 113, slug: "napoli", aliases: ["ssc napoli", "napoli"] },
  { footballDataId: 112, slug: "parma", aliases: ["parma calcio", "parma calcio 1913", "parma"] },
  { footballDataId: 100, slug: "as-roma", aliases: ["as roma", "roma"] },
  { footballDataId: 471, slug: "sassuolo", aliases: ["us sassuolo", "us sassuolo calcio", "sassuolo"] },
  { footballDataId: 586, slug: "torino", aliases: ["torino fc", "torino", "toro"] },
  { footballDataId: 115, slug: "udinese", aliases: ["udinese calcio", "udinese"] },
  { footballDataId: 454, slug: "venezia", aliases: ["venezia fc", "venezia"] },

  // Bundesliga 2026/27 — all 18 participating clubs, crests from the
  // league's own club-logo CDN.
  { footballDataId: null, slug: "koeln", crestUrl: "https://assets.bundesliga.com/clublogos/DFL-SEA-0001KA/DFL-CLU-000008.svg", aliases: ["1 fc koln", "1 fc koeln", "fc koln", "fc koeln", "koln", "koeln", "cologne"] },
  { footballDataId: null, slug: "union-berlin", crestUrl: "https://assets.bundesliga.com/clublogos/DFL-SEA-0001KA/DFL-CLU-00000V.svg", aliases: ["1 fc union berlin", "fc union berlin", "union berlin", "union"] },
  { footballDataId: null, slug: "mainz", crestUrl: "https://assets.bundesliga.com/clublogos/DFL-SEA-0001KA/DFL-CLU-000006.svg", aliases: ["1 fsv mainz 05", "fsv mainz 05", "mainz 05", "mainz"] },
  { footballDataId: null, slug: "leverkusen", crestUrl: "https://assets.bundesliga.com/clublogos/DFL-SEA-0001KA/DFL-CLU-00000B.svg", aliases: ["bayer 04 leverkusen", "bayer leverkusen", "leverkusen"] },
  { footballDataId: 4, slug: "borussia-dortmund", crestUrl: "https://assets.bundesliga.com/clublogos/DFL-SEA-0001KA/DFL-CLU-000007.svg", aliases: ["borussia dortmund", "bv borussia 09 dortmund", "dortmund", "bvb"] },
  { footballDataId: null, slug: "borussia-monchengladbach", crestUrl: "https://assets.bundesliga.com/clublogos/DFL-SEA-0001KA/DFL-CLU-000004.svg", aliases: ["borussia monchengladbach", "borussia moenchengladbach", "monchengladbach", "moenchengladbach", "gladbach"] },
  { footballDataId: null, slug: "eintracht-frankfurt", crestUrl: "https://assets.bundesliga.com/clublogos/DFL-SEA-0001KA/DFL-CLU-00000F.svg", aliases: ["eintracht frankfurt", "frankfurt", "sge"] },
  { footballDataId: null, slug: "augsburg", crestUrl: "https://assets.bundesliga.com/clublogos/DFL-SEA-0001KA/DFL-CLU-000010.svg", aliases: ["fc augsburg", "augsburg"] },
  { footballDataId: 5, slug: "bayern-munich", crestUrl: "https://assets.bundesliga.com/clublogos/DFL-SEA-0001KA/DFL-CLU-00000G.svg", aliases: ["fc bayern munchen", "fc bayern muenchen", "bayern munich", "bayern munchen", "bayern muenchen", "bayern", "fcb"] },
  { footballDataId: null, slug: "schalke-04", crestUrl: "https://assets.bundesliga.com/clublogos/DFL-SEA-0001KA/DFL-CLU-000009.svg", aliases: ["fc schalke 04", "schalke 04", "schalke", "s04"] },
  { footballDataId: null, slug: "hamburger-sv", crestUrl: "https://assets.bundesliga.com/clublogos/DFL-SEA-0001KA/DFL-CLU-00000C.svg", aliases: ["hamburger sv", "hamburg", "hsv"] },
  { footballDataId: 721, slug: "rb-leipzig", crestUrl: "https://assets.bundesliga.com/clublogos/DFL-SEA-0001KA/DFL-CLU-000017.svg", aliases: ["rb leipzig", "rasenballsport leipzig", "leipzig"] },
  { footballDataId: null, slug: "paderborn", crestUrl: "https://assets.bundesliga.com/clublogos/DFL-SEA-0001KA/DFL-CLU-00000L.svg", aliases: ["sc paderborn 07", "sc paderborn", "paderborn"] },
  { footballDataId: null, slug: "freiburg", crestUrl: "https://assets.bundesliga.com/clublogos/DFL-SEA-0001KA/DFL-CLU-00000A.svg", aliases: ["sc freiburg", "sport club freiburg", "freiburg"] },
  { footballDataId: null, slug: "elversberg", crestUrl: "https://assets.bundesliga.com/clublogos/DFL-SEA-0001KA/DFL-CLU-000N6L.svg", aliases: ["sv elversberg", "elversberg"] },
  { footballDataId: null, slug: "werder-bremen", crestUrl: "https://assets.bundesliga.com/clublogos/DFL-SEA-0001KA/DFL-CLU-00000E.svg", aliases: ["sv werder bremen", "werder bremen", "werder", "bremen"] },
  { footballDataId: null, slug: "hoffenheim", crestUrl: "https://assets.bundesliga.com/clublogos/DFL-SEA-0001KA/DFL-CLU-000002.svg", aliases: ["tsg hoffenheim", "tsg 1899 hoffenheim", "hoffenheim"] },
  { footballDataId: null, slug: "stuttgart", crestUrl: "https://assets.bundesliga.com/clublogos/DFL-SEA-0001KA/DFL-CLU-00000D.svg", aliases: ["vfb stuttgart", "stuttgart"] },

  // Ligue 1 McDonald's 2026/27 — all 18 participating clubs.
  // ligue1.com is the crest source: football-data.org does not cover the
  // promoted sides, and its ids for the rest were not worth guessing.
  { footballDataId: null, slug: "auxerre", crestUrl: "https://s3.eu-west-1.amazonaws.com/image.mpg/assets/clubs/logo/2023_4_2_128x128_f25b3b461b1ed57875618ac6f3ea96e8.png", aliases: ["aj auxerre", "auxerre"] },
  { footballDataId: null, slug: "angers", crestUrl: "https://s3.eu-west-1.amazonaws.com/image.mpg/assets/clubs/logo/2023_4_37_128x128_22f933b61100266bf7f510aad9b5ad28.png", aliases: ["angers sco", "angers"] },
  { footballDataId: null, slug: "brest", crestUrl: "https://s3.eu-west-1.amazonaws.com/image.mpg/assets/clubs/logo/2023_1_44_128x128_6e80f6db6cec2117be34cd65ab9edbd1.png", aliases: ["stade brestois 29", "stade brestois", "brest"] },
  { footballDataId: null, slug: "lorient", crestUrl: "https://s3.eu-west-1.amazonaws.com/image.mpg/assets/clubs/logo/2023_1_7_128x128_3d6b3608abb5b1dfa14a5e0c138c6c9d.png", aliases: ["fc lorient", "lorient"] },
  { footballDataId: null, slug: "le-havre", crestUrl: "https://s3.eu-west-1.amazonaws.com/image.mpg/assets/clubs/logo/2023_1_5_128x128_08ea6f21e63bbc926a6b2e99a54d66b9.png", aliases: ["le havre ac", "havre ac", "le havre", "havre"] },
  { footballDataId: null, slug: "le-mans", crestUrl: "https://s3.eu-west-1.amazonaws.com/image.mpg/7f0c4f0c-37e4-411f-b765-fbe1b5f4732e", aliases: ["le mans fc", "le mans"] },
  { footballDataId: null, slug: "lille", crestUrl: "https://s3.eu-west-1.amazonaws.com/image.mpg/assets/clubs/logo/2023_1_158_128x128_7bf9576cddda33d2c1ebd966f44779d3.png", aliases: ["losc lille", "losc", "lille"] },
  { footballDataId: null, slug: "nice", crestUrl: "https://s3.eu-west-1.amazonaws.com/image.mpg/assets/clubs/logo/2023_1_30_128x128_eb33f30ec2a8dfbebe1f8d5b49149451.png", aliases: ["ogc nice", "nice"] },
  { footballDataId: null, slug: "lyon", crestUrl: "https://s3.eu-west-1.amazonaws.com/image.mpg/assets/clubs/logo/2023_1_159_128x128_019eb4a1eab9b4c9b89829cbcbbeb1de.png", aliases: ["olympique lyonnais", "lyon", "ol"] },
  { footballDataId: null, slug: "marseille", crestUrl: "https://s3.eu-west-1.amazonaws.com/image.mpg/assets/clubs/logo/2025_1_1_128x128_0c05c0138f105c2fb1632d16a6e5a9e8.png", aliases: ["olympique de marseille", "olympique marseille", "marseille", "om"] },
  { footballDataId: 524, slug: "paris-saint-germain", aliases: ["paris saint-germain", "paris saint germain", "paris saint-germain fc", "psg"] },
  { footballDataId: null, slug: "paris-fc", crestUrl: "https://s3.eu-west-1.amazonaws.com/image.mpg/assets/clubs/logo/2026_1_90_128x128_dc9d2c4c7ba86ab318ff003c7a65cbf0.png", aliases: ["paris fc"] },
  { footballDataId: null, slug: "lens", crestUrl: "https://s3.eu-west-1.amazonaws.com/image.mpg/assets/clubs/logo/2026_1_6_128x128_0c59b9fd66a5c5256756a19fba1239ee.png", aliases: ["rc lens", "lens"] },
  { footballDataId: null, slug: "rennes", crestUrl: "https://s3.eu-west-1.amazonaws.com/image.mpg/assets/clubs/logo/2023_1_14_128x128_e7371f8a913a19713876abf7cb92e131.png", aliases: ["stade rennais fc", "stade rennais", "rennes"] },
  { footballDataId: null, slug: "strasbourg", crestUrl: "https://s3.eu-west-1.amazonaws.com/image.mpg/assets/clubs/logo/2023_1_15_128x128_b0690caabe8c7f44215d7664eed973b4.png", aliases: ["rc strasbourg alsace", "rc strasbourg", "strasbourg"] },
  { footballDataId: null, slug: "toulouse", crestUrl: "https://s3.eu-west-1.amazonaws.com/image.mpg/assets/clubs/logo/2023_1_16_128x128_a5add8c2d780e5d231b1b2732e313eeb.png", aliases: ["toulouse fc", "toulouse"] },
  { footballDataId: null, slug: "troyes", crestUrl: "https://s3.eu-west-1.amazonaws.com/image.mpg/assets/clubs/logo/2023_4_33_128x128_fda89ec63ce6cd3429cf0d4c366bddee.png", aliases: ["estac troyes", "troyes"] },
  { footballDataId: 548, slug: "monaco", crestUrl: "https://s3.eu-west-1.amazonaws.com/image.mpg/assets/clubs/logo/2023_1_9_128x128_486e4b383509816f94f5ab9269a14449.png", aliases: ["as monaco", "monaco", "as monaco fc"] },

  // UEFA Champions League 2026/27 — the 15 league-phase clubs that play in
  // no domestic league Seatigo covers. The other 21 are already above and
  // reuse their entries, so a club has one crest across every competition.
  //
  // Where football-data.org covers the club, its id is used and was checked
  // by eye against the rendered crest (see docs/champions-league-import.md).
  // The rest carry UEFA's own team artwork, keyed by UEFA's team id — which
  // cannot be mis-assigned, because the id comes from the fixture record the
  // club appears in rather than from a lookup by name.
  { footballDataId: null, slug: "aek-athens", crestUrl: "https://img.uefa.com/imgml/TP/teams/logos/700x700/50129.png", aliases: ["aek athens fc", "aek athens", "aek"] },
  { footballDataId: null, slug: "bodo-glimt", crestUrl: "https://img.uefa.com/imgml/TP/teams/logos/700x700/59333.png", aliases: ["fk bodo glimt", "fk bodø/glimt", "bodo glimt", "bodø/glimt", "glimt"] },
  { footballDataId: 851, slug: "club-brugge", aliases: ["club brugge kv", "club brugge", "brugge", "bruges"] },
  { footballDataId: null, slug: "fenerbahce", crestUrl: "https://img.uefa.com/imgml/TP/teams/logos/700x700/52692.png", aliases: ["fenerbahce sk", "fenerbahçe sk", "fenerbahce", "fenerbahçe"] },
  { footballDataId: null, slug: "feyenoord", crestUrl: "https://img.uefa.com/imgml/TP/teams/logos/700x700/52749.png", aliases: ["feyenoord", "feyenoord rotterdam"] },
  { footballDataId: 610, slug: "galatasaray", aliases: ["galatasaray a s", "galatasaray as", "galatasaray sk", "galatasaray"] },
  { footballDataId: 2016, slug: "lask", aliases: ["lask", "lask linz"] },
  { footballDataId: 503, slug: "porto", aliases: ["fc porto", "porto"] },
  { footballDataId: 674, slug: "psv-eindhoven", aliases: ["psv eindhoven", "psv"] },
  { footballDataId: null, slug: "sabah", crestUrl: "https://img.uefa.com/imgml/TP/teams/logos/700x700/2609356.png", aliases: ["sabah fc", "sabah", "sabah baku"] },
  { footballDataId: 1887, slug: "shakhtar-donetsk", aliases: ["fc shakhtar donetsk", "shakhtar donetsk", "shakhtar"] },
  { footballDataId: null, slug: "slavia-praha", crestUrl: "https://img.uefa.com/imgml/TP/teams/logos/700x700/52498.png", aliases: ["sk slavia praha", "slavia praha", "slavia prague", "slavia"] },
  { footballDataId: null, slug: "slovan-bratislava", crestUrl: "https://img.uefa.com/imgml/TP/teams/logos/700x700/52797.png", aliases: ["sk slovan bratislava", "š k slovan bratislava", "slovan bratislava", "slovan"] },
  // UEFA serves Sporting's flat single-colour mark; football-data.org has
  // the current full-colour crest, verified by eye.
  { footballDataId: 498, slug: "sporting-cp", aliases: ["sporting clube de portugal", "sporting cp", "sporting lisbon", "sporting"] },
  { footballDataId: null, slug: "viking", crestUrl: "https://img.uefa.com/imgml/TP/teams/logos/700x700/52319.png", aliases: ["viking fk", "viking stavanger", "viking"] },

  // UEFA Europa League 2026/27 — the 24 league-phase clubs not already
  // covered by a domestic league or the Champions League. All carry UEFA's
  // own team artwork, keyed by the UEFA team id taken from the fixture
  // record the club appears in, so the crest cannot be mis-assigned by a
  // name lookup. Every one was rendered and checked by eye.
  { footballDataId: null, slug: "anderlecht", crestUrl: "https://img.uefa.com/imgml/TP/teams/logos/700x700/50074.png", aliases: ["rsc anderlecht", "royal sporting club anderlecht", "anderlecht"] },
  { footballDataId: null, slug: "ararat-armenia", crestUrl: "https://img.uefa.com/imgml/TP/teams/logos/700x700/2610304.png", aliases: ["fc ararat armenia", "ararat armenia", "ararat-armenia"] },
  { footballDataId: null, slug: "az-alkmaar", crestUrl: "https://img.uefa.com/imgml/TP/teams/logos/700x700/52327.png", aliases: ["az alkmaar", "alkmaar zaanstreek", "az"] },
  { footballDataId: null, slug: "benfica", crestUrl: "https://img.uefa.com/imgml/TP/teams/logos/700x700/50147.png", aliases: ["sl benfica", "sport lisboa e benfica", "benfica"] },
  { footballDataId: null, slug: "besiktas", crestUrl: "https://img.uefa.com/imgml/TP/teams/logos/700x700/50157.png", aliases: ["besiktas jk", "beşiktaş jk", "besiktas", "beşiktaş"] },
  { footballDataId: null, slug: "celje", crestUrl: "https://img.uefa.com/imgml/TP/teams/logos/700x700/59030.png", aliases: ["nk celje", "celje"] },
  { footballDataId: null, slug: "celtic", crestUrl: "https://img.uefa.com/imgml/TP/teams/logos/700x700/50050.png", aliases: ["celtic fc", "celtic glasgow", "celtic"] },
  { footballDataId: null, slug: "dinamo-zagreb", crestUrl: "https://img.uefa.com/imgml/TP/teams/logos/700x700/50164.png", aliases: ["gnk dinamo zagreb", "gnk dinamo", "dinamo zagreb", "nk dinamo zagreb"] },
  { footballDataId: null, slug: "ferencvaros", crestUrl: "https://img.uefa.com/imgml/TP/teams/logos/700x700/52298.png", aliases: ["ferencvarosi tc", "ferencvárosi tc", "ferencvaros", "ferencváros", "fradi"] },
  { footballDataId: null, slug: "hapoel-beer-sheva", crestUrl: "https://img.uefa.com/imgml/TP/teams/logos/700x700/59340.png", aliases: ["hapoel beer sheva fc", "hapoel beer-sheva", "hapoel beer sheva", "hapoel be er sheva"] },
  { footballDataId: null, slug: "jagiellonia-bialystok", crestUrl: "https://img.uefa.com/imgml/TP/teams/logos/700x700/2600277.png", aliases: ["jagiellonia bialystok", "jagiellonia białystok", "jagiellonia"] },
  { footballDataId: null, slug: "lech-poznan", crestUrl: "https://img.uefa.com/imgml/TP/teams/logos/700x700/64227.png", aliases: ["kks lech poznan", "kks lech poznań", "lech poznan", "lech poznań", "lech"] },
  { footballDataId: null, slug: "levski-sofia", crestUrl: "https://img.uefa.com/imgml/TP/teams/logos/700x700/50044.png", aliases: ["pfc levski sofia", "levski sofia", "levski"] },
  { footballDataId: null, slug: "lillestrom", crestUrl: "https://img.uefa.com/imgml/TP/teams/logos/700x700/52314.png", aliases: ["lillestrom sk", "lillestrøm sk", "lillestrom", "lillestrøm", "lsk"] },
  { footballDataId: null, slug: "nec-nijmegen", crestUrl: "https://img.uefa.com/imgml/TP/teams/logos/700x700/52330.png", aliases: ["n e c nijmegen", "nec nijmegen", "nec"] },
  { footballDataId: null, slug: "ofi-crete", crestUrl: "https://img.uefa.com/imgml/TP/teams/logos/700x700/52953.png", aliases: ["ofi crete fc", "ofi crete", "ofi"] },
  { footballDataId: null, slug: "olympiacos", crestUrl: "https://img.uefa.com/imgml/TP/teams/logos/700x700/2610.png", aliases: ["olympiacos fc", "olympiakos", "olympiacos piraeus", "olympiacos"] },
  { footballDataId: null, slug: "omonia", crestUrl: "https://img.uefa.com/imgml/TP/teams/logos/700x700/50077.png", aliases: ["omonia fc", "ac omonia", "omonia nicosia", "omonoia"] },
  // UEFA lists the club sponsor-free as FC Salzburg.
  { footballDataId: null, slug: "salzburg", crestUrl: "https://img.uefa.com/imgml/TP/teams/logos/700x700/50030.png", aliases: ["fc salzburg", "fc red bull salzburg", "red bull salzburg", "rb salzburg", "salzburg"] },
  { footballDataId: null, slug: "sparta-praha", crestUrl: "https://img.uefa.com/imgml/TP/teams/logos/700x700/50033.png", aliases: ["ac sparta praha", "sparta praha", "sparta prague"] },
  { footballDataId: null, slug: "sturm-graz", crestUrl: "https://img.uefa.com/imgml/TP/teams/logos/700x700/50111.png", aliases: ["sk sturm graz", "sturm graz", "sturm"] },
  { footballDataId: null, slug: "torreense", crestUrl: "https://img.uefa.com/imgml/TP/teams/logos/700x700/2603107.png", aliases: ["scu torreense", "sport clube uniao torreense", "torreense"] },
  { footballDataId: null, slug: "union-saint-gilloise", crestUrl: "https://img.uefa.com/imgml/TP/teams/logos/700x700/64125.png", aliases: ["r union saint gilloise", "royale union saint gilloise", "union saint-gilloise", "union sg", "usg"] },
  { footballDataId: null, slug: "viktoria-plzen", crestUrl: "https://img.uefa.com/imgml/TP/teams/logos/700x700/64388.png", aliases: ["fc viktoria plzen", "fc viktoria plzeň", "viktoria plzen", "viktoria plzeň", "plzen"] },
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const byFootballDataId = new Map(
  CLUB_CRESTS.flatMap((c) => (c.footballDataId != null ? [[c.footballDataId, c] as const] : [])),
);
const bySlug = new Map(CLUB_CRESTS.map((c) => [c.slug, c]));
const byAlias = new Map<string, ClubCrest>();
for (const crest of CLUB_CRESTS) {
  for (const alias of crest.aliases) {
    const key = normalize(alias);
    const clash = byAlias.get(key);
    if (clash && clash.slug !== crest.slug) {
      // Two clubs claiming one alias is how a club ends up wearing another
      // club's badge. Fail loudly in development rather than guess.
      throw new Error(
        `Duplicate club crest alias "${alias}": ${clash.slug} vs ${crest.slug}`,
      );
    }
    byAlias.set(key, crest);
  }
}

/** Pulls the provider's numeric id back out of a Seatigo club id ("fd-57"). */
function footballDataIdOf(club: Club): number | null {
  const match = /^fd-(\d+)$/.exec(club.id);
  return match ? Number(match[1]) : null;
}

/** Hosts we are willing to load a remote crest from. */
const TRUSTED_CREST_HOSTS = new Set(["crests.football-data.org"]);

function isTrustedCrestUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && TRUSTED_CREST_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * The crest to render for a club, or null when none is known.
 *
 * Id first, then slug, then name alias — so a club whose name a provider
 * spells differently still resolves, while a club we have never seen simply
 * gets the fallback instead of a wrong badge.
 */
export function resolveClubCrest(club: Club): string | null {
  const id = footballDataIdOf(club);
  const entry =
    (id != null ? byFootballDataId.get(id) : undefined) ??
    bySlug.get(club.slug) ??
    byAlias.get(normalize(club.name)) ??
    byAlias.get(normalize(club.shortName));

  const file = entry ? crestFiles[entry.slug] : undefined;
  if (file) return `${CREST_DIR}/${file}`;

  // A club outside the registry can still carry a crest URL straight from
  // the football API, which keeps new fixtures covered automatically.
  if (club.logo && isTrustedCrestUrl(club.logo)) return club.logo;

  return null;
}

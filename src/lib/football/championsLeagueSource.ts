import type { clubs, stadiums } from "./referenceData";
import type { UefaCompetitionSource } from "./uefaSource";

/**
 * The join between UEFA's vocabulary and Seatigo's, for the Champions
 * League. The Europa League has its own table of the same shape; the
 * machinery that uses them is shared (uefaSeason.ts, scripts/lib/uefa-import.ts).
 *
 * Every mapping here is curated and explicit. Nothing is matched by fuzzy
 * name comparison — that is how a club ends up wearing another club's crest.
 */

/**
 * UEFA's official venue name -> Seatigo stadium key.
 *
 * UEFA strips club sponsor names from venue titles for its own competitions,
 * so the same ground appears here under a different name from the one the
 * domestic league publishes ("Arsenal Stadium" is the Emirates, "Fußball
 * Arena München" is the Allianz Arena). Mapping them back onto the existing
 * records keeps one stadium per physical ground.
 */
const VENUES: Record<string, keyof typeof stadiums> = {
  // Grounds a domestic league already covers.
  Anfield: "anfield",
  "Arsenal Stadium": "emirates",
  "BVB Stadion Dortmund": "signal_iduna_park",
  "Camp Nou": "spotify_camp_nou",
  "City of Manchester Stadium": "etihad",
  "Estadio Metropolitano": "metropolitano",
  "Estadio Santiago Bernabéu": "bernabeu",
  "Fußball Arena München": "allianz_arena",
  "Old Trafford": "old_trafford",
  "Parc des Princes": "parc_des_princes",
  "RB Arena": "red_bull_arena_leipzig",
  "Stadio Diego Armando Maradona": "maradona",
  "Stadio Olimpico": "olimpico",
  "Stadio San Siro": "san_siro",
  // Shakhtar play their home ties in London; this is UEFA's own listing.
  "Stamford Bridge": "stamford_bridge",

  // Grounds added for this competition.
  "AEK Arena": "aek_arena",
  "Ali Sami Yen Spor Kompleksi": "ali_sami_yen",
  "Arena Stuttgart": "arena_stuttgart",
  Aspmyra: "aspmyra",
  "Baku Olympic Stadium": "baku_olympic",
  "Eden Arena": "eden_arena",
  "Estadio de la Cerámica": "la_ceramica",
  "Estádio do Dragão": "do_dragao",
  "Estádio José Alvalade": "jose_alvalade",
  "Fenerbahçe Şükrü Saracoğlu Spor Kompleksi": "sukru_saracoglu",
  "Giuseppe Sinigaglia": "sinigaglia",
  "Jan Breydelstadion": "jan_breydel",
  "La Cartuja de Sevilla": "la_cartuja",
  "Národný futbalový štadión": "narodny_futbalovy",
  "Oberösterreich Arena": "oberosterreich_arena",
  "PSV Stadion": "psv_stadion",
  "Stade Bollaert-Delelis": "bollaert_delelis",
  "Stade Pierre Mauroy": "pierre_mauroy",
  "Stadion Feijenoord 'De Kuip'": "de_kuip",
  "Viking stadion": "viking_stadion",
  "Villa Park": "villa_park",
};

/**
 * UEFA's official club name -> Seatigo club key.
 *
 * The 21 clubs that also play in a domestic league Seatigo covers map onto
 * their existing records, which is what makes Arsenal one club with one id
 * and one crest across the Premier League and the Champions League.
 */
const CLUBS: Record<string, keyof typeof clubs> = {
  "AEK Athens FC": "aek_athens",
  "AS Roma": "roma",
  "Arsenal FC": "arsenal",
  "Aston Villa": "aston_villa",
  "Atlético de Madrid": "atletico",
  "Borussia Dortmund": "dortmund",
  "Club Brugge KV": "club_brugge",
  "Como 1907": "como",
  "FC Barcelona": "barcelona",
  "FC Bayern München": "bayern",
  "FC Internazionale Milano": "inter",
  "FC Porto": "porto",
  "FC Shakhtar Donetsk": "shakhtar",
  "FK Bodø/Glimt": "bodo_glimt",
  "Fenerbahçe SK": "fenerbahce",
  Feyenoord: "feyenoord",
  "Galatasaray A.Ş.": "galatasaray",
  LASK: "lask",
  "LOSC Lille": "lille",
  "Liverpool FC": "liverpool",
  "Manchester City": "man_city",
  "Manchester United": "man_utd",
  "PSV Eindhoven": "psv",
  "Paris Saint-Germain": "psg",
  "RB Leipzig": "leipzig",
  "RC Lens": "lens",
  "Real Betis Balompié": "betis",
  "Real Madrid C.F.": "real_madrid",
  "SK Slavia Praha": "slavia_praha",
  "SSC Napoli": "napoli",
  "Sabah FC": "sabah",
  "Sporting Clube de Portugal": "sporting_cp",
  "VfB Stuttgart": "stuttgart",
  "Viking FK": "viking",
  "Villarreal CF": "villarreal",
  "ŠK Slovan Bratislava": "slovan_bratislava",
};

export const CHAMPIONS_LEAGUE_SOURCE: UefaCompetitionSource = {
  uefaCompetitionId: "1",
  /** UEFA labels a season by the year it ends in. */
  uefaSeasonYear: "2027",
  seasonLabel: "2026/27",
  competitionSlug: "champions-league",
  idPrefix: "ucl",
  label: "Champions League",
  sourceUrl: "https://www.uefa.com/uefachampionsleague/fixtures-results/",
  dataFile: "champions-league-2026-27.json",
  venues: VENUES,
  clubs: CLUBS,
};

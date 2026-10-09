import type { clubs, stadiums } from "./referenceData";
import type { UefaCompetitionSource } from "./uefaSource";

/**
 * The join between UEFA's vocabulary and Seatigo's, for the Europa League.
 * Same shape as championsLeagueSource.ts; the machinery that uses them is
 * shared (uefaSeason.ts, scripts/lib/uefa-import.ts).
 *
 * Every mapping here is curated and explicit. Nothing is matched by fuzzy
 * name comparison — that is how a club ends up wearing another club's crest.
 */

/**
 * UEFA's official venue name -> Seatigo stadium key.
 *
 * As in the Champions League, UEFA strips club sponsor names, so a ground
 * can appear under a different title from the one its domestic league
 * publishes ("Juventus Stadium" is the Allianz Stadium, "Rhein-Neckar-Arena"
 * is Hoffenheim's PreZero Arena). Mapping them back keeps one record per
 * physical ground.
 */
const VENUES: Record<string, keyof typeof stadiums> = {
  // Grounds a domestic league or the Champions League already covers.
  "Juventus Stadium": "allianz_stadium_turin",
  "Stade Vélodrome": "velodrome",
  "Stadio San Siro": "san_siro",

  // Grounds added for this competition.
  "AZ Stadion": "az_stadion",
  BayArena: "bayarena",
  "Beşiktaş Stadium": "besiktas_stadium",
  "Bournemouth Stadium": "bournemouth_stadium",
  "Celtic Park": "celtic_park",
  "Den Dreef": "den_dreef",
  "Düsseldorf Arena": "dusseldorf_arena",
  "Estadio Balaidos": "balaidos",
  "Estadio de Anoeta": "anoeta",
  "Estádio Municipal de Leiria - Dr. Magalhães Pessoa": "leiria_municipal",
  "Estádio do SL Benfica": "benfica_estadio",
  "Ferencváros Stadion": "ferencvaros_stadion",
  GSP: "gsp",
  // Hapoel Beer-Sheva host in Bucharest; this is UEFA's own listing.
  "Giulesti Stadium": "giulesti",
  Goffertstadion: "goffertstadion",
  "Municipal Stadium in Bialystok": "bialystok_municipal",
  "Natsionalen Stadion Vasil Levski": "vasil_levski",
  "OL Stadium": "ol_stadium",
  Pankritio: "pankritio",
  "Poznan Stadium": "poznan_stadium",
  "RSC Anderlecht Stadium": "anderlecht_stadium",
  "Republican Stadium after Vazgen Sargsyan": "vazgen_sargsyan",
  "Rhein-Neckar-Arena": "rhein_neckar_arena",
  "Roazhon Park": "roazhon_park",
  "Selhurst Park": "selhurst_park",
  "Stadio Georgios Karaiskakis": "karaiskakis",
  "Stadion Celje": "stadion_celje",
  "Stadion Letná": "stadion_letna",
  "Stadion Maksimir": "stadion_maksimir",
  "Stadion Salzburg": "stadion_salzburg",
  "Stadion města Plzně": "plzen_mesta",
  "Stadium Graz Liebenau": "graz_liebenau",
  "Stadium of Light": "stadium_of_light",
  Åråsen: "arasen",
};

/**
 * UEFA's official club name -> Seatigo club key.
 *
 * The 12 clubs that also play in a domestic league Seatigo covers map onto
 * their existing records, so Milan, Juventus and Marseille are one club
 * each across their league and Europe.
 */
const CLUBS: Record<string, keyof typeof clubs> = {
  "AC Milan": "ac_milan",
  "AC Sparta Praha": "sparta_praha",
  "AFC Bournemouth": "afc_bournemouth",
  "AZ Alkmaar": "az_alkmaar",
  "Bayer 04 Leverkusen": "leverkusen",
  "Beşiktaş JK": "besiktas",
  "Celtic FC": "celtic",
  "Crystal Palace F.C.": "crystal_palace",
  "FC Ararat-Armenia": "ararat_armenia",
  "FC Salzburg": "salzburg",
  "FC Viktoria Plzeň": "viktoria_plzen",
  "Ferencvárosi TC": "ferencvaros",
  "GNK Dinamo": "dinamo_zagreb",
  "Hapoel Beer-Sheva FC": "hapoel_beer_sheva",
  "Jagiellonia Białystok": "jagiellonia",
  Juventus: "juventus",
  "KKS Lech Poznań": "lech_poznan",
  "Lillestrøm SK": "lillestrom",
  "N.E.C. Nijmegen": "nec_nijmegen",
  "NK Celje": "celje",
  "OFI Crete FC": "ofi_crete",
  "Olympiacos FC": "olympiacos",
  "Olympique Lyonnais": "lyon",
  "Olympique de Marseille": "marseille",
  "Omonia FC": "omonia",
  "PFC Levski Sofia": "levski_sofia",
  "R. Union Saint-Gilloise": "union_saint_gilloise",
  "RSC Anderlecht": "anderlecht",
  "Real Club Celta": "celta",
  "Real Sociedad de Fútbol": "real_sociedad",
  "SCU Torreense": "torreense",
  "SK Sturm Graz": "sturm_graz",
  "SL Benfica": "benfica",
  "Stade Rennais FC": "rennes",
  "Sunderland AFC": "sunderland",
  "TSG 1899 Hoffenheim": "hoffenheim",
};

export const EUROPA_LEAGUE_SOURCE: UefaCompetitionSource = {
  uefaCompetitionId: "14",
  /** UEFA labels a season by the year it ends in. */
  uefaSeasonYear: "2027",
  seasonLabel: "2026/27",
  competitionSlug: "europa-league",
  idPrefix: "uel",
  label: "Europa League",
  sourceUrl: "https://www.uefa.com/uefaeuropaleague/fixtures-results/",
  dataFile: "europa-league-2026-27.json",
  venues: VENUES,
  clubs: CLUBS,
};

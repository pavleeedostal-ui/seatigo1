/**
 * The one way Seatigo flattens text before comparing it.
 *
 * Lowercases, strips diacritics and reduces punctuation to single spaces, so
 * "Bayern München", "bayern munchen" and "BAYERN  MUNCHEN" are the same
 * string. Anything that builds a search haystack and anything that searches
 * it must use this same function, or the two will disagree about what
 * matches — which is why it lives here rather than being written out again
 * at each call site.
 */
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Clubs whose name starts with a digit or symbol are filed together. */
export const NON_ALPHA_GROUP = "#";

/**
 * The A–Z bucket a name belongs to, from its normalized first character.
 * "Ö" files under O, "1. FC Köln" under `NON_ALPHA_GROUP`.
 */
export function initialOf(value: string): string {
  const first = normalizeText(value).charAt(0);
  return first >= "a" && first <= "z" ? first.toUpperCase() : NON_ALPHA_GROUP;
}

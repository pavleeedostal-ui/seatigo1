import type {
  ConfigProblem,
  ConfigResult,
  FootballTicketNetConfig,
  FtnEvent,
  FtnEventQuery,
} from "./types";

/**
 * Football Ticket Net — configuration, HTTP and outbound-link building.
 *
 * Nothing in this file runs in the browser. The API key is read from the
 * server environment, is never attached to an offer object, and is never
 * part of the outbound URL a visitor follows.
 *
 * The provider is **off until it is configured**. Every entry point below
 * returns an empty result when configuration is missing or invalid, so a
 * deployment without credentials shows "No offers available yet" on a
 * fixture rather than anything invented.
 */

/** Seconds before an in-flight provider call is abandoned. */
const REQUEST_TIMEOUT_MS = 6_000;

export const FOOTBALL_TICKET_NET_PROVIDER_ID = "football-ticket-net";

/**
 * Anything that can answer the three variable lookups. Wider than
 * `NodeJS.ProcessEnv` on purpose, so a test can pass a plain object without
 * having to fabricate the rest of the environment.
 */
export type EnvSource = Record<string, string | undefined>;

/**
 * Reads and validates the three environment variables.
 *
 * Never cached: a value can be rotated without a redeploy, and this is a
 * few string checks.
 */
export function readConfig(env: EnvSource = process.env): ConfigResult {
  const apiKey = env.FOOTBALL_TICKET_NET_API_KEY?.trim() ?? "";
  const affiliateId = env.FOOTBALL_TICKET_NET_AFFILIATE_ID?.trim() ?? "";
  const rawBaseUrl = env.FOOTBALL_TICKET_NET_API_BASE_URL?.trim() ?? "";

  const problems: ConfigProblem[] = [];
  if (!apiKey) problems.push("missing-api-key");
  if (!affiliateId) problems.push("missing-affiliate-id");

  if (!rawBaseUrl) {
    problems.push("missing-base-url");
  } else {
    let parsed: URL | null = null;
    try {
      parsed = new URL(rawBaseUrl);
    } catch {
      problems.push("base-url-not-a-url");
    }
    // Credentials travel on this connection, so plaintext is not an option
    // even in a staging environment.
    if (parsed && parsed.protocol !== "https:") problems.push("base-url-not-https");
  }

  if (problems.length > 0) return { ok: false, problems };

  return {
    ok: true,
    config: {
      apiKey,
      affiliateId,
      baseUrl: rawBaseUrl.replace(/\/+$/, ""),
    },
  };
}

export function isConfigured(env: EnvSource = process.env): boolean {
  return readConfig(env).ok;
}

/**
 * Logged once per process rather than per request, so an unconfigured
 * deployment says so in the boot logs without flooding them on every
 * fixture page.
 */
const warned = new Set<string>();

export function warnOnce(key: string, message: string): void {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[seatigo:football-ticket-net] ${message}`);
}

/** Test seam: lets a test observe the one-time warnings again. */
export function resetWarnings(): void {
  warned.clear();
}

/**
 * Attaches affiliate tracking to a provider deeplink.
 *
 * Done at redirect time rather than when the offer is built, so the
 * affiliate id is applied by the server on the way out and an offer object
 * that reaches the browser carries only the plain seller URL.
 *
 * Returns null for anything that is not an https URL. A redirect is the one
 * place Seatigo hands a visitor to someone else, so a destination that
 * cannot be parsed, or that would downgrade the connection, is refused
 * rather than patched up.
 *
 * TODO(ftn-api): `AFFILIATE_QUERY_PARAM` is a placeholder. Replace it with
 * the parameter name in Football Ticket Net's affiliate documentation —
 * and if they require a path prefix or a signed token instead of a query
 * parameter, replace the body, not just the constant.
 */
export const AFFILIATE_QUERY_PARAM = "aff";

export function buildAffiliateUrl(
  deeplink: string,
  affiliateId: string,
): string | null {
  let url: URL;
  try {
    url = new URL(deeplink);
  } catch {
    return null;
  }

  if (url.protocol !== "https:") return null;
  if (!affiliateId) return url.toString();

  // `set`, not `append`: a deeplink that already carries the parameter is
  // corrected rather than given two conflicting values.
  url.searchParams.set(AFFILIATE_QUERY_PARAM, affiliateId);
  return url.toString();
}

/**
 * One GET against the provider, returning `null` on any failure.
 *
 * Every error path — unconfigured, non-2xx, timeout, unparseable body — is
 * the same `null`, because the only correct behaviour for a ticket seller
 * Seatigo cannot reach is to show no offers from that seller. A fixture
 * page must still render.
 */
async function getJson(path: string, config: FootballTicketNetConfig): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      // TODO(ftn-api): confirm the authentication scheme. A bearer token is
      // assumed; it may be an `X-Api-Key` header or a query parameter.
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      signal: controller.signal,
      // Offers are priced inventory; never served from a cache.
      cache: "no-store",
    });

    if (!response.ok) {
      warnOnce(
        `http-${response.status}`,
        `provider responded ${response.status} ${response.statusText}; showing no offers`,
      );
      return null;
    }

    return await response.json();
  } catch (error) {
    const reason = error instanceof Error ? error.name : "unknown";
    warnOnce(`fetch-${reason}`, `provider request failed (${reason}); showing no offers`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Searches the provider for events matching a fixture.
 *
 * Returns `[]` rather than throwing for every failure mode, including
 * "not configured".
 *
 * TODO(ftn-api): the path and query parameters below are placeholders.
 * Replace `/events` and the parameter names with the documented search
 * endpoint. If the API requires an internal competition or venue id rather
 * than free text, that lookup belongs here too.
 */
export async function searchEvents(
  query: FtnEventQuery,
  env: EnvSource = process.env,
): Promise<FtnEvent[]> {
  const result = readConfig(env);
  if (!result.ok) {
    warnOnce(
      "unconfigured",
      `not configured (${result.problems.join(", ")}); the provider is switched off ` +
        `and will contribute no offers`,
    );
    return [];
  }

  const params = new URLSearchParams({
    home: query.homeTeam,
    away: query.awayTeam,
  });
  if (query.date) params.set("date", query.date);

  const body = await getJson(`/events?${params.toString()}`, result.config);
  return extractEvents(body);
}

/**
 * Pulls an event array out of whatever came back.
 *
 * Accepts a bare array or a common `{ data: [...] }` / `{ events: [...] }`
 * envelope, and returns `[]` for anything else — a provider that changes
 * its envelope should cost Seatigo its offers, not its fixture pages.
 *
 * TODO(ftn-api): once the real envelope is known, narrow this to it.
 */
export function extractEvents(body: unknown): FtnEvent[] {
  if (Array.isArray(body)) return body as FtnEvent[];
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    for (const key of ["data", "events", "results"]) {
      if (Array.isArray(record[key])) return record[key] as FtnEvent[];
    }
  }
  return [];
}

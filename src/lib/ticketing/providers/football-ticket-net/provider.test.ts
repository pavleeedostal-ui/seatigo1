import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import type { Match } from "@/types/football";
import { clubs, competitions, stadiums } from "@/lib/football/referenceData";
import { footballTicketNetMeta, footballTicketNetProvider } from "./provider";
import { resetWarnings } from "./client";

const fixture: Match = {
  id: "pl-2026-27-arsenal-v-chelsea",
  externalFixtureId: "pl-2026-27-arsenal-v-chelsea",
  slug: "arsenal-vs-chelsea",
  competition: competitions.premier_league,
  homeTeam: clubs.arsenal,
  awayTeam: clubs.chelsea,
  stadium: stadiums.emirates,
  city: "London",
  country: "England",
  date: "2027-02-20",
  kickoffTime: "2027-02-20T15:00:00Z",
  season: "2026/27",
  matchweek: 26,
  status: "scheduled",
  lastSyncedAt: "2026-10-10T00:00:00Z",
};

const CREDENTIALS = {
  FOOTBALL_TICKET_NET_API_KEY: "key-123",
  FOOTBALL_TICKET_NET_AFFILIATE_ID: "aff-456",
  FOOTBALL_TICKET_NET_API_BASE_URL: "https://api.footballticketnet.example/v1",
};

function withCredentials() {
  Object.assign(process.env, CREDENTIALS);
}

function withoutCredentials() {
  for (const key of Object.keys(CREDENTIALS)) delete process.env[key];
}

afterEach(() => {
  withoutCredentials();
  resetWarnings();
});

describe("provider metadata", () => {
  test("declares itself a secondary marketplace", () => {
    assert.equal(footballTicketNetMeta.id, "football-ticket-net");
    assert.equal(footballTicketNetMeta.name, "Football Ticket Net");
    assert.equal(footballTicketNetMeta.marketType, "secondary");
  });
});

describe("without credentials", () => {
  test("reports itself disabled", () => {
    withoutCredentials();
    assert.equal(footballTicketNetProvider.isEnabled?.(), false);
  });

  test("returns no offers and contacts nobody", async () => {
    withoutCredentials();
    const originalFetch = globalThis.fetch;
    let called = false;
    globalThis.fetch = (async () => {
      called = true;
      throw new Error("must not be contacted");
    }) as typeof fetch;

    try {
      assert.deepEqual(await footballTicketNetProvider.searchOffers(fixture), []);
      assert.equal(called, false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("refuses to decorate an outbound URL", () => {
    withoutCredentials();
    assert.equal(
      footballTicketNetProvider.decorateOutboundUrl?.("https://x.example/l"),
      null,
    );
  });

  test("never produces a demo price", async () => {
    withoutCredentials();
    const offers = await footballTicketNetProvider.searchOffers(fixture);
    assert.equal(
      offers.length,
      0,
      "a named real marketplace must never be shown with invented prices",
    );
  });
});

describe("with credentials", () => {
  test("reports itself enabled", () => {
    withCredentials();
    assert.equal(footballTicketNetProvider.isEnabled?.(), true);
  });

  test("decorates an outbound URL with the affiliate id", () => {
    withCredentials();
    const url = footballTicketNetProvider.decorateOutboundUrl?.(
      "https://www.footballticketnet.com/l/1",
    );
    assert.ok(url);
    assert.ok(new URL(url).searchParams.get("aff") === "aff-456");
  });

  test("maps a matching event's listings into offers", async () => {
    withCredentials();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          data: [
            {
              id: "evt-1",
              homeTeam: "Arsenal FC",
              awayTeam: "Chelsea",
              date: "2027-02-20T15:00:00Z",
              competition: "Premier League",
              listings: [
                {
                  id: "L1",
                  category: "Longside",
                  price: 149,
                  currency: "EUR",
                  quantity: 2,
                  url: "https://www.footballticketnet.com/l/L1",
                },
              ],
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )) as typeof fetch;

    try {
      const offers = await footballTicketNetProvider.searchOffers(fixture);
      assert.equal(offers.length, 1);
      assert.equal(offers[0].providerId, "football-ticket-net");
      assert.equal(offers[0].fixtureId, fixture.id);
      assert.equal(offers[0].price, 149);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("returns nothing when the provider's events are a different fixture", async () => {
    withCredentials();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify([
          {
            id: "evt-2",
            homeTeam: "Real Madrid",
            awayTeam: "Barcelona",
            date: "2027-02-20",
            listings: [
              {
                id: "L9",
                category: "Longside",
                price: 500,
                currency: "EUR",
                url: "https://www.footballticketnet.com/l/L9",
              },
            ],
          },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )) as typeof fetch;

    try {
      const offers = await footballTicketNetProvider.searchOffers(fixture);
      assert.deepEqual(
        offers,
        [],
        "an unmatched provider event must never attach offers to our fixture",
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("survives an error response, a timeout and unparseable JSON", async () => {
    withCredentials();
    const originalFetch = globalThis.fetch;

    const cases: (() => Promise<Response>)[] = [
      async () => new Response("nope", { status: 500 }),
      async () => {
        throw new Error("network down");
      },
      async () =>
        new Response("<html>not json</html>", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    ];

    try {
      for (const impl of cases) {
        globalThis.fetch = impl as typeof fetch;
        assert.deepEqual(await footballTicketNetProvider.searchOffers(fixture), []);
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("getOfferDetails returns null until the endpoint is documented", async () => {
    withCredentials();
    assert.equal(await footballTicketNetProvider.getOfferDetails("L1"), null);
  });
});

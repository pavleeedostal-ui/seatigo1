import { test, describe } from "node:test";
import assert from "node:assert/strict";
import type { Match } from "@/types/football";
import { clubs, competitions, stadiums } from "@/lib/football/referenceData";
import {
  eventId,
  mapSeatCategory,
  matchesFixture,
  parseEventDate,
  resolveTeamSlug,
  selectEventForFixture,
  toTicketOffer,
  toTicketOffers,
} from "./mapper";
import type { FtnEvent } from "./types";

/**
 * A real fixture from the reference data, so these tests exercise the same
 * club records, aliases and venue names production uses.
 */
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

const validEvent: FtnEvent = {
  id: "ftn-evt-1",
  homeTeam: "Arsenal FC",
  awayTeam: "Chelsea",
  date: "2027-02-20T15:00:00Z",
  competition: "Premier League",
  venue: "Emirates Stadium",
  city: "London",
  listings: [
    {
      id: "L1",
      category: "Longside Lower",
      section: "West Stand",
      price: 149,
      currency: "eur",
      quantity: 3,
      url: "https://www.footballticketnet.com/listing/L1",
      updatedAt: "2026-10-10T09:00:00Z",
    },
  ],
};

describe("team resolution", () => {
  test("resolves a club by its registered alias", () => {
    assert.equal(resolveTeamSlug("Man Utd"), "manchester-united");
    assert.equal(resolveTeamSlug("PSG"), "paris-saint-germain");
    assert.equal(resolveTeamSlug("Spurs"), "tottenham-hotspur");
  });

  test("is diacritic- and case-insensitive", () => {
    assert.equal(resolveTeamSlug("BAYERN MUNCHEN"), "bayern-munich");
    assert.equal(resolveTeamSlug("Fenerbahçe"), "fenerbahce");
  });

  test("refuses an unknown name rather than guessing", () => {
    assert.equal(resolveTeamSlug("Some Other FC"), null);
    assert.equal(resolveTeamSlug(""), null);
    assert.equal(resolveTeamSlug(undefined), null);
    assert.equal(resolveTeamSlug(42), null);
  });

  test("does not match a club on a shared substring", () => {
    // "Manchester" alone must not silently pick one of the two.
    assert.equal(resolveTeamSlug("Manchester"), null);
  });
});

describe("event date parsing", () => {
  test("accepts a bare ISO date and an ISO instant", () => {
    assert.equal(parseEventDate("2027-02-20"), "2027-02-20");
    assert.equal(parseEventDate("2027-02-20T20:45:00Z"), "2027-02-20");
  });

  test("rejects anything it cannot read", () => {
    assert.equal(parseEventDate("next Saturday"), null);
    assert.equal(parseEventDate(""), null);
    assert.equal(parseEventDate(null), null);
    assert.equal(parseEventDate(1740000000), null);
  });
});

describe("fixture matching", () => {
  test("matches the right event", () => {
    assert.deepEqual(matchesFixture(validEvent, fixture), { matched: true });
  });

  test("matches when only the teams and date are given", () => {
    const sparse: FtnEvent = {
      id: "e",
      homeTeam: "Arsenal",
      awayTeam: "Chelsea FC",
      date: "2027-02-20",
    };
    assert.equal(matchesFixture(sparse, fixture).matched, true);
  });

  test("rejects a reversed pairing — that is the other leg", () => {
    const reversed = { ...validEvent, homeTeam: "Chelsea", awayTeam: "Arsenal FC" };
    assert.deepEqual(matchesFixture(reversed, fixture), {
      matched: false,
      reason: "teams-do-not-match",
    });
  });

  test("rejects a different opponent", () => {
    const other = { ...validEvent, awayTeam: "Liverpool" };
    assert.equal(matchesFixture(other, fixture).reason, "teams-do-not-match");
  });

  test("rejects an unresolvable team name", () => {
    assert.equal(
      matchesFixture({ ...validEvent, homeTeam: "Mystery FC" }, fixture).reason,
      "home-team-unresolved",
    );
  });

  test("tolerates a one-day timezone rollover but no more", () => {
    assert.equal(matchesFixture({ ...validEvent, date: "2027-02-21" }, fixture).matched, true);
    assert.equal(matchesFixture({ ...validEvent, date: "2027-02-19" }, fixture).matched, true);
    assert.equal(
      matchesFixture({ ...validEvent, date: "2027-02-23" }, fixture).reason,
      "date-too-far",
    );
  });

  test("rejects when either side has no usable date", () => {
    assert.equal(matchesFixture({ ...validEvent, date: undefined }, fixture).reason, "date-missing");
    assert.equal(
      matchesFixture(validEvent, { ...fixture, date: null }).reason,
      "date-missing",
    );
  });

  test("a contradicting competition vetoes an otherwise good match", () => {
    assert.equal(
      matchesFixture({ ...validEvent, competition: "FA Cup" }, fixture).reason,
      "competition-mismatch",
    );
  });

  test("a competition named differently but relatedly is accepted", () => {
    assert.equal(
      matchesFixture({ ...validEvent, competition: "English Premier League" }, fixture).matched,
      true,
    );
  });

  test("a wrong venue alone does not veto, a wrong venue and city together do", () => {
    assert.equal(
      matchesFixture({ ...validEvent, venue: "Arsenal Stadium" }, fixture).matched,
      true,
      "a sponsor-free venue name must not cost the fixture its offers",
    );
    assert.equal(
      matchesFixture({ ...validEvent, venue: "Camp Nou", city: "Barcelona" }, fixture).reason,
      "location-mismatch",
    );
  });

  test("picks the matching event out of a list and ignores the rest", () => {
    const events: FtnEvent[] = [
      { id: "a", homeTeam: "Chelsea", awayTeam: "Arsenal", date: "2027-02-20" },
      { id: "b", homeTeam: "Arsenal", awayTeam: "Liverpool", date: "2027-02-20" },
      validEvent,
    ];
    assert.equal(eventId(selectEventForFixture(events, fixture)!), "ftn-evt-1");
  });

  test("returns null when nothing matches — never a fixture of its own", () => {
    const events: FtnEvent[] = [
      { id: "a", homeTeam: "Real Madrid", awayTeam: "Barcelona", date: "2027-02-20" },
    ];
    assert.equal(selectEventForFixture(events, fixture), null);
  });
});

describe("seat category mapping", () => {
  test("maps known vocabulary", () => {
    assert.equal(mapSeatCategory("VIP Hospitality"), "hospitality");
    assert.equal(mapSeatCategory("Premium Club"), "premium");
    assert.equal(mapSeatCategory("Longside Lower"), "longside");
    assert.equal(mapSeatCategory("Corner"), "shortside");
    assert.equal(mapSeatCategory("Behind Goal"), "behind_goal");
  });

  test("returns null rather than guessing at an unknown category", () => {
    assert.equal(mapSeatCategory("Zone 7"), null);
    assert.equal(mapSeatCategory(undefined), null);
    assert.equal(mapSeatCategory(123), null);
  });
});

describe("offer normalization", () => {
  const context = { fixture, externalEventId: "ftn-evt-1" };

  test("normalizes a complete listing", () => {
    const offer = toTicketOffer(
      {
        id: "L1",
        category: "Longside Lower",
        section: "West Stand",
        price: 149,
        currency: "eur",
        quantity: 3,
        url: "https://www.footballticketnet.com/listing/L1",
        updatedAt: "2026-10-10T09:00:00Z",
      },
      context,
    );

    assert.ok(offer);
    assert.equal(offer.providerId, "football-ticket-net");
    assert.equal(offer.id, "football-ticket-net__L1");
    assert.equal(offer.fixtureId, fixture.id);
    assert.equal(offer.externalOfferId, "L1");
    assert.equal(offer.price, 149);
    assert.equal(offer.currency, "EUR", "currency is upper-cased to ISO 4217");
    assert.equal(offer.category, "longside");
    assert.equal(offer.quantityAvailable, 3);
    assert.equal(offer.deeplink, "https://www.footballticketnet.com/listing/L1");
    assert.equal(offer.feesIncluded, false);
    assert.equal(offer.lastUpdated, "2026-10-10T09:00:00.000Z");
  });

  test("rejects a listing that is missing or has a nonsense price", () => {
    const base = {
      category: "Longside",
      currency: "EUR",
      url: "https://www.footballticketnet.com/l",
    };
    for (const price of [undefined, null, 0, -20, "free", Number.NaN, Infinity]) {
      assert.equal(toTicketOffer({ ...base, price }, context), null, `price=${String(price)}`);
    }
  });

  test("rejects a listing with no usable currency", () => {
    const base = { category: "Longside", price: 100, url: "https://x.example/l" };
    for (const currency of [undefined, "", "euros", "€", 978]) {
      assert.equal(
        toTicketOffer({ ...base, currency }, context),
        null,
        `currency=${String(currency)}`,
      );
    }
  });

  test("refuses a destination that is not https", () => {
    const base = { category: "Longside", price: 100, currency: "EUR" };
    for (const url of [
      "http://www.footballticketnet.com/l",
      "javascript:alert(1)",
      "/relative",
      "",
      undefined,
    ]) {
      assert.equal(toTicketOffer({ ...base, url }, context), null, `url=${String(url)}`);
    }
  });

  test("drops a listing whose category cannot be mapped", () => {
    const offer = toTicketOffer(
      { category: "Zone 7", price: 100, currency: "EUR", url: "https://x.example/l" },
      context,
    );
    assert.equal(offer, null, "an unmapped category must not be filed under a guess");
  });

  test("derives a stable id when the provider gives no listing id", () => {
    const listing = {
      category: "Premium",
      price: 220,
      currency: "EUR",
      url: "https://x.example/l",
    };
    const first = toTicketOffer(listing, context);
    const second = toTicketOffer(listing, context);
    assert.ok(first && second);
    assert.equal(first.externalOfferId, second.externalOfferId);
    assert.equal(first.id, second.id);
  });

  test("defaults an absent quantity to one rather than zero", () => {
    const offer = toTicketOffer(
      { category: "Premium", price: 220, currency: "EUR", url: "https://x.example/l" },
      context,
    );
    assert.equal(offer?.quantityAvailable, 1);
  });
});

describe("malformed provider data", () => {
  test("survives listings that are not objects", () => {
    const context = { fixture, externalEventId: "e" };
    for (const junk of [null, undefined, 42, "listing", []]) {
      assert.equal(
        toTicketOffer(junk as never, context),
        null,
        `listing=${JSON.stringify(junk)}`,
      );
    }
  });

  test("an event with no listings array yields no offers", () => {
    for (const listings of [undefined, null, "many", {}]) {
      assert.deepEqual(toTicketOffers({ id: "e", listings } as FtnEvent, fixture), []);
    }
  });

  test("an event with no id yields no offers", () => {
    assert.deepEqual(toTicketOffers({ ...validEvent, id: undefined }, fixture), []);
  });

  test("good listings survive alongside broken ones", () => {
    const offers = toTicketOffers(
      {
        ...validEvent,
        listings: [
          null,
          { price: 10 },
          { category: "Premium", price: 200, currency: "EUR", url: "https://x.example/a" },
          { category: "Zone 7", price: 50, currency: "EUR", url: "https://x.example/b" },
        ],
      },
      fixture,
    );
    assert.equal(offers.length, 1);
    assert.equal(offers[0].price, 200);
  });
});

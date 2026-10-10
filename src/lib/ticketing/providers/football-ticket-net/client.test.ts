import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  AFFILIATE_QUERY_PARAM,
  buildAffiliateUrl,
  extractEvents,
  isConfigured,
  readConfig,
  searchEvents,
} from "./client";

const complete = {
  FOOTBALL_TICKET_NET_API_KEY: "key-123",
  FOOTBALL_TICKET_NET_AFFILIATE_ID: "aff-456",
  FOOTBALL_TICKET_NET_API_BASE_URL: "https://api.footballticketnet.example/v1",
};

describe("configuration validation", () => {
  test("accepts a complete configuration and trims the base URL", () => {
    const result = readConfig({
      ...complete,
      FOOTBALL_TICKET_NET_API_BASE_URL: "https://api.footballticketnet.example/v1///",
    });
    assert.equal(result.ok, true);
    assert.ok(result.ok);
    assert.equal(result.config.baseUrl, "https://api.footballticketnet.example/v1");
    assert.equal(result.config.apiKey, "key-123");
    assert.equal(result.config.affiliateId, "aff-456");
  });

  test("reports every missing variable at once", () => {
    const result = readConfig({});
    assert.equal(result.ok, false);
    assert.ok(!result.ok);
    assert.deepEqual(result.problems.sort(), [
      "missing-affiliate-id",
      "missing-api-key",
      "missing-base-url",
    ]);
  });

  test("treats whitespace-only values as missing", () => {
    const result = readConfig({
      FOOTBALL_TICKET_NET_API_KEY: "   ",
      FOOTBALL_TICKET_NET_AFFILIATE_ID: "\t",
      FOOTBALL_TICKET_NET_API_BASE_URL: " ",
    });
    assert.ok(!result.ok);
    assert.equal(result.problems.length, 3);
  });

  test("refuses a base URL that is not https — credentials travel on it", () => {
    const result = readConfig({
      ...complete,
      FOOTBALL_TICKET_NET_API_BASE_URL: "http://api.footballticketnet.example/v1",
    });
    assert.ok(!result.ok);
    assert.ok(result.problems.includes("base-url-not-https"));
  });

  test("refuses a base URL that is not a URL", () => {
    const result = readConfig({
      ...complete,
      FOOTBALL_TICKET_NET_API_BASE_URL: "api.footballticketnet.example",
    });
    assert.ok(!result.ok);
    assert.ok(result.problems.includes("base-url-not-a-url"));
  });

  test("isConfigured mirrors the validation result", () => {
    assert.equal(isConfigured(complete), true);
    assert.equal(isConfigured({}), false);
  });
});

describe("missing credentials", () => {
  test("searchEvents returns no events and makes no request", async () => {
    const originalFetch = globalThis.fetch;
    let called = false;
    globalThis.fetch = (async () => {
      called = true;
      throw new Error("the provider must not be contacted without credentials");
    }) as typeof fetch;

    try {
      const events = await searchEvents(
        { homeTeam: "Arsenal", awayTeam: "Chelsea", date: "2027-02-20" },
        {},
      );
      assert.deepEqual(events, []);
      assert.equal(called, false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("outbound redirect safety", () => {
  test("attaches the affiliate id to an https deeplink", () => {
    const url = buildAffiliateUrl("https://www.footballticketnet.com/l/1", "aff-456");
    assert.ok(url);
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get(AFFILIATE_QUERY_PARAM), "aff-456");
    assert.equal(parsed.origin + parsed.pathname, "https://www.footballticketnet.com/l/1");
  });

  test("preserves the seller's own query parameters", () => {
    const url = buildAffiliateUrl(
      "https://www.footballticketnet.com/l/1?qty=2&cur=EUR",
      "aff-456",
    );
    const parsed = new URL(url!);
    assert.equal(parsed.searchParams.get("qty"), "2");
    assert.equal(parsed.searchParams.get("cur"), "EUR");
    assert.equal(parsed.searchParams.get(AFFILIATE_QUERY_PARAM), "aff-456");
  });

  test("overwrites rather than duplicates an existing affiliate parameter", () => {
    const url = buildAffiliateUrl(
      `https://www.footballticketnet.com/l/1?${AFFILIATE_QUERY_PARAM}=stale`,
      "aff-456",
    );
    const parsed = new URL(url!);
    assert.deepEqual(parsed.searchParams.getAll(AFFILIATE_QUERY_PARAM), ["aff-456"]);
  });

  test("refuses a destination that would downgrade or escape https", () => {
    for (const bad of [
      "http://www.footballticketnet.com/l/1",
      "javascript:alert(document.cookie)",
      "data:text/html,<script>1</script>",
      "//evil.example/l",
      "/relative/path",
      "",
      "not a url",
    ]) {
      assert.equal(buildAffiliateUrl(bad, "aff-456"), null, `deeplink=${bad}`);
    }
  });

  test("never writes the API key into an outbound URL", () => {
    const url = buildAffiliateUrl("https://www.footballticketnet.com/l/1", "aff-456");
    assert.ok(url);
    assert.ok(!url.includes("key-123"));
    assert.ok(!url.toLowerCase().includes("apikey"));
  });
});

describe("response envelope handling", () => {
  test("accepts a bare array or a common envelope", () => {
    assert.equal(extractEvents([{ id: "a" }]).length, 1);
    assert.equal(extractEvents({ data: [{ id: "a" }] }).length, 1);
    assert.equal(extractEvents({ events: [{ id: "a" }] }).length, 1);
    assert.equal(extractEvents({ results: [{ id: "a" }] }).length, 1);
  });

  test("returns nothing for a shape it does not recognise", () => {
    for (const junk of [null, undefined, 42, "events", {}, { data: "nope" }]) {
      assert.deepEqual(extractEvents(junk), [], `body=${JSON.stringify(junk)}`);
    }
  });
});

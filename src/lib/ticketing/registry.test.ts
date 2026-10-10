import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { describeProviders, getActiveProviders, isDemoMode } from "./registry";

const CREDENTIALS = {
  FOOTBALL_TICKET_NET_API_KEY: "key-123",
  FOOTBALL_TICKET_NET_AFFILIATE_ID: "aff-456",
  FOOTBALL_TICKET_NET_API_BASE_URL: "https://api.footballticketnet.example/v1",
};

afterEach(() => {
  delete process.env.TICKETING_MODE;
  for (const key of Object.keys(CREDENTIALS)) delete process.env[key];
});

describe("demo mode", () => {
  test("is the default and runs only the demo adapters", () => {
    delete process.env.TICKETING_MODE;
    assert.equal(isDemoMode(), true);

    const ids = getActiveProviders().map((entry) => entry.meta.id);
    assert.ok(ids.length > 0, "demo mode must have sellers to show");
    assert.ok(
      !ids.includes("football-ticket-net"),
      "a real marketplace must never appear in a list of generated prices",
    );
  });

  test("stays demo-only even when real credentials are present", () => {
    delete process.env.TICKETING_MODE;
    Object.assign(process.env, CREDENTIALS);

    const ids = getActiveProviders().map((entry) => entry.meta.id);
    assert.ok(!ids.includes("football-ticket-net"));
  });
});

describe("live mode", () => {
  test("runs no demo adapters", () => {
    process.env.TICKETING_MODE = "live";
    const ids = getActiveProviders().map((entry) => entry.meta.id);
    for (const demoId of ["demo", "provider-a", "provider-b", "provider-c"]) {
      assert.ok(!ids.includes(demoId), `${demoId} must not run in live mode`);
    }
  });

  test("without credentials there are no sellers at all", () => {
    process.env.TICKETING_MODE = "live";
    assert.deepEqual(
      getActiveProviders().map((e) => e.meta.id),
      [],
      "an unconfigured live deployment shows no offers, not invented ones",
    );
  });

  test("with credentials Football Ticket Net becomes active", () => {
    process.env.TICKETING_MODE = "live";
    Object.assign(process.env, CREDENTIALS);
    assert.deepEqual(
      getActiveProviders().map((e) => e.meta.id),
      ["football-ticket-net"],
    );
  });
});

describe("diagnostics", () => {
  test("describeProviders reports kind and enablement without calling anyone", () => {
    const rows = describeProviders();
    const ftn = rows.find((r) => r.id === "football-ticket-net");
    assert.ok(ftn);
    assert.equal(ftn.kind, "live");
    assert.equal(ftn.enabled, false, "disabled until credentials exist");
    assert.ok(rows.some((r) => r.kind === "demo"));
  });
});

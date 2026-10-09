import { FootballDataOrgProvider } from "./footballDataProvider";
import { MockFootballDataProvider } from "./mockProvider";
import type { FootballDataProvider } from "./types";

let provider: FootballDataProvider | null = null;

export function getFootballDataProvider(): FootballDataProvider {
  if (provider) return provider;

  provider =
    process.env.FOOTBALL_DATA_PROVIDER === "football-data"
      ? new FootballDataOrgProvider()
      : new MockFootballDataProvider();

  return provider;
}

export type {
  FootballDataProvider,
  MatchDateRange,
  MatchFilters,
  MatchListResult,
} from "./types";

import { NextResponse, type NextRequest } from "next/server";
import { getSearchSuggestions } from "@/lib/search/suggestions";

/**
 * Autocomplete for the one search box.
 *
 * Served from the fixture database already in memory, so this is a filter
 * over a few hundred records rather than a search backend. Nothing about
 * the caller is read or stored — the query is used and discarded.
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const suggestions = await getSearchSuggestions(query.slice(0, 64));

  return NextResponse.json(
    { suggestions },
    {
      headers: {
        // Same query, same answer until the fixture database changes.
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    },
  );
}

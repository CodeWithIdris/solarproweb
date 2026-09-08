import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { SolarLocationInsights } from "@/components/SolarLocationInsights";
import { getSolarLocationInsight, searchSolarLocations } from "@/api/solar/server-functions";
import { DEMO_SITES } from "@/services/solar-data/site-catalogue";
import type { SolarLocationInsight } from "@/services/solar-data/insight-types";
import type { GeoLocation, ResolvedPlace } from "@/services/solar-data/types";

const GlobalSolarMap = lazy(() => import("@/components/GlobalSolarMap"));
const MapLegend = lazy(() =>
  import("@/components/GlobalSolarMap").then((module) => ({ default: module.MapLegend })),
);

export const Route = createFileRoute("/explore")({
  component: Explore,
  head: () => ({
    meta: [
      { title: "Explore solar resource data worldwide — Solar Pro" },
      {
        name: "description",
        content:
          "Search any location worldwide and retrieve modelled solar resource and environmental data with clear provider provenance. Availability varies by provider and location.",
      },
      { property: "og:title", content: "Explore solar resource data worldwide — Solar Pro" },
      {
        property: "og:description",
        content:
          "Search any location worldwide and retrieve modelled solar resource and environmental data with clear provider provenance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/explore" }],
  }),
});

type ViewMode = "map" | "split" | "table";

function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

function Explore() {
  const hydrated = useHydrated();
  const [view, setView] = useState<ViewMode>("split");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResolvedPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [place, setPlace] = useState<ResolvedPlace | undefined>();
  const [insight, setInsight] = useState<SolarLocationInsight | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setSearching(true);
      setSearchError("");
      void searchSolarLocations({ data: { query } })
        .then((response) => {
          setResults(response.results);
          if (response.error) setSearchError("Location search is unavailable at the moment.");
        })
        .catch(() => setSearchError("Location search is unavailable at the moment."))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const loadInsight = useCallback((next: ResolvedPlace) => {
    const id = ++requestId.current;
    setPlace(next);
    setInsight(undefined);
    setError("");
    setLoading(true);
    void getSolarLocationInsight({
      data: { place: next, datasets: ["resource", "environment"] },
    })
      .then((result) => {
        if (id === requestId.current) setInsight(result as SolarLocationInsight);
      })
      .catch(() => {
        if (id === requestId.current) setError("Solar data could not be retrieved at this time.");
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
  }, []);

  const selectCoordinates = useCallback(
    (location: GeoLocation) => {
      loadInsight({
        name: `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
        latitude: location.latitude,
        longitude: location.longitude,
      });
    },
    [loadInsight],
  );

  const selected: GeoLocation | undefined = place
    ? { latitude: place.latitude, longitude: place.longitude }
    : undefined;

  const mapBlock = (
    <div>
      {hydrated ? (
        <Suspense
          fallback={
            <div className="flex h-[420px] items-center justify-center border border-border bg-card text-sm text-muted-foreground">
              Loading map…
            </div>
          }
        >
          <GlobalSolarMap
            markers={DEMO_SITES}
            selected={selected}
            onSelect={selectCoordinates}
            zoom={9}
          />
          <div className="mt-3">
            <MapLegend />
          </div>
        </Suspense>
      ) : (
        <div className="flex h-[420px] items-center justify-center border border-border bg-card text-sm text-muted-foreground">
          Loading map…
        </div>
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="font-mono text-sm font-semibold tracking-wide">
            SOLAR PRO
          </Link>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">
              Home
            </Link>
            <Link to="/dashboard" className="hover:text-foreground">
              Workspace
            </Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <p className="label-technical">Explore solar</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Explore solar resource information for locations around the world.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Search a city, region or coordinates, or select a point on the map. Solar Pro retrieves
            modelled solar resource and satellite/reanalysis environmental data from external
            providers. Data availability varies by provider and location, and live telemetry
            requires a connected monitoring provider or system.
          </p>

          <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-start">
            <div>
              <label htmlFor="location-search" className="label-technical">
                Search location
              </label>
              <input
                id="location-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Lagos, Nigeria · London · 40.7128, -74.0060"
                className="mt-2 w-full rounded-sm border border-border bg-card px-3 py-2 text-sm outline-none focus:border-foreground"
                autoComplete="off"
              />
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                {searching
                  ? "Searching…"
                  : searchError
                    ? searchError
                    : results.length > 0
                      ? `${results.length} matched location${results.length === 1 ? "" : "s"}`
                      : "Cities, regions, countries or latitude, longitude"}
              </p>
              {results.length > 0 && (
                <ul className="mt-3 divide-y divide-border border border-border bg-card">
                  {results.map((result) => (
                    <li key={`${result.latitude},${result.longitude},${result.name}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setResults([]);
                          setQuery(result.name);
                          loadInsight(result);
                        }}
                        className="flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted"
                      >
                        <span>
                          {result.name}
                          <span className="block text-xs text-muted-foreground">
                            {[result.region, result.country].filter(Boolean).join(", ") ||
                              "Coordinates"}
                          </span>
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {result.latitude.toFixed(3)}, {result.longitude.toFixed(3)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {(["map", "split", "table"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setView(mode)}
                  aria-pressed={view === mode}
                  className={`rounded-sm border px-3 py-1.5 text-sm ${
                    view === mode
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  {mode === "map" ? "Map view" : mode === "split" ? "Split view" : "Table view"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        {view === "map" && (
          <div className="grid gap-6">
            {mapBlock}
            <SolarLocationInsights insight={insight} loading={loading} error={error || undefined} />
          </div>
        )}
        {view === "split" && (
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-start">
            {mapBlock}
            <SolarLocationInsights insight={insight} loading={loading} error={error || undefined} />
          </div>
        )}
        {view === "table" && (
          <div className="grid gap-6">
            <div className="overflow-x-auto border border-border bg-card">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="label-technical px-4 py-2.5">Site</th>
                    <th className="label-technical px-4 py-2.5">Country</th>
                    <th className="label-technical px-4 py-2.5">Region</th>
                    <th className="label-technical px-4 py-2.5 text-right">Capacity (MWp)</th>
                    <th className="label-technical px-4 py-2.5">Coordinates</th>
                    <th className="label-technical px-4 py-2.5">Telemetry</th>
                    <th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {DEMO_SITES.map((site) => (
                    <tr key={site.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <span className="block font-medium">{site.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {site.id} · Demo site
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{site.country}</td>
                      <td className="px-4 py-3 text-muted-foreground">{site.region}</td>
                      <td className="px-4 py-3 text-right font-mono text-[13px]">
                        {site.installedCapacityMwp?.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                      </td>
                      <td className="px-4 py-3 text-xs">Not connected</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            loadInsight({
                              name: site.name,
                              latitude: site.latitude,
                              longitude: site.longitude,
                              ...(site.country ? { country: site.country } : {}),
                              ...(site.region ? { region: site.region } : {}),
                            })
                          }
                          className="text-sm underline underline-offset-4"
                        >
                          Retrieve data
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <SolarLocationInsights insight={insight} loading={loading} error={error || undefined} />
          </div>
        )}
      </section>
    </main>
  );
}

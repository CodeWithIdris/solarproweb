import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { reverseGeocode, searchLocations } from "@/api/geocoding/server-functions";
import { getMultiProviderSolarResource } from "@/api/solar/server-functions";
import { GlobalSolarMap, type MapMarker } from "@/components/GlobalSolarMap";
import { SolarLocationInsights } from "@/components/SolarLocationInsights";
import { saveLocation } from "@/lib/saved-location-store";
import { coordinatesFromQuery, type GeocodedLocation } from "@/services/geocoding";
import type { MultiProviderSolarResource } from "@/services/solar-data/types";

export const Route = createFileRoute("/explore")({ component: ExploreSolar });

const demoSites: MapMarker[] = [
  [
    "NG-KD-01",
    "Kaduna North",
    "Nigeria",
    10.52,
    7.44,
    "12.4 MWp · Demo Site · No connected telemetry",
  ],
  [
    "NG-KD-02",
    "Kaduna South",
    "Nigeria",
    10.48,
    7.4,
    "9.8 MWp · Demo Site · No connected telemetry",
  ],
  [
    "NG-NS-01",
    "Nasarawa East",
    "Nigeria",
    8.54,
    8.16,
    "20.0 MWp · Demo Site · No connected telemetry",
  ],
  ["NG-KN-01", "Kano River", "Nigeria", 12, 8.52, "7.5 MWp · Demo Site · No connected telemetry"],
  [
    "GH-AS-01",
    "Ashanti Ridge",
    "Ghana",
    6.69,
    -1.62,
    "15.2 MWp · Demo Site · No connected telemetry",
  ],
].map(([id, label, country, latitude, longitude, description]) => ({
  id: String(id),
  label: `${label}, ${country}`,
  latitude: Number(latitude),
  longitude: Number(longitude),
  description: String(description),
  kind: "demo" as const,
}));

function ExploreSolar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodedLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const [location, setLocation] = useState<GeocodedLocation | null>(null);
  const [resource, setResource] = useState<MultiProviderSolarResource | null>(null);
  const [view, setView] = useState<"map" | "table" | "split">("split");
  const [markerFilter, setMarkerFilter] = useState<"all" | "demo" | "selected">("all");
  const [saveMessage, setSaveMessage] = useState("");
  const [loadingResource, setLoadingResource] = useState(false);
  const [resourceError, setResourceError] = useState("");
  const requestRef = useRef(0);

  useEffect(() => {
    const coordinates = coordinatesFromQuery(query);
    if (coordinates) {
      setResults([
        {
          ...coordinates,
          label: `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`,
        },
      ]);
      return;
    }
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const request = ++requestRef.current;
    const timeout = window.setTimeout(() => {
      setSearching(true);
      void searchLocations({ data: { query } })
        .then((next) => {
          if (request === requestRef.current) setResults(next);
        })
        .catch(() => {
          if (request === requestRef.current) setResults([]);
        })
        .finally(() => {
          if (request === requestRef.current) setSearching(false);
        });
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const selectLocation = useCallback((next: GeocodedLocation) => {
    const request = ++requestRef.current;
    setLocation(next);
    setResults([]);
    setResource(null);
    setResourceError("");
    setLoadingResource(true);
    void getMultiProviderSolarResource({ data: { location: next } })
      .then((data) => {
        if (request === requestRef.current) setResource(data);
      })
      .catch(() => {
        if (request === requestRef.current)
          setResourceError(
            "Solar resource data is temporarily unavailable. No sample data has been substituted.",
          );
      })
      .finally(() => {
        if (request === requestRef.current) setLoadingResource(false);
      });
  }, []);

  const selectCoordinates = useCallback((coordinates: { latitude: number; longitude: number }) => {
    const request = ++requestRef.current;
    const provisional = {
      ...coordinates,
      label: `${coordinates.latitude.toFixed(4)}°, ${coordinates.longitude.toFixed(4)}°`,
    };
    setLocation(provisional);
    setResource(null);
    setResourceError("");
    setLoadingResource(true);
    void reverseGeocode({ data: coordinates })
      .then((resolved) => {
        if (request === requestRef.current && resolved) setLocation(resolved);
      })
      .catch(() => undefined);
    void getMultiProviderSolarResource({ data: { location: coordinates } })
      .then((data) => {
        if (request === requestRef.current) setResource(data);
      })
      .catch(() => {
        if (request === requestRef.current)
          setResourceError(
            "Solar resource data is temporarily unavailable. No sample data has been substituted.",
          );
      })
      .finally(() => {
        if (request === requestRef.current) setLoadingResource(false);
      });
  }, []);

  const markers = useMemo(
    () => [
      ...demoSites.map((site) => ({ ...site, onClick: () => selectCoordinates(site) })),
      ...(location
        ? [
            {
              id: "selected-location",
              label: location.label,
              latitude: location.latitude,
              longitude: location.longitude,
              kind: "selected" as const,
              description: "Selected Location",
            },
          ]
        : []),
    ],
    [location, selectCoordinates],
  );
  const visibleMarkers = markers.filter(
    (marker) => markerFilter === "all" || marker.kind === markerFilter,
  );
  const createHref = location
    ? `/?location=${encodeURIComponent(location.label)}&lat=${location.latitude}&lon=${location.longitude}${location.country ? `&country=${encodeURIComponent(location.country)}` : ""}${location.region ? `&region=${encodeURIComponent(location.region)}` : ""}`
    : "/";
  const persistLocation = () => {
    if (!location) return;
    setSaveMessage("Saving location…");
    void saveLocation(location, resource).then((result) =>
      setSaveMessage(result.error ? result.error.message : "Location saved."),
    );
  };
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to="/" className="font-mono text-sm font-semibold">
            SOLAR PRO
          </Link>
          <Link to="/" className="text-sm underline underline-offset-4">
            Back to planning
          </Link>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-5 py-8">
        <p className="label-technical">Explore Solar</p>
        <h1 className="mt-2 text-3xl font-semibold">Global Solar Map</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Search worldwide or select a point on the map. Solar resource is requested only after you
          choose a location.
        </p>
        <div className="relative mt-6 max-w-2xl">
          <label className="sr-only" htmlFor="location-search">
            Search a city, country, address, or coordinates
          </label>
          <input
            id="location-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a city, country, address, or 40.7128, -74.0060"
            className="w-full rounded-sm border border-input bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {(searching || results.length > 0) && (
            <div className="absolute z-[1000] mt-1 w-full border border-border bg-card shadow-lg">
              {searching && (
                <p className="px-4 py-3 text-sm text-muted-foreground">
                  Searching real location data…
                </p>
              )}
              {results.map((result) => (
                <button
                  key={`${result.latitude}-${result.longitude}`}
                  onClick={() => selectLocation(result)}
                  className="block w-full border-t border-border px-4 py-3 text-left text-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <span className="block font-medium">{result.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {result.region && `${result.region}, `}
                    {result.country ?? ""} · {result.latitude.toFixed(4)},{" "}
                    {result.longitude.toFixed(4)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-y border-border py-3">
          <div className="flex gap-2" role="group" aria-label="Explore view">
            {(["map", "table", "split"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setView(option)}
                aria-pressed={view === option}
                className={`border px-3 py-1.5 text-xs font-medium uppercase ${view === option ? "border-foreground bg-foreground text-background" : "border-border bg-card"}`}
              >
                {option}
              </button>
            ))}
          </div>
          <label className="text-xs text-muted-foreground">
            Show{" "}
            <select
              value={markerFilter}
              onChange={(event) =>
                setMarkerFilter(event.target.value as "all" | "demo" | "selected")
              }
              className="ml-2 border border-input bg-card px-2 py-1"
            >
              <option value="all">All locations</option>
              <option value="demo">Demo sites</option>
              <option value="selected">Selected locations</option>
            </select>
          </label>
        </div>
        {view === "table" ? (
          <ExploreTable markers={visibleMarkers} onSelect={selectCoordinates} />
        ) : (
          <div
            className={
              view === "map" ? "mt-6" : "mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_360px]"
            }
          >
            <GlobalSolarMap
              markers={visibleMarkers}
              selected={location}
              onSelect={selectCoordinates}
            />
            {view === "split" && (
              <SolarLocationInsights
                location={location}
                resource={resource}
                loading={loadingResource}
                error={resourceError}
                onCreateProject={() => window.location.assign(createHref)}
                onSaveLocation={persistLocation}
              />
            )}
          </div>
        )}
        {view === "map" && (
          <div className="mt-5 max-w-md">
            <SolarLocationInsights
              location={location}
              resource={resource}
              loading={loadingResource}
              error={resourceError}
              onCreateProject={() => window.location.assign(createHref)}
              onSaveLocation={persistLocation}
            />
          </div>
        )}
        {saveMessage && (
          <p className="mt-3 text-sm text-muted-foreground" role="status">
            {saveMessage}
          </p>
        )}
        <section className="mt-6 border border-border bg-card p-4 text-sm">
          <h2 className="font-medium">Map markers</h2>
          <ul className="mt-2 grid gap-1 text-muted-foreground sm:grid-cols-3">
            <li>
              <strong>● Selected Location</strong> — currently investigating
            </li>
            <li>
              <strong>D Demo Site</strong> — example location, not telemetry
            </li>
            <li>
              <strong>C Connected Site</strong> — reserved for authorised connected telemetry
            </li>
          </ul>
        </section>
      </section>
    </main>
  );
}

function ExploreTable({
  markers,
  onSelect,
}: {
  markers: MapMarker[];
  onSelect: (location: { latitude: number; longitude: number }) => void;
}) {
  return (
    <div className="mt-6 overflow-x-auto border border-border bg-card">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="label-technical px-4 py-3">Site / location</th>
            <th className="label-technical px-4 py-3">Type</th>
            <th className="label-technical px-4 py-3">Coordinates</th>
            <th className="label-technical px-4 py-3">Telemetry</th>
            <th />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {markers.map((marker) => (
            <tr key={marker.id}>
              <td className="px-4 py-3 font-medium">
                {marker.label}
                <span className="block text-xs text-muted-foreground">{marker.description}</span>
              </td>
              <td className="px-4 py-3">
                {marker.kind === "demo"
                  ? "Demo Site"
                  : marker.kind === "selected"
                    ? "Selected Location"
                    : marker.kind}
              </td>
              <td className="px-4 py-3 font-mono text-xs">
                {marker.latitude.toFixed(4)}, {marker.longitude.toFixed(4)}
              </td>
              <td className="px-4 py-3">Not connected</td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onSelect(marker)}
                  className="text-sm underline underline-offset-4"
                >
                  View Solar Resource
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

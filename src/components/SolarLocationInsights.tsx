import type { GeocodedLocation } from "@/services/geocoding";
import type { MultiProviderSolarResource } from "@/services/solar-data/types";

export function SolarLocationInsights({
  location,
  resource,
  loading,
  error,
  onCreateProject,
  onSaveLocation,
}: {
  location: GeocodedLocation | null;
  resource: MultiProviderSolarResource | null;
  loading: boolean;
  error: string;
  onCreateProject: () => void;
  onSaveLocation: () => void;
}) {
  return (
    <aside className="border border-border bg-card p-5" aria-live="polite">
      <p className="label-technical">Solar Insights</p>
      {!location ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Search for a location or click the map to explore provider-backed solar resource data.
        </p>
      ) : (
        <>
          <h2 className="mt-2 text-xl font-semibold">{location.label}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {location.region && `${location.region}, `}
            {location.country ?? "Location name unavailable"}
          </p>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°
          </p>
          {loading ? (
            <p className="mt-5 text-sm text-muted-foreground">
              Retrieving provider-backed solar resource data…
            </p>
          ) : error ? (
            <p
              role="alert"
              className="mt-5 border-l-2 border-destructive p-3 text-sm text-muted-foreground"
            >
              {error}
            </p>
          ) : resource ? (
            <>
              {resource.providers.map((result) =>
                result.resource ? (
                  <section key={result.provider} className="mt-5 border-y border-border py-4">
                    <div className="flex justify-between gap-3">
                      <p className="font-medium">{result.resource.source.provider.toUpperCase()}</p>
                      <span className="text-xs text-status-ok">Available</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {result.dataType} · {result.dataset}
                    </p>
                    <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="label-technical">Annual irradiation</dt>
                        <dd className="mt-1 font-mono">
                          {result.resource.annualIrradianceKWhM2.toFixed(0)} kWh/m²/year
                        </dd>
                      </div>
                      <div>
                        <dt className="label-technical">Daily irradiation</dt>
                        <dd className="mt-1 font-mono">
                          {(result.resource.annualIrradianceKWhM2 / 365).toFixed(2)} kWh/m²/day
                        </dd>
                      </div>
                      <div>
                        <dt className="label-technical">Peak sun hours</dt>
                        <dd className="mt-1 font-mono">
                          {result.resource.peakSunHours.toFixed(2)} h/day
                        </dd>
                      </div>
                      <div>
                        <dt className="label-technical">Data type</dt>
                        <dd className="mt-1">{result.dataType}</dd>
                      </div>
                    </dl>
                    <p className="mt-4 text-xs text-muted-foreground">
                      <strong>Dataset:</strong> {result.dataset}
                      <br />
                      Retrieved {new Date(result.resource.source.retrievedAt).toLocaleString()}. Not
                      telemetry or actual generation.
                    </p>
                  </section>
                ) : (
                  <p
                    key={result.provider}
                    className="mt-4 border-l-2 border-muted p-3 text-xs text-muted-foreground"
                  >
                    {result.provider.toUpperCase()}: Unavailable —{" "}
                    {result.message ?? "No provider data"}
                  </p>
                ),
              )}
              <p className="mt-4 text-xs text-muted-foreground">
                Different datasets and modelling methods can produce different estimates. Solar Pro
                displays the source so you can evaluate the assumptions. Connected telemetry: No
                connected telemetry.
              </p>
            </>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">
              No solar resource data is currently available for this location.
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={onCreateProject}
              className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Create Project
            </button>
            <button
              onClick={onSaveLocation}
              className="rounded-sm border border-border px-4 py-2 text-sm font-medium"
            >
              Save Location
            </button>
          </div>
        </>
      )}
      <p className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
        Solar Pro can explore locations worldwide. PVGIS provides modelled solar resource data; NASA
        POWER provides satellite/reanalysis environmental data where configured; connected telemetry
        is shown only to authorised users.
      </p>
    </aside>
  );
}

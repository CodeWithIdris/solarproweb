<<<<<<< HEAD
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
=======
import type { SolarLocationInsight } from "@/services/solar-data/insight-types";
import {
  AVAILABILITY_MESSAGE,
  CLASSIFICATION_LABEL,
  type DataClassification,
} from "@/services/solar-data/classification";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatTimestamp(iso: string) {
  return `${new Date(iso).toUTCString().replace("GMT", "UTC")}`;
}

function Provenance({
  provider,
  classification,
  retrievedAt,
  method,
}: {
  provider: string;
  classification: DataClassification;
  retrievedAt: string;
  method?: string | undefined;
}) {
  return (
    <dl className="mt-3 grid gap-x-8 gap-y-1 border-t border-border pt-3 text-xs sm:grid-cols-3">
      <div>
        <dt className="label-technical">Provider</dt>
        <dd className="mt-1 font-mono text-foreground">{provider}</dd>
      </div>
      <div>
        <dt className="label-technical">Data type</dt>
        <dd className="mt-1 font-mono text-foreground">{CLASSIFICATION_LABEL[classification]}</dd>
      </div>
      <div>
        <dt className="label-technical">Retrieved</dt>
        <dd className="mt-1 font-mono text-muted-foreground">{formatTimestamp(retrievedAt)}</dd>
      </div>
      {method && (
        <div className="sm:col-span-3">
          <dt className="label-technical">Method</dt>
          <dd className="mt-1 text-muted-foreground">{method}</dd>
        </div>
      )}
    </dl>
  );
}

export interface SolarLocationInsightsProps {
  insight?: SolarLocationInsight | undefined;
  loading?: boolean;
  error?: string | undefined;
  onCreateProject?: (() => void) | undefined;
}

/**
 * Renders normalized Solar Pro values for one location. Every figure is shown
 * with its provider, classification and retrieval time. Missing data is shown
 * as missing; nothing is substituted.
 */
export function SolarLocationInsights({
  insight,
  loading,
  error,
  onCreateProject,
}: SolarLocationInsightsProps) {
  if (loading)
    return (
      <p className="border border-border bg-card p-5 text-sm text-muted-foreground">
        {AVAILABILITY_MESSAGE.loading}
      </p>
    );
  if (error)
    return (
      <p role="alert" className="border-l-2 border-solar bg-muted/30 p-5 text-sm">
        {error}
      </p>
    );
  if (!insight)
    return (
      <div className="border border-border bg-card p-5">
        <p className="text-sm font-medium">No location selected</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Search for a place, enter coordinates, or click the map to retrieve solar resource
          information. Data availability varies by provider and location.
        </p>
      </div>
    );

  const { place, resource, environment, performance, telemetry } = insight;
  const noResource = !resource;

  return (
    <div className="border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <p className="label-technical">Location</p>
        <h3 className="mt-1 text-lg font-semibold">{place.name}</h3>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {[place.locality, place.region, place.country].filter(Boolean).join(" · ") ||
            "Region metadata not resolved"}
        </p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
        </p>
      </div>

      <section className="border-b border-border px-5 py-4">
        <p className="label-technical">Solar resource</p>
        {noResource ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {insight.providerLog.some((entry) => entry.outcome === "no_coverage")
              ? AVAILABILITY_MESSAGE.no_coverage
              : AVAILABILITY_MESSAGE.provider_error}
          </p>
        ) : (
          <>
            <dl className="mt-3 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="label-technical">Annual irradiation</dt>
                <dd className="mt-1 font-mono text-lg">
                  {resource.data.annualIrradianceKWhM2.toFixed(0)} kWh/m²/year
                </dd>
              </div>
              <div>
                <dt className="label-technical">Daily irradiation</dt>
                <dd className="mt-1 font-mono text-lg">
                  {(resource.data.annualIrradianceKWhM2 / 365).toFixed(2)} kWh/m²/day
                </dd>
              </div>
              <div>
                <dt className="label-technical">Peak sun hours</dt>
                <dd className="mt-1 font-mono text-lg">
                  {resource.data.peakSunHours.toFixed(2)} h/day
                </dd>
              </div>
            </dl>
            <Provenance
              provider={resource.data.source.providerLabel ?? resource.data.source.provider}
              classification={resource.data.source.dataType}
              retrievedAt={resource.data.source.retrievedAt}
              method={resource.data.source.calculationMethod}
            />
            <div className="mt-4 overflow-x-auto border border-border">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="label-technical px-3 py-2">Month</th>
                    <th className="label-technical px-3 py-2 text-right">Irradiation (kWh/m²)</th>
                    {environment && (
                      <th className="label-technical px-3 py-2 text-right">Air temp (°C)</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {resource.data.monthlyIrradianceKWhM2.map((item, index) => (
                    <tr key={item.month}>
                      <td className="px-3 py-1.5 font-mono text-xs">
                        {MONTH_NAMES[item.month - 1] ?? item.month}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-xs">
                        {item.value.toFixed(1)}
                      </td>
                      {environment && (
                        <td className="px-3 py-1.5 text-right font-mono text-xs">
                          {environment.data.monthly[index]?.temperatureC?.toFixed(1) ?? "—"}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {environment && (
        <section className="border-b border-border px-5 py-4">
          <p className="label-technical">Environmental conditions</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Monthly climatology of air temperature, wind speed and surface irradiance, used as
            modelling context rather than site measurement.
          </p>
          <Provenance
            provider={environment.data.source.providerLabel ?? environment.data.source.provider}
            classification={environment.data.source.dataType}
            retrievedAt={environment.data.source.retrievedAt}
            method={environment.data.source.calculationMethod}
          />
        </section>
      )}

      {performance && (
        <section className="border-b border-border px-5 py-4">
          <p className="label-technical">Estimated generation</p>
          <dl className="mt-3 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="label-technical">Daily</dt>
              <dd className="mt-1 font-mono text-lg">
                {performance.data.expectedDailyGenerationKWh.toFixed(1)} kWh
              </dd>
            </div>
            <div>
              <dt className="label-technical">Monthly</dt>
              <dd className="mt-1 font-mono text-lg">
                {performance.data.expectedMonthlyGenerationKWh.toFixed(0)} kWh
              </dd>
            </div>
            <div>
              <dt className="label-technical">Annual</dt>
              <dd className="mt-1 font-mono text-lg">
                {performance.data.expectedAnnualGenerationKWh.toFixed(0)} kWh
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            Modelled for {performance.data.installedCapacityKW} kWp. This is an estimate, not
            measured output.
          </p>
          <Provenance
            provider={performance.data.source.providerLabel ?? performance.data.source.provider}
            classification={performance.data.source.dataType}
            retrievedAt={performance.data.source.retrievedAt}
            method={performance.data.source.calculationMethod}
          />
        </section>
      )}

      <section className="px-5 py-4">
        <p className="label-technical">Telemetry</p>
        <p className="mt-2 text-sm text-muted-foreground">{telemetry.message}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Actual generation, system status and alerts require a connected monitoring provider such
          as SolarEdge.
        </p>
        {onCreateProject && (
          <button
            type="button"
            onClick={onCreateProject}
            className="mt-4 rounded-sm border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Save this location as a project
          </button>
        )}
      </section>
    </div>
>>>>>>> 98fc0f25cf8d022ec34cc1b6c041037275b39e4d
  );
}

import { useEffect, useState } from "react";
import { getModelledSolarResource } from "@/api/solar/server-functions";
import type { SolarResourceData } from "@/services/solar-data/types";

export function SolarResourcePanel({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const [resource, setResource] = useState<SolarResourceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    void getModelledSolarResource({ data: { location: { latitude, longitude } } })
      .then((result) => {
        if (active) setResource(result);
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError instanceof Error
              ? "Solar resource data is temporarily unavailable."
              : "Solar resource data is temporarily unavailable.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [latitude, longitude]);
  return (
    <section className="mt-8 border-t border-border pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-technical">Solar Resource</p>
          <h3 className="mt-2 text-xl font-semibold">Location-based modelled resource</h3>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          {loading ? "Retrieving PVGIS data…" : resource ? "PVGIS · Modelled" : "Unavailable"}
        </p>
      </div>
      {loading ? (
        <p className="mt-5 text-sm text-muted-foreground">Loading solar resource data…</p>
      ) : error ? (
        <p
          role="alert"
          className="mt-5 border-l-2 border-solar bg-muted/30 p-4 text-sm text-muted-foreground"
        >
          {error} Your project can continue using manual assumptions.
        </p>
      ) : resource ? (
        <>
          <div className="mt-5 grid gap-5 border-y border-border py-5 sm:grid-cols-3">
            <div>
              <p className="label-technical">Annual irradiation</p>
              <p className="mt-2 font-mono text-lg">
                {resource.annualIrradianceKWhM2.toFixed(0)} kWh/m²
              </p>
            </div>
            <div>
              <p className="label-technical">Average daily irradiation</p>
              <p className="mt-2 font-mono text-lg">
                {(resource.annualIrradianceKWhM2 / 365).toFixed(2)} kWh/m²/day
              </p>
            </div>
            <div>
              <p className="label-technical">Peak sun hours</p>
              <p className="mt-2 font-mono text-lg">{resource.peakSunHours.toFixed(2)} h/day</p>
            </div>
          </div>
          <div className="mt-5 overflow-x-auto border border-border bg-card">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="label-technical px-4 py-3">Month</th>
                  <th className="label-technical px-4 py-3">Irradiation</th>
                  <th className="label-technical px-4 py-3">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {resource.monthlyIrradianceKWhM2.map((item) => (
                  <tr key={item.month}>
                    <td className="px-4 py-2 font-mono text-xs">{item.month}</td>
                    <td className="px-4 py-2 font-mono text-xs">{item.value.toFixed(2)} kWh/m²</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {resource.source.provider} · {resource.source.mode}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Retrieved {new Date(resource.source.retrievedAt).toLocaleString()}. This is a
            climate-based modelled estimate, not measured or live plant telemetry.
          </p>
        </>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">
          No solar resource data is available for this location.
        </p>
      )}
    </section>
  );
}

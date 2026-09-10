import { createServerFn } from "@tanstack/react-start";
import { solarDataService } from "@/services/solar-data/solar-data-service";
import { locationInsightService } from "@/services/solar-data/location-insight-service";
import { fleetService } from "@/services/solar-data/fleet-service";
import { geocodingService } from "@/services/geocoding/geocoding-service";
import type { PVGISRequest, ResolvedPlace } from "@/services/solar-data/types";

export const getModelledSolarResource = createServerFn({ method: "POST" })
  .validator((data: PVGISRequest) => data)
  .handler(async ({ data }) => {
    return solarDataService.getSolarResource(data);
  });

export const getModelledPVPerformance = createServerFn({ method: "POST" })
  .validator((data: PVGISRequest) => data)
  .handler(async ({ data }) => {
    return solarDataService.getPVPerformance(data);
  });

<<<<<<< HEAD
export const getMultiProviderSolarResource = createServerFn({ method: "POST" })
  .validator((data: PVGISRequest) => data)
  .handler(async ({ data }) => solarDataService.getMultiProviderSolarResource(data));
=======
/**
 * Normalized, provider-agnostic solar insight for any location worldwide.
 * The client never talks to a data provider directly.
 */
export const getSolarLocationInsight = createServerFn({ method: "POST" })
  .validator(
    (data: {
      place: ResolvedPlace;
      installedCapacityKW?: number;
      datasets?: Array<"resource" | "performance" | "environment" | "telemetry">;
    }) => data,
  )
  .handler(async ({ data }) => {
    return locationInsightService.getInsight({
      place: data.place,
      ...(data.installedCapacityKW === undefined
        ? {}
        : { installedCapacityKW: data.installedCapacityKW }),
      datasets: data.datasets ?? ["resource", "environment", "performance"],
    });
  });

/** Worldwide place search backed by a real geocoding provider. */
export const searchSolarLocations = createServerFn({ method: "POST" })
  .validator((data: { query: string }) => data)
  .handler(async ({ data }) => {
    try {
      return { results: await geocodingService.search(data.query), error: null as string | null };
    } catch {
      return { results: [], error: "LOCATION_SEARCH_UNAVAILABLE" as string | null };
    }
  });

/** Fleet/location table rows with classified, provider-backed values. */
export const getFleetOverview = createServerFn({ method: "GET" }).handler(async () => {
  return fleetService.getRows();
});
>>>>>>> 98fc0f25cf8d022ec34cc1b6c041037275b39e4d

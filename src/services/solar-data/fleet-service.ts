import { LocationInsightService, locationInsightService } from "./location-insight-service.ts";
import type { FleetRow, SolarLocationMarker } from "./insight-types.ts";
import { DEMO_SITES } from "./site-catalogue.ts";

/**
 * Builds the fleet/location table rows.
 *
 * Expected-energy figures come from the provider layer as estimated
 * generation. When no provider can answer for a location, the row reports the
 * value as unavailable rather than substituting an invented number.
 */
export class FleetService {
  private readonly insights: LocationInsightService;

  constructor(insights: LocationInsightService = locationInsightService) {
    this.insights = insights;
  }

  async getRows(sites: SolarLocationMarker[] = DEMO_SITES): Promise<FleetRow[]> {
    return Promise.all(sites.map((site) => this.getRow(site)));
  }

  async getRow(site: SolarLocationMarker): Promise<FleetRow> {
    const base: FleetRow = {
      ...site,
      expectedEnergyClassification: "unavailable",
      expectedEnergyState: "provider_error",
    };
    if (!site.installedCapacityKw) {
      return {
        ...base,
        expectedEnergyState: "no_coverage",
        note: "No system capacity recorded for this location.",
      };
    }
    try {
      const insight = await this.insights.getInsight({
        place: {
          name: site.name,
          latitude: site.latitude,
          longitude: site.longitude,
          ...(site.country ? { country: site.country } : {}),
          ...(site.region ? { region: site.region } : {}),
        },
        installedCapacityKW: site.installedCapacityKw,
        datasets: ["performance"],
      });
      const performance = insight.performance?.data;
      if (!performance) {
        const log = insight.providerLog[insight.providerLog.length - 1];
        return {
          ...base,
          expectedEnergyState: log?.outcome === "no_coverage" ? "no_coverage" : "provider_error",
        };
      }
      const result: FleetRow = {
        ...site,
        expectedEnergyTodayKWh: performance.expectedDailyGenerationKWh,
        expectedEnergyClassification: performance.source.dataType,
        expectedEnergyState: "available",
        dataMode: performance.source.dataType,
        provider: performance.source.provider,
        retrievedAt: performance.source.retrievedAt,
      };
      if (performance.source.providerLabel) result.providerLabel = performance.source.providerLabel;
      return result;
    } catch {
      return base;
    }
  }
}

export const fleetService = new FleetService();

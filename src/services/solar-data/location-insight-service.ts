import { ProviderPolicy, providerPolicy, type ProviderRegistration } from "./provider-policy.ts";
import { buildCacheKey, cachedValue } from "./solar-data-service.ts";
import type { SolarDataset, SolarLocationInsight } from "./insight-types.ts";
import type {
  MeteorologicalData,
  PVGISRequest,
  PVPerformanceEstimate,
  ResolvedPlace,
  SolarResourceData,
} from "./types.ts";
import { validateLocation } from "./types.ts";
import { AVAILABILITY_MESSAGE } from "./classification.ts";

const RESOURCE_TTL_MS = 86_400_000;

export interface LocationInsightRequest {
  place: ResolvedPlace;
  installedCapacityKW?: number;
  tilt?: number;
  azimuth?: number;
  systemLossPercent?: number;
  preferredProviders?: string[];
  connectedProviders?: string[];
  /** Which datasets to retrieve. Defaults to resource + environment. */
  datasets?: SolarDataset[];
}

type Outcome = SolarLocationInsight["providerLog"][number]["outcome"];

function classifyError(error: unknown): { outcome: Outcome; detail: string } {
  const message = error instanceof Error ? error.message : "PROVIDER_UNAVAILABLE";
  if (message === "NO_COVERAGE") return { outcome: "no_coverage", detail: message };
  if (message === "UNSUPPORTED_DATASET") return { outcome: "unsupported", detail: message };
  if (message === "CREDENTIAL_REQUIRED" || message === "CREDENTIAL_REJECTED")
    return { outcome: "credential_required", detail: message };
  return { outcome: "error", detail: message };
}

/**
 * The single application entry point for location-based solar data.
 *
 * UI components call this service; they never call PVGIS, NASA POWER,
 * SolarEdge or any other provider directly. Results are normalized and carry
 * their classification and provenance.
 */
export class LocationInsightService {
  private readonly policy: ProviderPolicy;
  private readonly ttlMs: number;

  constructor(policy: ProviderPolicy = providerPolicy, ttlMs = RESOURCE_TTL_MS) {
    this.policy = policy;
    this.ttlMs = ttlMs;
  }

  async getInsight(request: LocationInsightRequest): Promise<SolarLocationInsight> {
    const { place } = request;
    validateLocation(place);
    const datasets = request.datasets ?? ["resource", "environment"];
    const providerLog: SolarLocationInsight["providerLog"] = [];
    const insight: SolarLocationInsight = {
      place,
      telemetry: {
        status: "not_connected",
        state: "not_connected",
        message: AVAILABILITY_MESSAGE.not_connected,
      },
      providerLog,
      retrievedAt: new Date().toISOString(),
    };

    const providerRequest: PVGISRequest = {
      location: { latitude: place.latitude, longitude: place.longitude },
      ...(request.installedCapacityKW === undefined
        ? {}
        : { installedCapacityKW: request.installedCapacityKW }),
      ...(request.tilt === undefined ? {} : { tilt: request.tilt }),
      ...(request.azimuth === undefined ? {} : { azimuth: request.azimuth }),
      ...(request.systemLossPercent === undefined
        ? {}
        : { systemLossPercent: request.systemLossPercent }),
    };

    if (datasets.includes("resource")) {
      const resource = await this.attempt<SolarResourceData>(
        "resource",
        request,
        providerRequest,
        providerLog,
        (registration) => registration.provider.getSolarResource(providerRequest),
      );
      if (resource) insight.resource = { data: resource, state: "available" };
    }

    if (datasets.includes("performance") && request.installedCapacityKW) {
      const performance = await this.attempt<PVPerformanceEstimate>(
        "performance",
        request,
        providerRequest,
        providerLog,
        (registration) => registration.provider.getPVPerformance(providerRequest),
      );
      if (performance) insight.performance = { data: performance, state: "available" };
    }

    if (datasets.includes("environment")) {
      const environment = await this.attempt<MeteorologicalData>(
        "environment",
        request,
        providerRequest,
        providerLog,
        (registration) => registration.provider.getMeteorologicalData(providerRequest),
        ["nasa-power"],
      );
      if (environment) insight.environment = { data: environment, state: "available" };
    }

    return insight;
  }

  private async attempt<T>(
    dataset: SolarDataset,
    request: LocationInsightRequest,
    providerRequest: PVGISRequest,
    providerLog: SolarLocationInsight["providerLog"],
    load: (registration: ProviderRegistration) => Promise<T>,
    preferOverride?: string[],
  ): Promise<T | undefined> {
    const candidates = this.policy.select({
      location: providerRequest.location,
      dataset,
      preferredProviders: preferOverride ?? request.preferredProviders ?? [],
      ...(request.connectedProviders ? { connectedProviders: request.connectedProviders } : {}),
    });

    for (const registration of candidates) {
      const key = buildCacheKey([
        registration.id,
        dataset,
        providerRequest.location.latitude.toFixed(4),
        providerRequest.location.longitude.toFixed(4),
        providerRequest.installedCapacityKW,
        providerRequest.tilt,
        providerRequest.azimuth,
        providerRequest.systemLossPercent,
      ]);
      try {
        const value = await cachedValue<T>(key, this.ttlMs, () => load(registration));
        providerLog.push({ provider: registration.id, dataset, outcome: "available" });
        return value;
      } catch (error) {
        const { outcome, detail } = classifyError(error);
        providerLog.push({ provider: registration.id, dataset, outcome, detail });
      }
    }
    return undefined;
  }
}

export const locationInsightService = new LocationInsightService();

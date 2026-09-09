import { PVGISProvider } from "./providers/pvgis-provider.ts";
import { NasaPowerProvider } from "./providers/nasa-power-provider.ts";
import type {
  PVGISRequest,
  PVPerformanceEstimate,
  SolarDataProvider,
  MultiProviderSolarResource,
  SolarResourceData,
} from "./types.ts";
import { validateLocation } from "./types.ts";

type CacheEntry<T> = { expiresAt: number; value: T };
const cache = new Map<string, CacheEntry<unknown>>();

function cacheKey(request: PVGISRequest, method: string, provider = "pvgis") {
  return [
    provider,
    method,
    request.location.latitude.toFixed(5),
    request.location.longitude.toFixed(5),
    request.installedCapacityKW ?? "",
    request.tilt ?? 10,
    request.azimuth ?? 0,
    request.systemLossPercent ?? 14,
    request.panelTechnology ?? "crystSi",
  ].join(":");
}

export class SolarDataService {
  private readonly providers: SolarDataProvider[];
  private readonly cacheTtlMs: number;
  constructor(
    providers: SolarDataProvider | SolarDataProvider[] = [
      new PVGISProvider(),
      new NasaPowerProvider(),
    ],
    cacheTtlMs = 86_400_000,
  ) {
    this.providers = Array.isArray(providers) ? providers : [providers];
    this.cacheTtlMs = cacheTtlMs;
  }
  async getSolarResource(request: PVGISRequest): Promise<SolarResourceData> {
    const provider = this.providers[0];
    if (!provider) throw new Error("NO_SOLAR_PROVIDER_CONFIGURED");
    return this.cached("resource", request, provider.id, () => provider.getSolarResource(request));
  }
  async getPVPerformance(request: PVGISRequest): Promise<PVPerformanceEstimate> {
    const provider = this.providers[0];
    if (!provider) throw new Error("NO_SOLAR_PROVIDER_CONFIGURED");
    return this.cached("performance", request, provider.id, () =>
      provider.getPVPerformance(request),
    );
  }
  async getMultiProviderSolarResource(request: PVGISRequest): Promise<MultiProviderSolarResource> {
    validateLocation(request.location);
    const providers = await Promise.all(
      this.providers.map(async (provider) => {
        try {
          const resource = await this.cached("resource", request, provider.id, () =>
            provider.getSolarResource(request),
          );
          return {
            provider: provider.id,
            status: "available" as const,
            dataType: resource.source.dataType,
            dataset: resource.source.dataset,
            resource,
          };
        } catch (error) {
          return {
            provider: provider.id,
            status: "unavailable" as const,
            dataType:
              provider.id === "nasa-power"
                ? "Satellite/reanalysis environmental data"
                : "Modelled solar resource",
            dataset: provider.id,
            message:
              error instanceof Error && error.message === "NO_PROVIDER_COVERAGE"
                ? "No coverage"
                : "Provider unavailable",
          };
        }
      }),
    );
    return { location: request.location, providers };
  }
  private async cached<T>(
    method: string,
    request: PVGISRequest,
    provider: string,
    load: () => Promise<T>,
  ): Promise<T> {
    validateLocation(request.location);
    const key = cacheKey(request, method, provider);
    const existing = cache.get(key);
    if (existing && existing.expiresAt > Date.now()) return existing.value as T;
    const value = await load();
    cache.set(key, { value, expiresAt: Date.now() + this.cacheTtlMs });
    return value;
  }
}

export const solarDataService = new SolarDataService();
export function clearSolarDataCache() {
  cache.clear();
}

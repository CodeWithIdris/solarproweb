import { PVGISProvider } from "./providers/pvgis-provider.ts";
import type {
  PVGISRequest,
  PVPerformanceEstimate,
  SolarDataProvider,
  SolarResourceData,
} from "./types.ts";
import { validateLocation } from "./types.ts";

type CacheEntry<T> = { expiresAt: number; value: T };
const cache = new Map<string, CacheEntry<unknown>>();

function cacheKey(request: PVGISRequest, method: string) {
  return [
    "pvgis",
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
  private readonly provider: SolarDataProvider;
  private readonly cacheTtlMs: number;
  constructor(provider: SolarDataProvider = new PVGISProvider(), cacheTtlMs = 86_400_000) {
    this.provider = provider;
    this.cacheTtlMs = cacheTtlMs;
  }
  async getSolarResource(request: PVGISRequest): Promise<SolarResourceData> {
    return this.cached("resource", request, () => this.provider.getSolarResource(request));
  }
  async getPVPerformance(request: PVGISRequest): Promise<PVPerformanceEstimate> {
    return this.cached("performance", request, () => this.provider.getPVPerformance(request));
  }
  private async cached<T>(
    method: string,
    request: PVGISRequest,
    load: () => Promise<T>,
  ): Promise<T> {
    validateLocation(request.location);
    const key = cacheKey(request, method);
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

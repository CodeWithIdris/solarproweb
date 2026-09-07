import type {
  MeteorologicalData,
  PVGISRequest,
  PVPerformanceEstimate,
  SolarDataProvider,
  SolarResourceData,
} from "../types.ts";
import { validateLocation } from "../types.ts";

const DEFAULT_BASE_URL = "https://re.jrc.ec.europa.eu/api/v5_3";

type PVGISMonthly = {
  month: number;
  E_d?: number;
  "H(i)_d"?: number;
  T2m?: number;
  WS10m?: number;
};
type PVGISResponse = {
  outputs?: {
    monthly?: PVGISMonthly[];
    totals?: { fixed?: { E_y?: number; E_m?: number; E_d?: number } };
  };
  inputs?: { location?: { latitude?: number; longitude?: number } };
};

function source(retrievedAt: string) {
  return {
    provider: "pvgis",
    providerLabel: "PVGIS",
    mode: "modelled" as const,
    quality: "provider-modelled" as const,
    dataType: "modelled_resource" as const,
    retrievedAt,
    calculationMethod: "PVGIS PV performance model",
    attribution: "PVGIS (European Commission Joint Research Centre) modelled solar resource.",
  };
}

export class PVGISProvider implements SolarDataProvider {
  readonly id = "pvgis";
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;
  constructor(baseUrl = DEFAULT_BASE_URL, fetcher: typeof fetch = fetch) {
    this.baseUrl = baseUrl;
    this.fetcher = fetcher;
  }

  private async request(request: PVGISRequest): Promise<PVGISResponse> {
    validateLocation(request.location);
    const params = new URLSearchParams({
      lat: String(request.location.latitude),
      lon: String(request.location.longitude),
      peakpower: String(request.installedCapacityKW ?? 1),
      loss: String(request.systemLossPercent ?? 14),
      angle: String(request.tilt ?? 10),
      aspect: String(request.azimuth ?? 0),
      pvtechchoice: request.panelTechnology ?? "crystSi",
      outputformat: "json",
    });
    const response = await this.fetcher(`${this.baseUrl}/PVcalc?${params}`);
    if (!response.ok)
      throw new Error(response.status === 429 ? "PROVIDER_RATE_LIMITED" : "PROVIDER_UNAVAILABLE");
    const payload = (await response.json()) as PVGISResponse;
    if (!payload.outputs?.monthly?.length) throw new Error("MALFORMED_PROVIDER_RESPONSE");
    return payload;
  }

  async getSolarResource(request: PVGISRequest): Promise<SolarResourceData> {
    const retrievedAt = new Date().toISOString();
    const payload = await this.request({ ...request, installedCapacityKW: 1 });
    return this.resourceFromPayload(request, payload, retrievedAt);
  }

  private resourceFromPayload(
    request: PVGISRequest,
    payload: PVGISResponse,
    retrievedAt: string,
  ): SolarResourceData {
    const monthly = payload.outputs?.monthly ?? [];
    const values = monthly.map((item) => (Number(item["H(i)_d"] ?? 0) * 30.4375) / 1000);
    const annual = values.reduce((sum, value) => sum + value, 0);
    return {
      location: request.location,
      annualIrradianceKWhM2: annual,
      peakSunHours: annual / 365,
      monthlyIrradianceKWhM2: monthly.map((item, index) => ({
        month: item.month,
        value: values[index] ?? 0,
      })),
      source: source(retrievedAt),
    };
  }

  async getMeteorologicalData(request: PVGISRequest): Promise<MeteorologicalData> {
    const retrievedAt = new Date().toISOString();
    const payload = await this.request(request);
    const monthly = payload.outputs?.monthly ?? [];
    return {
      location: request.location,
      monthly: monthly.map((item) => ({
        month: item.month,
        ...(item.T2m === undefined ? {} : { temperatureC: item.T2m }),
        ...(item.WS10m === undefined ? {} : { windSpeedMS: item.WS10m }),
        ...(item["H(i)_d"] === undefined ? {} : { irradianceKWhM2: item["H(i)_d"] }),
      })),
      source: source(retrievedAt),
    };
  }

  async getPVPerformance(request: PVGISRequest): Promise<PVPerformanceEstimate> {
    const retrievedAt = new Date().toISOString();
    const payload = await this.request(request);
    const totals = payload.outputs?.totals?.fixed;
    const capacity = request.installedCapacityKW ?? 1;
    const resource = this.resourceFromPayload(request, payload, retrievedAt);
    return {
      location: request.location,
      installedCapacityKW: capacity,
      expectedDailyGenerationKWh: Number(totals?.E_d ?? 0),
      expectedMonthlyGenerationKWh: Number(totals?.E_m ?? 0),
      expectedAnnualGenerationKWh: Number(totals?.E_y ?? 0),
      solarResource: resource,
      source: {
        ...source(retrievedAt),
        dataType: "estimated_generation" as const,
        calculationMethod: "PVGIS PVcalc fixed-system estimate",
      },
    };
  }
}

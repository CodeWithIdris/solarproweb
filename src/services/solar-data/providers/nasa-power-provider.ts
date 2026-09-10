import type {
  MeteorologicalData,
  PVGISRequest,
  PVPerformanceEstimate,
  SolarDataProvider,
  SolarResourceData,
} from "../types.ts";
import { validateLocation } from "../types.ts";

const BASE_URL = "https://power.larc.nasa.gov/api/temporal/climatology/point";
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const DAYS = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
type Payload = { properties?: { parameter?: Record<string, Record<string, number>> } };

function source(retrievedAt: string) {
  return {
    provider: "nasa-power",
    dataset: "NASA POWER Climatology",
    dataType: "Satellite/reanalysis environmental data",
    mode: "environmental" as const,
    quality: "satellite-reanalysis" as const,
    retrievedAt,
    attribution: "NASA POWER",
  };
}

export class NasaPowerProvider implements SolarDataProvider {
  readonly id = "nasa-power";
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;
  constructor(baseUrl = BASE_URL, fetcher: typeof fetch = fetch) {
    this.baseUrl = baseUrl;
    this.fetcher = fetcher;
  }
  private async request(request: PVGISRequest): Promise<Payload> {
    validateLocation(request.location);
    const params = new URLSearchParams({
      parameters: "ALLSKY_SFC_SW_DWN,T2M,WS2M",
      community: "RE",
      longitude: String(request.location.longitude),
      latitude: String(request.location.latitude),
      format: "JSON",
    });
    const response = await this.fetcher(`${this.baseUrl}?${params}`);
    if (!response.ok)
      throw new Error(response.status === 404 ? "NO_PROVIDER_COVERAGE" : "PROVIDER_UNAVAILABLE");
    const payload = (await response.json()) as Payload;
    if (!payload.properties?.parameter?.["ALLSKY_SFC_SW_DWN"])
      throw new Error("MALFORMED_PROVIDER_RESPONSE");
    return payload;
  }
  async getSolarResource(request: PVGISRequest): Promise<SolarResourceData> {
    const retrievedAt = new Date().toISOString();
    const payload = await this.request(request);
    const irradiation = payload.properties!.parameter!["ALLSKY_SFC_SW_DWN"]!;
    const monthlyIrradianceKWhM2 = MONTHS.map((month, index) => ({
      month: index + 1,
      value: Number(irradiation[month] ?? 0) * DAYS[index]!,
    }));
    const annualIrradianceKWhM2 = monthlyIrradianceKWhM2.reduce(
      (total, item) => total + item.value,
      0,
    );
    return {
      location: request.location,
      annualIrradianceKWhM2,
      peakSunHours: annualIrradianceKWhM2 / 365,
      monthlyIrradianceKWhM2,
      source: source(retrievedAt),
    };
  }
  async getMeteorologicalData(request: PVGISRequest): Promise<MeteorologicalData> {
    const retrievedAt = new Date().toISOString();
    const payload = await this.request(request);
    const params = payload.properties!.parameter!;
    return {
      location: request.location,
      monthly: MONTHS.map((month, index) => ({
        month: index + 1,
        irradianceKWhM2: Number(params["ALLSKY_SFC_SW_DWN"]?.[month] ?? 0),
        temperatureC: Number(params["T2M"]?.[month]),
        windSpeedMS: Number(params["WS2M"]?.[month]),
      })),
      source: source(retrievedAt),
    };
  }
  async getPVPerformance(_request: PVGISRequest): Promise<PVPerformanceEstimate> {
    throw new Error("UNSUPPORTED_PROVIDER_OPERATION");
  }
}

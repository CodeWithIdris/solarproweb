import type {
  MeteorologicalData,
  PVGISRequest,
  PVPerformanceEstimate,
  SolarDataProvider,
<<<<<<< HEAD
=======
  SolarDataSource,
>>>>>>> 98fc0f25cf8d022ec34cc1b6c041037275b39e4d
  SolarResourceData,
} from "../types.ts";
import { validateLocation } from "../types.ts";

<<<<<<< HEAD
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
=======
const DEFAULT_BASE_URL = "https://power.larc.nasa.gov/api/temporal/climatology/point";
const MONTH_KEYS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

const DAYS_IN_MONTH = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

type ParameterBlock = Record<string, number>;
type PowerResponse = {
  properties?: { parameter?: Record<string, ParameterBlock> };
  messages?: string[];
};

function source(retrievedAt: string, calculationMethod: string): SolarDataSource {
  return {
    provider: "nasa-power",
    providerLabel: "NASA POWER",
    mode: "satellite_reanalysis",
    quality: "provider-reanalysis",
    dataType: "satellite_reanalysis",
    retrievedAt,
    calculationMethod,
    attribution: "NASA POWER (satellite and reanalysis climatology).",
  };
}

/** Values marked -999 by POWER mean "no value for this location". */
function clean(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value) || value <= -900) return undefined;
  return value;
}

export class NASAPowerProvider implements SolarDataProvider {
  readonly id = "nasa-power";
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;

  constructor(baseUrl = DEFAULT_BASE_URL, fetcher: typeof fetch = fetch) {
    this.baseUrl = baseUrl;
    this.fetcher = fetcher;
  }

  private async request(request: PVGISRequest): Promise<Record<string, ParameterBlock>> {
    validateLocation(request.location);
    const params = new URLSearchParams({
      parameters: "ALLSKY_SFC_SW_DWN,T2M,WS10M",
      community: "RE",
      latitude: String(request.location.latitude),
      longitude: String(request.location.longitude),
>>>>>>> 98fc0f25cf8d022ec34cc1b6c041037275b39e4d
      format: "JSON",
    });
    const response = await this.fetcher(`${this.baseUrl}?${params}`);
    if (!response.ok)
<<<<<<< HEAD
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
=======
      throw new Error(response.status === 429 ? "PROVIDER_RATE_LIMITED" : "PROVIDER_UNAVAILABLE");
    const payload = (await response.json()) as PowerResponse;
    const parameter = payload.properties?.parameter;
    if (!parameter?.["ALLSKY_SFC_SW_DWN"]) throw new Error("MALFORMED_PROVIDER_RESPONSE");
    const irradiance = parameter["ALLSKY_SFC_SW_DWN"];
    const hasAnyMonth = MONTH_KEYS.some((key) => clean(irradiance[key]) !== undefined);
    if (!hasAnyMonth) throw new Error("NO_COVERAGE");
    return parameter;
  }

  async getSolarResource(request: PVGISRequest): Promise<SolarResourceData> {
    const retrievedAt = new Date().toISOString();
    const parameter = await this.request(request);
    const irradiance = parameter["ALLSKY_SFC_SW_DWN"] ?? {};
    const monthly = MONTH_KEYS.map((key, index) => {
      const daily = clean(irradiance[key]) ?? 0;
      return { month: index + 1, value: daily * (DAYS_IN_MONTH[index] ?? 30) };
    });
    const annual = monthly.reduce((sum, item) => sum + item.value, 0);
    return {
      location: request.location,
      annualIrradianceKWhM2: annual,
      peakSunHours: annual / 365.25,
      monthlyIrradianceKWhM2: monthly,
      source: source(
        retrievedAt,
        "NASA POWER climatology of all-sky surface shortwave downward irradiance",
      ),
    };
  }

  async getMeteorologicalData(request: PVGISRequest): Promise<MeteorologicalData> {
    const retrievedAt = new Date().toISOString();
    const parameter = await this.request(request);
    const irradiance = parameter["ALLSKY_SFC_SW_DWN"] ?? {};
    const temperature = parameter["T2M"] ?? {};
    const wind = parameter["WS10M"] ?? {};
    return {
      location: request.location,
      monthly: MONTH_KEYS.map((key, index) => {
        const temperatureC = clean(temperature[key]);
        const windSpeedMS = clean(wind[key]);
        const irradianceKWhM2 = clean(irradiance[key]);
        return {
          month: index + 1,
          ...(temperatureC === undefined ? {} : { temperatureC }),
          ...(windSpeedMS === undefined ? {} : { windSpeedMS }),
          ...(irradianceKWhM2 === undefined ? {} : { irradianceKWhM2 }),
        };
      }),
      source: source(retrievedAt, "NASA POWER climatology of temperature, wind and irradiance"),
    };
  }

  /**
   * NASA POWER publishes environmental data, not photovoltaic system modelling.
   * Solar Pro does not derive a generation figure here and present it as a
   * provider result.
   */
  async getPVPerformance(_request: PVGISRequest): Promise<PVPerformanceEstimate> {
    throw new Error("UNSUPPORTED_DATASET");
>>>>>>> 98fc0f25cf8d022ec34cc1b6c041037275b39e4d
  }
}

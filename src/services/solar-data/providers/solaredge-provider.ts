import type {
  MeteorologicalData,
  PVGISRequest,
  PVPerformanceEstimate,
  SolarDataProvider,
  SolarDataSource,
  SolarResourceData,
} from "../types.ts";

const DEFAULT_BASE_URL = "https://monitoringapi.solaredge.com";

export interface SolarEdgeCredentials {
  apiKey: string;
  siteId: string;
}

export interface ConnectedGeneration {
  siteId: string;
  energyKWh: number;
  periodStart: string;
  periodEnd: string;
  source: SolarDataSource;
}

function source(retrievedAt: string, live: boolean): SolarDataSource {
  return {
    provider: "solaredge",
    providerLabel: "SolarEdge",
    mode: live ? "live" : "connected",
    quality: "connected-measured",
    dataType: live ? "live_telemetry" : "historical_telemetry",
    retrievedAt,
    calculationMethod: "SolarEdge monitoring API measurement",
  };
}

/**
 * SolarEdge connected telemetry.
 *
 * This provider returns data only when real credentials exist and the API
 * responds successfully for the requested site. It never produces modelled,
 * estimated or placeholder values, and it is never used as a fallback for a
 * site that has not been connected.
 */
export class SolarEdgeProvider implements SolarDataProvider {
  readonly id = "solaredge";
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;
  private readonly credentials: SolarEdgeCredentials | undefined;

  constructor(
    credentials?: SolarEdgeCredentials,
    baseUrl = DEFAULT_BASE_URL,
    fetcher: typeof fetch = fetch,
  ) {
    this.credentials = credentials;
    this.baseUrl = baseUrl;
    this.fetcher = fetcher;
  }

  get isConnected(): boolean {
    return Boolean(this.credentials?.apiKey && this.credentials.siteId);
  }

  /** Energy actually measured by a connected SolarEdge site. */
  async getConnectedGeneration(day: string): Promise<ConnectedGeneration> {
    if (!this.credentials) throw new Error("CREDENTIAL_REQUIRED");
    const { apiKey, siteId } = this.credentials;
    const params = new URLSearchParams({
      api_key: apiKey,
      timeUnit: "DAY",
      startDate: day,
      endDate: day,
    });
    const response = await this.fetcher(`${this.baseUrl}/site/${siteId}/energy?${params}`);
    if (response.status === 401 || response.status === 403) throw new Error("CREDENTIAL_REJECTED");
    if (!response.ok)
      throw new Error(response.status === 429 ? "PROVIDER_RATE_LIMITED" : "PROVIDER_UNAVAILABLE");
    const payload = (await response.json()) as {
      energy?: { unit?: string; values?: Array<{ date: string; value: number | null }> };
    };
    const entry = payload.energy?.values?.[0];
    if (!entry || entry.value === null || entry.value === undefined)
      throw new Error("NO_TELEMETRY_RETURNED");
    const unit = payload.energy?.unit ?? "Wh";
    const energyKWh = unit === "Wh" ? entry.value / 1000 : entry.value;
    return {
      siteId,
      energyKWh,
      periodStart: `${day}T00:00:00Z`,
      periodEnd: `${day}T23:59:59Z`,
      source: source(new Date().toISOString(), false),
    };
  }

  async getSolarResource(_request: PVGISRequest): Promise<SolarResourceData> {
    throw new Error("UNSUPPORTED_DATASET");
  }
  async getMeteorologicalData(_request: PVGISRequest): Promise<MeteorologicalData> {
    throw new Error("UNSUPPORTED_DATASET");
  }
  async getPVPerformance(_request: PVGISRequest): Promise<PVPerformanceEstimate> {
    throw new Error("UNSUPPORTED_DATASET");
  }
}

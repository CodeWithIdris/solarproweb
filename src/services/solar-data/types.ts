export type SolarDataMode = "demo" | "modelled" | "historical" | "connected" | "live";
export type SolarDataQuality =
  "provider-modelled" | "provider-historical" | "connected-measured" | "demo";

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface SolarDataSource {
  provider: string;
  mode: SolarDataMode;
  quality: SolarDataQuality;
  retrievedAt: string;
  dataPeriod?: { start: string; end: string };
  calculationMethod?: string;
  attribution?: string;
}

export interface SolarResourceData {
  location: GeoLocation;
  annualIrradianceKWhM2: number;
  peakSunHours: number;
  monthlyIrradianceKWhM2: Array<{ month: number; value: number }>;
  source: SolarDataSource;
}

export interface MeteorologicalData {
  location: GeoLocation;
  monthly: Array<{
    month: number;
    temperatureC?: number;
    windSpeedMS?: number;
    irradianceKWhM2?: number;
  }>;
  source: SolarDataSource;
}

export interface PVPerformanceEstimate {
  location: GeoLocation;
  installedCapacityKW: number;
  expectedDailyGenerationKWh: number;
  expectedMonthlyGenerationKWh: number;
  expectedAnnualGenerationKWh: number;
  solarResource: SolarResourceData;
  source: SolarDataSource;
}

export interface PVGISRequest {
  location: GeoLocation;
  installedCapacityKW?: number;
  tilt?: number;
  azimuth?: number;
  systemLossPercent?: number;
  panelTechnology?: "crystSi" | "CIS" | "CdTe" | "unknown";
}

export interface SolarDataProvider {
  readonly id: string;
  getSolarResource(request: PVGISRequest): Promise<SolarResourceData>;
  getMeteorologicalData(request: PVGISRequest): Promise<MeteorologicalData>;
  getPVPerformance(request: PVGISRequest): Promise<PVPerformanceEstimate>;
}

export interface ProviderDataPolicy {
  provider: string;
  redistributionAllowed: boolean;
  attributionRequired: boolean;
  commercialUseAllowed: boolean;
  cacheAllowed: boolean;
  maximumCacheDurationSeconds: number;
  apiExposureAllowed: boolean;
  requiredAttribution?: string;
}

export const PVGIS_DATA_POLICY: ProviderDataPolicy = {
  provider: "pvgis",
  redistributionAllowed: false,
  attributionRequired: true,
  commercialUseAllowed: false,
  cacheAllowed: true,
  maximumCacheDurationSeconds: 86_400,
  apiExposureAllowed: false,
  requiredAttribution:
    "PVGIS data is used for Solar Pro modelled planning estimates; verify applicable provider terms before redistribution.",
};

export function validateLocation(location: GeoLocation): void {
  if (!Number.isFinite(location.latitude) || location.latitude < -90 || location.latitude > 90)
    throw new Error("INVALID_COORDINATES");
  if (!Number.isFinite(location.longitude) || location.longitude < -180 || location.longitude > 180)
    throw new Error("INVALID_COORDINATES");
}

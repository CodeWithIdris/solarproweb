import type {
  DataAvailabilityState,
  DataClassification,
  SiteOperationalStatus,
  TelemetryStatus,
} from "./classification.ts";
import type {
  GeoLocation,
  MeteorologicalData,
  PVPerformanceEstimate,
  ResolvedPlace,
  SolarDataSource,
  SolarResourceData,
} from "./types.ts";

/**
 * A normalized, provider-agnostic answer for one location.
 * Each section is independently classified and may be absent.
 */
export interface SolarLocationInsight {
  place: ResolvedPlace;
  resource?: { data: SolarResourceData; state: DataAvailabilityState };
  performance?: { data: PVPerformanceEstimate; state: DataAvailabilityState };
  environment?: { data: MeteorologicalData; state: DataAvailabilityState };
  telemetry: {
    status: TelemetryStatus;
    state: DataAvailabilityState;
    message: string;
    source?: SolarDataSource;
  };
  /** Provider attempts, successful or not, for transparency. */
  providerLog: Array<{
    provider: string;
    dataset: SolarDataset;
    outcome: "available" | "no_coverage" | "error" | "unsupported" | "credential_required";
    detail?: string;
  }>;
  retrievedAt: string;
}

export type SolarDataset = "resource" | "performance" | "environment" | "telemetry";

export type SiteType = "demo" | "project" | "connected";

/** Reusable marker/location model shared by the map, table and detail views. */
export interface SolarLocationMarker extends GeoLocation {
  id: string;
  name: string;
  country?: string;
  region?: string;
  locality?: string;
  siteType: SiteType;
  status: SiteOperationalStatus;
  dataMode: DataClassification;
  provider?: string;
  installedCapacityMwp?: number;
  installedCapacityKw?: number;
  telemetryStatus: TelemetryStatus;
  lastUpdated?: string;
}

/** One row of the fleet/location table, with every value classified. */
export interface FleetRow extends SolarLocationMarker {
  expectedEnergyTodayKWh?: number;
  expectedEnergyClassification: DataClassification;
  expectedEnergyState: DataAvailabilityState;
  providerLabel?: string;
  retrievedAt?: string;
  note?: string;
}

/**
 * Solar Pro data classification.
 *
 * Every energy or solar value surfaced by the platform carries one of these
 * classifications. The classification travels with the data through the
 * service layer; it is never invented at the UI layer.
 */
export type DataClassification =
  | "live_telemetry"
  | "historical_telemetry"
  | "modelled_resource"
  | "estimated_generation"
  | "satellite_reanalysis"
  | "demo"
  | "unavailable";

export const CLASSIFICATION_LABEL: Record<DataClassification, string> = {
  live_telemetry: "Live telemetry",
  historical_telemetry: "Historical telemetry",
  modelled_resource: "Modelled solar resource",
  estimated_generation: "Estimated generation",
  satellite_reanalysis: "Satellite/reanalysis data",
  demo: "Demo data",
  unavailable: "Unavailable",
};

/** Classifications that represent measurements from a connected system. */
export const TELEMETRY_CLASSIFICATIONS: DataClassification[] = [
  "live_telemetry",
  "historical_telemetry",
];

export function isTelemetry(classification: DataClassification): boolean {
  return TELEMETRY_CLASSIFICATIONS.includes(classification);
}

/** Whether a value of this classification may be cached as static resource data. */
export function isCacheableAsResource(classification: DataClassification): boolean {
  return (
    classification === "modelled_resource" ||
    classification === "estimated_generation" ||
    classification === "satellite_reanalysis"
  );
}

export type TelemetryStatus =
  | "not_connected"
  | "credential_required"
  | "connected"
  | "unknown";

export const TELEMETRY_STATUS_LABEL: Record<TelemetryStatus, string> = {
  not_connected: "Not connected",
  credential_required: "Credentials required",
  connected: "Connected",
  unknown: "Unknown",
};

/** Operational status may only be asserted when telemetry supports it. */
export type SiteOperationalStatus =
  | "operational"
  | "degraded"
  | "fault"
  | "unknown"
  | "not_connected";

export const OPERATIONAL_STATUS_LABEL: Record<SiteOperationalStatus, string> = {
  operational: "Operational",
  degraded: "Degraded",
  fault: "Fault",
  unknown: "Unknown",
  not_connected: "No connected telemetry",
};

export type DataAvailabilityState =
  | "loading"
  | "available"
  | "no_coverage"
  | "provider_error"
  | "credential_required"
  | "not_connected"
  | "demo";

export const AVAILABILITY_MESSAGE: Record<DataAvailabilityState, string> = {
  loading: "Retrieving solar resource data…",
  available: "Provider data retrieved.",
  no_coverage:
    "No data is currently available from the selected provider for this location.",
  provider_error: "Solar data could not be retrieved at this time.",
  credential_required: "Connect a provider to access telemetry for this site.",
  not_connected: "No connected telemetry is available for this location.",
  demo: "This location currently uses demonstration data.",
};

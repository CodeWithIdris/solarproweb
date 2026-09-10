import type { SolarLocationMarker } from "./insight-types.ts";

/**
 * Example locations shipped with Solar Pro.
 *
 * These are demonstration sites: real, reliably geocodable places with
 * illustrative installed capacities. No telemetry provider is connected to
 * any of them, so they carry no operational status, no alert counts and no
 * measured production. Their solar values are retrieved from providers at
 * request time and classified accordingly.
 */
export const DEMO_SITES: SolarLocationMarker[] = [
  {
    id: "DEMO-NG-KD-01",
    name: "Kaduna North",
    country: "Nigeria",
    region: "Kaduna",
    locality: "Kaduna",
    latitude: 10.5222,
    longitude: 7.4383,
    installedCapacityMwp: 12.4,
    installedCapacityKw: 12_400,
    siteType: "demo",
    status: "not_connected",
    dataMode: "demo",
    telemetryStatus: "not_connected",
  },
  {
    id: "DEMO-NG-KD-02",
    name: "Kaduna South",
    country: "Nigeria",
    region: "Kaduna",
    locality: "Kaduna",
    latitude: 10.4806,
    longitude: 7.4165,
    installedCapacityMwp: 9.8,
    installedCapacityKw: 9_800,
    siteType: "demo",
    status: "not_connected",
    dataMode: "demo",
    telemetryStatus: "not_connected",
  },
  {
    id: "DEMO-NG-NS-01",
    name: "Nasarawa East",
    country: "Nigeria",
    region: "Nasarawa",
    locality: "Lafia",
    latitude: 8.4939,
    longitude: 8.5175,
    installedCapacityMwp: 20.0,
    installedCapacityKw: 20_000,
    siteType: "demo",
    status: "not_connected",
    dataMode: "demo",
    telemetryStatus: "not_connected",
  },
  {
    id: "DEMO-NG-KN-01",
    name: "Kano River",
    country: "Nigeria",
    region: "Kano",
    locality: "Kano",
    latitude: 12.0022,
    longitude: 8.592,
    installedCapacityMwp: 7.5,
    installedCapacityKw: 7_500,
    siteType: "demo",
    status: "not_connected",
    dataMode: "demo",
    telemetryStatus: "not_connected",
  },
  {
    id: "DEMO-GH-AS-01",
    name: "Ashanti Ridge",
    country: "Ghana",
    region: "Ashanti",
    locality: "Kumasi",
    latitude: 6.6885,
    longitude: -1.6244,
    installedCapacityMwp: 15.2,
    installedCapacityKw: 15_200,
    siteType: "demo",
    status: "not_connected",
    dataMode: "demo",
    telemetryStatus: "not_connected",
  },
];

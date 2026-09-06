import type { SolarDataMode } from "./types";

export interface SolarSite {
  id: string;
  name: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  installedCapacityKw: number;
  installedCapacityMwp: number;
  panelWattage?: number;
  panelCount?: number;
  inverterCapacityKw?: number;
  tilt?: number;
  azimuth?: number;
  systemLossPercent?: number;
  dataMode: SolarDataMode;
  dataProvider?: string;
  lastUpdated: string;
  expectedEnergyTodayKWh?: number;
  actualEnergyTodayKWh?: number;
  performanceRatio?: number;
  openAlerts?: number;
  status: "operational" | "degraded" | "fault" | "unknown" | "not_connected";
}

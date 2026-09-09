import type { GeoLocation } from "@/services/solar-data/types";

export interface GeocodedLocation extends GeoLocation {
  label: string;
  country?: string;
  region?: string;
}

export function coordinatesFromQuery(query: string): GeoLocation | null {
  const match = query.trim().match(/^(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if (!match) return null;
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

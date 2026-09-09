import { createServerFn } from "@tanstack/react-start";
import type { GeocodedLocation } from "@/services/geocoding";
import { validateLocation, type GeoLocation } from "@/services/solar-data/types";

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
  address?: { country?: string; state?: string; region?: string; county?: string };
};

function normalise(result: NominatimResult): GeocodedLocation {
  return {
    latitude: Number(result.lat),
    longitude: Number(result.lon),
    label: result.display_name,
    ...(result.address?.country ? { country: result.address.country } : {}),
    ...((result.address?.state ?? result.address?.region ?? result.address?.county)
      ? { region: result.address?.state ?? result.address?.region ?? result.address?.county }
      : {}),
  };
}

async function nominatim(path: string): Promise<NominatimResult[]> {
  const response = await fetch(`https://nominatim.openstreetmap.org${path}`, {
    headers: { Accept: "application/json", "Accept-Language": "en" },
  });
  if (!response.ok) throw new Error("GEOCODING_UNAVAILABLE");
  return (await response.json()) as NominatimResult[];
}

export const searchLocations = createServerFn({ method: "GET" })
  .validator((data: { query: string }) => data)
  .handler(async ({ data }): Promise<GeocodedLocation[]> => {
    const query = data.query.trim();
    if (query.length < 2) return [];
    const results = await nominatim(
      `/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(query)}`,
    );
    return results.map(normalise).filter((item) => Number.isFinite(item.latitude));
  });

export const reverseGeocode = createServerFn({ method: "GET" })
  .validator((data: GeoLocation) => data)
  .handler(async ({ data }): Promise<GeocodedLocation | null> => {
    validateLocation(data);
    const results = await nominatim(
      `/reverse?format=jsonv2&addressdetails=1&lat=${data.latitude}&lon=${data.longitude}`,
    );
    return results[0] ? normalise(results[0]) : null;
  });

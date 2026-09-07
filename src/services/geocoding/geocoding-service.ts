import type { ResolvedPlace } from "@/services/solar-data/types";

const DEFAULT_BASE_URL = "https://geocoding-api.open-meteo.com/v1/search";

type GeocodingResult = {
  id?: number;
  name?: string;
  latitude?: number;
  longitude?: number;
  country?: string;
  country_code?: string;
  admin1?: string;
  admin2?: string;
};

/** Parses "40.7128, -74.0060" style input. Returns undefined when not coordinates. */
export function parseCoordinateQuery(query: string): ResolvedPlace | undefined {
  const match = query
    .trim()
    .match(/^(-?\d{1,3}(?:\.\d+)?)\s*[,\s]\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if (!match) return undefined;
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return undefined;
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return undefined;
  return {
    latitude,
    longitude,
    name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
  };
}

/**
 * Worldwide place search. Results come from a real geocoding provider only;
 * coordinates are never invented and unresolved queries return no results.
 */
export class GeocodingService {
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;

  constructor(baseUrl = DEFAULT_BASE_URL, fetcher: typeof fetch = fetch) {
    this.baseUrl = baseUrl;
    this.fetcher = fetcher;
  }

  async search(query: string, limit = 8): Promise<ResolvedPlace[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];
    const coordinate = parseCoordinateQuery(trimmed);
    if (coordinate) return [coordinate];
    const params = new URLSearchParams({
      name: trimmed,
      count: String(limit),
      language: "en",
      format: "json",
    });
    const response = await this.fetcher(`${this.baseUrl}?${params}`);
    if (!response.ok) throw new Error("GEOCODING_UNAVAILABLE");
    const payload = (await response.json()) as { results?: GeocodingResult[] };
    return (payload.results ?? [])
      .filter(
        (result) =>
          typeof result.latitude === "number" &&
          typeof result.longitude === "number" &&
          typeof result.name === "string",
      )
      .map((result) => ({
        name: result.name as string,
        latitude: result.latitude as number,
        longitude: result.longitude as number,
        ...(result.country ? { country: result.country } : {}),
        ...(result.country_code ? { countryCode: result.country_code.toUpperCase() } : {}),
        ...(result.admin1 ? { region: result.admin1 } : {}),
        ...(result.admin2 ? { locality: result.admin2 } : {}),
      }));
  }
}

export const geocodingService = new GeocodingService();

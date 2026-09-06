import type { GeoLocation, SolarDataProvider } from "./types.ts";
import type { SolarDataset } from "./insight-types.ts";
import { PVGISProvider } from "./providers/pvgis-provider.ts";
import { NASAPowerProvider } from "./providers/nasa-power-provider.ts";

export interface ProviderRegistration {
  id: string;
  label: string;
  provider: SolarDataProvider;
  /** Datasets this provider can answer. */
  datasets: SolarDataset[];
  /** Returns false when the location is outside the provider's coverage. */
  covers: (location: GeoLocation) => boolean;
  /** Providers requiring credentials are only selected once connected. */
  requiresCredentials: boolean;
  /** Lower runs first. */
  priority: number;
}

/** PVGIS v5.3 coverage: Europe, Africa, Asia and the Americas within these bounds. */
export function pvgisCovers(location: GeoLocation): boolean {
  const { latitude, longitude } = location;
  const inMainWindow =
    latitude >= -60 && latitude <= 65 && longitude >= -180 && longitude <= 180;
  return inMainWindow;
}

export function createDefaultRegistrations(): ProviderRegistration[] {
  return [
    {
      id: "pvgis",
      label: "PVGIS",
      provider: new PVGISProvider(),
      datasets: ["resource", "performance", "environment"],
      covers: pvgisCovers,
      requiresCredentials: false,
      priority: 10,
    },
    {
      id: "nasa-power",
      label: "NASA POWER",
      provider: new NASAPowerProvider(),
      datasets: ["resource", "environment"],
      covers: () => true,
      requiresCredentials: false,
      priority: 20,
    },
  ];
}

export interface ProviderSelectionContext {
  location: GeoLocation;
  dataset: SolarDataset;
  /** Providers the user or project explicitly prefers, highest first. */
  preferredProviders?: string[];
  /** Providers with valid credentials for this request. */
  connectedProviders?: string[];
  /** Providers currently marked unhealthy by the service. */
  unhealthyProviders?: string[];
}

/**
 * Chooses providers for a dataset, in the order they should be attempted.
 * Selection considers coverage, dataset support, credentials, health,
 * explicit preference and configured priority.
 */
export class ProviderPolicy {
  private readonly registrations: ProviderRegistration[];

  constructor(registrations: ProviderRegistration[] = createDefaultRegistrations()) {
    this.registrations = registrations;
  }

  list(): ProviderRegistration[] {
    return [...this.registrations];
  }

  get(id: string): ProviderRegistration | undefined {
    return this.registrations.find((registration) => registration.id === id);
  }

  select(context: ProviderSelectionContext): ProviderRegistration[] {
    const connected = context.connectedProviders ?? [];
    const unhealthy = context.unhealthyProviders ?? [];
    const preferred = context.preferredProviders ?? [];
    return this.registrations
      .filter((registration) => registration.datasets.includes(context.dataset))
      .filter((registration) => registration.covers(context.location))
      .filter((registration) => !unhealthy.includes(registration.id))
      .filter(
        (registration) => !registration.requiresCredentials || connected.includes(registration.id),
      )
      .sort((a, b) => {
        const preferenceA = preferred.indexOf(a.id);
        const preferenceB = preferred.indexOf(b.id);
        if (preferenceA !== preferenceB)
          return (preferenceA === -1 ? 999 : preferenceA) - (preferenceB === -1 ? 999 : preferenceB);
        return a.priority - b.priority;
      });
  }
}

export const providerPolicy = new ProviderPolicy();

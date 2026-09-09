import { supabase } from "@/integrations/supabase/client";
import type { GeocodedLocation } from "@/services/geocoding";
import type { MultiProviderSolarResource } from "@/services/solar-data/types";

export async function saveLocation(
  location: GeocodedLocation,
  resource: MultiProviderSolarResource | null,
) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user)
    return { error: { message: "Please sign in to save a location." } };
  const table = (
    supabase as unknown as {
      from: (name: string) => {
        insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
      };
    }
  ).from("saved_locations");
  return table.insert({
    user_id: userData.user.id,
    name: location.label,
    latitude: location.latitude,
    longitude: location.longitude,
    country: location.country ?? null,
    region: location.region ?? null,
    provider_metadata: resource ?? {},
  });
}

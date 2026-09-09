import { supabase } from "@/integrations/supabase/client";
import type { CalculationResult } from "./energy-calculation";
import type { ConfigurationResult } from "./system-configuration";

export interface AssessmentProjectInput {
  name: string;
  propertyType: string;
  country: string;
  location: string;
  systemType: string;
  appliances: unknown[];
  objective: string;
  backupHours: number;
  panelWatts: number;
  selectedRecommendationTier?: string;
  selectedConfigurationId?: string;
  configurationNotes?: string;
  locationName?: string | undefined;
  region?: string | undefined;
  latitude?: number | undefined;
  longitude?: number | undefined;
}

export async function saveAssessmentProject(
  assessment: AssessmentProjectInput,
  result: CalculationResult,
  configuration: ConfigurationResult,
) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user)
    return { data: null, error: { message: "Please sign in to save a project." } };
  const insert = (supabase as unknown as { from: (table: string) => unknown }).from(
    "solar_projects",
  ) as {
    insert: (row: Record<string, unknown>) => {
      select: (fields: string) => {
        single: () => Promise<{ data: unknown; error: { message: string } | null }>;
      };
    };
  };
  return insert
    .insert({
      user_id: userData.user.id,
      name: assessment.name || "Untitled solar project",
      status: "saved",
      property_type: assessment.propertyType,
      location: (assessment.locationName ?? assessment.location) || null,
      location_name: (assessment.locationName ?? assessment.location) || null,
      country: assessment.country || null,
      region: assessment.region ?? null,
      latitude: assessment.latitude ?? null,
      longitude: assessment.longitude ?? null,
      grid_availability: assessment.systemType,
      assessment_inputs: assessment,
      calculation_result: result,
      system_configuration: configuration,
      selected_recommendation_tier: assessment.selectedRecommendationTier ?? null,
      selected_panel_wattage: assessment.panelWatts || null,
      panel_quantity: assessment.selectedConfigurationId
        ? (configuration.configurations.find(
            (item) => item.id === assessment.selectedConfigurationId,
          )?.solarArray.panelQuantity ?? null)
        : result.recommendations.recommended.numberOfPanels,
      configuration_notes: assessment.configurationNotes ?? null,
    })
    .select("*")
    .single();
}

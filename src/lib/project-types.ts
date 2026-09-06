import type { CalculationResult } from "./energy-calculation";
import type { ConfigurationResult } from "./system-configuration";

export type ProjectStatus =
  "draft" | "calculated" | "saved" | "ready_for_quote" | "quoted" | "installation";

export interface SolarProjectRecord {
  id: string;
  user_id: string;
  name: string;
  status: ProjectStatus;
  property_type: string;
  location: string | null;
  grid_availability: string | null;
  assessment_inputs: Record<string, unknown>;
  calculation_result: CalculationResult;
  system_configuration: ConfigurationResult;
  selected_recommendation_tier: string | null;
  selected_panel_wattage: number | null;
  panel_quantity: number | null;
  configuration_notes: string | null;
  created_at: string;
  updated_at: string;
}

export function projectSummary(
  project: Pick<
    SolarProjectRecord,
    "calculation_result" | "system_configuration" | "selected_panel_wattage" | "panel_quantity"
  >,
) {
  const recommendation = project.calculation_result.recommendations.recommended;
  return {
    solarCapacityKWP: recommendation.solarArrayKWP,
    panelWattage:
      project.selected_panel_wattage ??
      project.calculation_result.panelAnalysis.selectedPanelWattage,
    panelQuantity: project.panel_quantity ?? recommendation.numberOfPanels,
    configuredSolarCapacityKWP:
      project.system_configuration.configurations.find(
        (item) => item.recommendationTier === "Recommended",
      )?.solarArray.configuredSolarCapacityKWP ?? recommendation.solarArrayKWP,
  };
}

import type { CalculationResult, Recommendation } from "./energy-calculation";
import type {
  BatteryModel,
  EquipmentCatalogue,
  InverterModel,
  SolarPanelModel,
} from "./equipment-catalogue";

export interface PanelConfiguration {
  model: SolarPanelModel;
  requiredSolarCapacityKWP: number;
  selectedPanelWattage: number;
  panelQuantity: number;
  configuredSolarCapacityKWP: number;
}

export interface BatteryConfiguration {
  model?: BatteryModel;
  unitCount: number;
  requiredInstalledCapacityKWh: number;
  configuredNominalCapacityKWh: number;
  configuredUsableCapacityKWh?: number;
}

export interface InverterConfiguration {
  model?: InverterModel;
  minimumRequiredKVA: number;
  preferredRequiredKVA: number;
  selectedCapacityKVA: number;
  meetsMinimumRequirement: boolean;
  meetsPreferredRequirement: boolean;
}

export interface SystemConfiguration {
  id: string;
  name: string;
  recommendationTier: Recommendation["name"];
  solarArray: PanelConfiguration;
  batteryBank: BatteryConfiguration;
  inverter: InverterConfiguration;
  compatibilityStatus: "compatible" | "review-required" | "no-compatible-inverter";
  warnings: string[];
  calculationComparison: {
    requiredBatteryCapacityKWh: number;
    configuredBatteryCapacityKWh: number;
    minimumInverterCapacityKVA: number;
    preferredInverterCapacityKVA: number;
    selectedInverterCapacityKVA: number;
  };
}

export interface PanelWattageComparison {
  panelWattage: number;
  requiredPanels: number;
  configuredCapacityKWP: number;
}

export interface ConfigurationResult {
  configurations: SystemConfiguration[];
  panelComparison: PanelWattageComparison[];
  warnings: string[];
}

function validWattage(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function calculatePanelConfiguration(
  requiredSolarCapacityKWP: number,
  panelWattage: number,
  model: SolarPanelModel,
): PanelConfiguration {
  const safeCapacity =
    Number.isFinite(requiredSolarCapacityKWP) && requiredSolarCapacityKWP > 0
      ? requiredSolarCapacityKWP
      : 0;
  const safeWattage = validWattage(panelWattage);
  const panelQuantity = safeWattage > 0 ? Math.ceil((safeCapacity * 1000) / safeWattage) : 0;
  return {
    model,
    requiredSolarCapacityKWP: safeCapacity,
    selectedPanelWattage: safeWattage,
    panelQuantity,
    configuredSolarCapacityKWP: (panelQuantity * safeWattage) / 1000,
  };
}

function selectBattery(
  requiredCapacityKWh: number,
  batteries: BatteryModel[],
): BatteryConfiguration {
  const candidates = batteries
    .filter((battery) => battery.status !== "inactive" && battery.nominalCapacityKWh > 0)
    .sort((a, b) => a.nominalCapacityKWh - b.nominalCapacityKWh);
  const model = candidates.find(
    (candidate) => candidate.expandable || candidate.nominalCapacityKWh >= requiredCapacityKWh,
  );
  if (!model || requiredCapacityKWh <= 0)
    return {
      unitCount: 0,
      requiredInstalledCapacityKWh: Math.max(0, requiredCapacityKWh),
      configuredNominalCapacityKWh: 0,
    };
  const unitCount = Math.max(1, Math.ceil(requiredCapacityKWh / model.nominalCapacityKWh));
  const withinLimit = model.maximumParallelUnits
    ? Math.min(unitCount, model.maximumParallelUnits)
    : unitCount;
  const configuration: BatteryConfiguration = {
    model,
    unitCount: withinLimit,
    requiredInstalledCapacityKWh: requiredCapacityKWh,
    configuredNominalCapacityKWh: withinLimit * model.nominalCapacityKWh,
  };
  if (model.usableCapacityKWh !== undefined) {
    configuration.configuredUsableCapacityKWh = withinLimit * model.usableCapacityKWh;
  }
  return configuration;
}

function batteryVoltageCompatible(battery: BatteryModel | undefined, inverter: InverterModel) {
  if (!battery || !inverter.batteryVoltageCompatibility?.length) return true;
  return inverter.batteryVoltageCompatibility.some(
    (voltage) => Math.abs(voltage - battery.nominalVoltage) <= 2,
  );
}

function selectInverter(
  result: CalculationResult,
  inverters: InverterModel[],
  battery: BatteryConfiguration,
): InverterConfiguration {
  const minimumRequiredKVA = result.inverterAnalysis.minimumInverterKVA;
  const preferredRequiredKVA = result.inverterAnalysis.preferredInverterKVA;
  const candidates = inverters
    .filter(
      (inverter) =>
        inverter.status !== "inactive" &&
        (inverter.ratedPowerKVA ?? inverter.ratedPowerKW) >= minimumRequiredKVA &&
        batteryVoltageCompatible(battery.model, inverter),
    )
    .sort((a, b) => (a.ratedPowerKVA ?? a.ratedPowerKW) - (b.ratedPowerKVA ?? b.ratedPowerKW));
  const model =
    candidates.find(
      (candidate) => (candidate.ratedPowerKVA ?? candidate.ratedPowerKW) >= preferredRequiredKVA,
    ) ?? candidates[0];
  const selectedCapacityKVA = model?.ratedPowerKVA ?? model?.ratedPowerKW ?? 0;
  const configuration: InverterConfiguration = {
    minimumRequiredKVA,
    preferredRequiredKVA,
    selectedCapacityKVA,
    meetsMinimumRequirement: selectedCapacityKVA >= minimumRequiredKVA,
    meetsPreferredRequirement: selectedCapacityKVA >= preferredRequiredKVA,
  };
  if (model) configuration.model = model;
  return configuration;
}

export function generateSystemConfigurations(
  result: CalculationResult,
  panelWattage: number,
  catalogue: EquipmentCatalogue,
): ConfigurationResult {
  const warnings: string[] = ["Configuration uses default equipment reference data."];
  const panelComparison = [450, 500, 550, 600, panelWattage]
    .filter(
      (wattage, index, values) => validWattage(wattage) > 0 && values.indexOf(wattage) === index,
    )
    .map((wattage) => ({
      panelWattage: wattage,
      requiredPanels: Math.ceil(
        (result.recommendations.recommended.solarArrayKWP * 1000) / wattage,
      ),
      configuredCapacityKWP:
        (Math.ceil((result.recommendations.recommended.solarArrayKWP * 1000) / wattage) * wattage) /
        1000,
    }));
  const tiers: Array<[Recommendation["name"], Recommendation]> = [
    ["Essential", result.recommendations.essential],
    ["Recommended", result.recommendations.recommended],
    ["Extended", result.recommendations.extended],
  ];
  const configurations = tiers.map(([tier, recommendation]) => {
    const panelModel =
      catalogue.panels.find((panel) => panel.ratedPowerWatts === validWattage(panelWattage)) ??
      catalogue.panels.find(
        (panel) => panel.ratedPowerWatts === result.panelAnalysis.selectedPanelWattage,
      ) ??
      catalogue.panels[0];
    const solarArray = panelModel
      ? calculatePanelConfiguration(
          recommendation.solarArrayKWP,
          panelModel.ratedPowerWatts,
          panelModel,
        )
      : {
          model: undefined as unknown as SolarPanelModel,
          requiredSolarCapacityKWP: recommendation.solarArrayKWP,
          selectedPanelWattage: 0,
          panelQuantity: 0,
          configuredSolarCapacityKWP: 0,
        };
    const batteryBank = selectBattery(recommendation.batteryCapacityKWh, catalogue.batteries);
    const inverter = selectInverter(result, catalogue.inverters, batteryBank);
    const configurationWarnings: string[] = [];
    if (
      solarArray.panelQuantity > 0 &&
      solarArray.configuredSolarCapacityKWP > solarArray.requiredSolarCapacityKWP
    )
      configurationWarnings.push(
        "Panel quantity was rounded up so configured solar capacity meets the requirement.",
      );
    if (batteryBank.configuredNominalCapacityKWh < batteryBank.requiredInstalledCapacityKWh)
      configurationWarnings.push(
        "No battery configuration in the reference catalogue meets the required nominal capacity.",
      );
    if (!inverter.model)
      configurationWarnings.push(
        "No compatible inverter was found in the current reference catalogue.",
      );
    if (inverter.model && !inverter.meetsPreferredRequirement)
      configurationWarnings.push(
        "Selected inverter meets the minimum requirement but not the preferred capacity.",
      );
    const compatibilityStatus: SystemConfiguration["compatibilityStatus"] = !inverter.model
      ? "no-compatible-inverter"
      : inverter.model &&
          batteryBank.model &&
          !batteryVoltageCompatible(batteryBank.model, inverter.model)
        ? "review-required"
        : "compatible";
    return {
      id: `configuration-${tier.toLowerCase()}`,
      name: `${tier} reference configuration`,
      recommendationTier: tier,
      solarArray,
      batteryBank,
      inverter,
      compatibilityStatus,
      warnings: configurationWarnings,
      calculationComparison: {
        requiredBatteryCapacityKWh: recommendation.batteryCapacityKWh,
        configuredBatteryCapacityKWh: batteryBank.configuredNominalCapacityKWh,
        minimumInverterCapacityKVA: result.inverterAnalysis.minimumInverterKVA,
        preferredInverterCapacityKVA: result.inverterAnalysis.preferredInverterKVA,
        selectedInverterCapacityKVA: inverter.selectedCapacityKVA,
      },
    };
  });
  if (!panelWattage || !Number.isFinite(panelWattage) || panelWattage <= 0)
    warnings.push("Select a valid panel wattage to generate a panel configuration.");
  return { configurations, panelComparison, warnings };
}

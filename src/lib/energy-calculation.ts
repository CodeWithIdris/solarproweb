export const OBJECTIVES = [
  "Reduce electricity costs",
  "Backup essential appliances",
  "Power most of the property",
  "High energy independence",
  "Reduce generator dependence",
  "Custom requirement",
] as const;

export type Objective = (typeof OBJECTIVES)[number];
export type SurgeClassification = "none" | "low" | "moderate" | "medium" | "high" | "custom";
export type AppliancePriority = "essential" | "important" | "flexible";

export interface CalculationAppliance {
  id: string;
  name: string;
  watts: number;
  quantity: number;
  hours: number;
  backup: boolean;
  peak: boolean;
  surge: SurgeClassification;
  priority?: AppliancePriority;
  surgeMultiplier?: number;
}

export interface AssessmentCalculationInput {
  appliances: CalculationAppliance[];
  objective: Objective | string;
  backupHours: number;
  panelWatts: number;
  assumptions?: Partial<CalculationAssumptions>;
}

export interface CalculationAssumptions {
  daysPerMonth: number;
  batteryDepthOfDischarge: number;
  batterySystemEfficiency: number;
  peakSunHours: number;
  solarPerformanceFactor: number;
  inverterDesignMargin: number;
  inverterPowerFactor: number;
  objectiveCoverage: Record<string, number>;
  tierFactors: {
    essential: { solar: number; battery: number; inverter: number; coverage: number };
    recommended: { solar: number; battery: number; inverter: number; coverage: number };
    extended: { solar: number; battery: number; inverter: number; coverage: number };
  };
  surgeMultipliers: Record<SurgeClassification, number>;
}

export interface Recommendation {
  name: "Essential" | "Recommended" | "Extended";
  batteryCapacityKWh: number;
  inverterCapacityKVA: number;
  solarArrayKWP: number;
  numberOfPanels: number;
  targetEnergyCoverage: number;
  backupDurationHours: number;
  assumptions: CalculationAssumptions;
  basis: string;
}

export interface CalculationResult {
  energyProfile: {
    dailyEnergyKWh: number;
    monthlyEnergyKWh: number;
    daysPerMonth: number;
  };
  loadAnalysis: {
    totalConnectedLoadWatts: number;
    totalConnectedLoadKW: number;
    peakSimultaneousLoadWatts: number;
    peakSimultaneousLoadKW: number;
    applianceEnergy: Array<{
      id: string;
      connectedLoadWatts: number;
      dailyEnergyWh: number;
      backupEnergyWh: number;
      peakLoadWatts: number;
    }>;
  };
  backupAnalysis: {
    backupDailyEnergyKWh: number;
    energyRequiredDuringBackupKWh: number;
    backupDurationHours: number;
    requiredUsableBatteryStorageKWh: number;
    estimatedInstalledBatteryCapacityKWh: number;
  };
  inverterAnalysis: {
    continuousLoadKW: number;
    designMargin: number;
    powerFactorAssumption: number;
    surgeRequirementKW: number;
    minimumInverterKVA: number;
    preferredInverterKVA: number;
  };
  solarAnalysis: {
    dailyEnergyTargetedKWh: number;
    objectiveCoverage: number;
    peakSunHours: number;
    performanceFactor: number;
    requiredSolarArrayKWP: number;
  };
  panelAnalysis: { selectedPanelWattage: number; requiredNumberOfPanels: number };
  recommendations: {
    essential: Recommendation;
    recommended: Recommendation;
    extended: Recommendation;
  };
  assumptions: CalculationAssumptions;
  methodology: string[];
  warnings: string[];
}

export const DEFAULT_CALCULATION_ASSUMPTIONS: CalculationAssumptions = {
  daysPerMonth: 30,
  batteryDepthOfDischarge: 0.8,
  batterySystemEfficiency: 0.92,
  peakSunHours: 4.5,
  solarPerformanceFactor: 0.8,
  inverterDesignMargin: 0.25,
  inverterPowerFactor: 0.9,
  objectiveCoverage: {
    "Reduce electricity costs": 0.7,
    "Backup essential appliances": 0.85,
    "Power most of the property": 1,
    "High energy independence": 1.15,
    "Reduce generator dependence": 1,
    "Custom requirement": 0.9,
  },
  tierFactors: {
    essential: { solar: 0.75, battery: 0.75, inverter: 0.85, coverage: 0.75 },
    recommended: { solar: 1, battery: 1, inverter: 1, coverage: 1 },
    extended: { solar: 1.3, battery: 1.5, inverter: 1.2, coverage: 1 },
  },
  surgeMultipliers: { none: 1, low: 1.25, moderate: 1.5, medium: 1.5, high: 2, custom: 1 },
};

function finiteNonNegative(value: number, fallback = 0) {
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function positive(value: number, fallback: number) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function mergeAssumptions(overrides?: Partial<CalculationAssumptions>): CalculationAssumptions {
  return {
    ...DEFAULT_CALCULATION_ASSUMPTIONS,
    ...overrides,
    objectiveCoverage: {
      ...DEFAULT_CALCULATION_ASSUMPTIONS.objectiveCoverage,
      ...overrides?.objectiveCoverage,
    },
    tierFactors: { ...DEFAULT_CALCULATION_ASSUMPTIONS.tierFactors, ...overrides?.tierFactors },
    surgeMultipliers: {
      ...DEFAULT_CALCULATION_ASSUMPTIONS.surgeMultipliers,
      ...overrides?.surgeMultipliers,
    },
  };
}

function safeAppliance(appliance: CalculationAppliance, warnings: string[]) {
  const watts = finiteNonNegative(appliance.watts);
  const quantity = finiteNonNegative(appliance.quantity);
  const hours = finiteNonNegative(appliance.hours);
  if (
    !Number.isFinite(appliance.watts) ||
    !Number.isFinite(appliance.quantity) ||
    !Number.isFinite(appliance.hours)
  ) {
    warnings.push(`${appliance.name}: non-finite values were treated as zero.`);
  }
  if (appliance.watts < 0 || appliance.quantity < 0 || appliance.hours < 0)
    warnings.push(`${appliance.name}: negative values were treated as zero.`);
  if (appliance.hours > 24)
    warnings.push(`${appliance.name}: usage above 24 hours/day was capped at 24.`);
  if (quantity === 0) warnings.push(`${appliance.name}: zero quantity contributes no load.`);
  if (watts === 0) warnings.push(`${appliance.name}: zero power contributes no load.`);
  return { ...appliance, watts, quantity, hours: Math.min(hours, 24) };
}

export function calculateEnergyAssessment(input: AssessmentCalculationInput): CalculationResult {
  const warnings: string[] = [];
  const assumptions = mergeAssumptions(input.assumptions);
  const appliances = (input.appliances ?? []).map((appliance) =>
    safeAppliance(appliance, warnings),
  );
  const backupHours = positive(input.backupHours, 0);
  const panelWatts = positive(input.panelWatts, 0);
  const validBackupHours = Math.min(backupHours, 24);
  if (!Number.isFinite(input.backupHours) || input.backupHours <= 0)
    warnings.push("Backup duration must be greater than zero.");
  if (input.backupHours > 24)
    warnings.push("Backup duration above 24 hours was capped at 24 hours for this assessment.");
  if (panelWatts === 0)
    warnings.push("A valid panel wattage is required to calculate panel quantity.");
  if (appliances.length === 0) warnings.push("No appliances have been selected.");
  warnings.push("This recommendation uses default solar generation assumptions.");

  const applianceEnergy = appliances.map((appliance) => {
    const connectedLoadWatts = appliance.watts * appliance.quantity;
    const dailyEnergyWh = connectedLoadWatts * appliance.hours;
    const normalizedBackupEnergyWh = appliance.backup
      ? connectedLoadWatts * Math.min(appliance.hours, validBackupHours)
      : 0;
    const peakLoadWatts = appliance.peak ? connectedLoadWatts : 0;
    return {
      id: appliance.id,
      connectedLoadWatts,
      dailyEnergyWh,
      backupEnergyWh: normalizedBackupEnergyWh,
      peakLoadWatts,
    };
  });
  const totalConnectedLoadWatts = applianceEnergy.reduce(
    (sum, item) => sum + item.connectedLoadWatts,
    0,
  );
  const dailyEnergyWh = applianceEnergy.reduce((sum, item) => sum + item.dailyEnergyWh, 0);
  const backupDailyEnergyWh = applianceEnergy.reduce(
    (sum, item) =>
      sum +
      (appliances.find((appliance) => appliance.id === item.id)?.backup ? item.dailyEnergyWh : 0),
    0,
  );
  const energyRequiredDuringBackupWh = applianceEnergy.reduce(
    (sum, item) => sum + item.backupEnergyWh,
    0,
  );
  const peakSimultaneousLoadWatts = applianceEnergy.reduce(
    (sum, item) => sum + item.peakLoadWatts,
    0,
  );
  if (backupDailyEnergyWh === 0) warnings.push("No appliances have been selected for backup.");
  if (peakSimultaneousLoadWatts === 0)
    warnings.push("No appliances have been included in simultaneous demand.");

  const surgeRequirementWatts = appliances
    .filter((appliance) => appliance.peak)
    .reduce((sum, appliance) => {
      const multiplier =
        appliance.surgeMultiplier ?? assumptions.surgeMultipliers[appliance.surge] ?? 1;
      return sum + appliance.watts * appliance.quantity * Math.max(1, multiplier);
    }, 0);
  const continuousLoadKW = peakSimultaneousLoadWatts / 1000;
  const surgeRequirementKW = surgeRequirementWatts / 1000;
  const minimumInverterKVA =
    (continuousLoadKW * (1 + assumptions.inverterDesignMargin)) / assumptions.inverterPowerFactor;
  const preferredInverterKVA = Math.max(
    minimumInverterKVA,
    surgeRequirementKW / assumptions.inverterPowerFactor,
  );
  const objectiveCoverage = Math.max(
    0,
    assumptions.objectiveCoverage[input.objective] ??
      assumptions.objectiveCoverage["Custom requirement"] ??
      0.9,
  );
  const dailyEnergyTargetedKWh = (dailyEnergyWh / 1000) * objectiveCoverage;
  const requiredSolarArrayKWP =
    dailyEnergyTargetedKWh /
    Math.max(assumptions.peakSunHours * assumptions.solarPerformanceFactor, Number.EPSILON);
  const requiredUsableBatteryStorageKWh = energyRequiredDuringBackupWh / 1000;
  const estimatedInstalledBatteryCapacityKWh =
    requiredUsableBatteryStorageKWh /
    Math.max(
      assumptions.batteryDepthOfDischarge * assumptions.batterySystemEfficiency,
      Number.EPSILON,
    );
  const base = {
    solar: requiredSolarArrayKWP,
    battery: estimatedInstalledBatteryCapacityKWh,
    inverter: preferredInverterKVA,
  };
  const makeRecommendation = (
    name: Recommendation["name"],
    factor: CalculationAssumptions["tierFactors"]["essential"],
    basis: string,
  ): Recommendation => ({
    name,
    batteryCapacityKWh: base.battery * factor.battery,
    inverterCapacityKVA: base.inverter * factor.inverter,
    solarArrayKWP: base.solar * factor.solar,
    numberOfPanels: panelWatts > 0 ? Math.ceil((base.solar * factor.solar * 1000) / panelWatts) : 0,
    targetEnergyCoverage: objectiveCoverage * factor.coverage,
    backupDurationHours: validBackupHours,
    assumptions,
    basis,
  });

  return {
    energyProfile: {
      dailyEnergyKWh: dailyEnergyWh / 1000,
      monthlyEnergyKWh: (dailyEnergyWh / 1000) * assumptions.daysPerMonth,
      daysPerMonth: assumptions.daysPerMonth,
    },
    loadAnalysis: {
      totalConnectedLoadWatts,
      totalConnectedLoadKW: totalConnectedLoadWatts / 1000,
      peakSimultaneousLoadWatts,
      peakSimultaneousLoadKW: continuousLoadKW,
      applianceEnergy,
    },
    backupAnalysis: {
      backupDailyEnergyKWh: backupDailyEnergyWh / 1000,
      energyRequiredDuringBackupKWh: requiredUsableBatteryStorageKWh,
      backupDurationHours: validBackupHours,
      requiredUsableBatteryStorageKWh,
      estimatedInstalledBatteryCapacityKWh,
    },
    inverterAnalysis: {
      continuousLoadKW,
      designMargin: assumptions.inverterDesignMargin,
      powerFactorAssumption: assumptions.inverterPowerFactor,
      surgeRequirementKW,
      minimumInverterKVA,
      preferredInverterKVA,
    },
    solarAnalysis: {
      dailyEnergyTargetedKWh,
      objectiveCoverage,
      peakSunHours: assumptions.peakSunHours,
      performanceFactor: assumptions.solarPerformanceFactor,
      requiredSolarArrayKWP,
    },
    panelAnalysis: {
      selectedPanelWattage: panelWatts,
      requiredNumberOfPanels:
        panelWatts > 0 ? Math.ceil((requiredSolarArrayKWP * 1000) / panelWatts) : 0,
    },
    recommendations: {
      essential: makeRecommendation(
        "Essential",
        assumptions.tierFactors.essential,
        "Critical and selected backup loads",
      ),
      recommended: makeRecommendation(
        "Recommended",
        assumptions.tierFactors.recommended,
        "Balanced around the selected objective",
      ),
      extended: makeRecommendation(
        "Extended",
        assumptions.tierFactors.extended,
        "Additional autonomy and inverter headroom",
      ),
    },
    assumptions,
    methodology: [
      "Connected load = power rating × quantity.",
      "Daily energy = power rating × quantity × daily usage hours.",
      "Backup-period energy = backup load × the lesser of daily usage hours and selected backup duration.",
      "Installed battery = backup-period energy ÷ (depth of discharge × system efficiency).",
      "Solar array = targeted daily energy ÷ (peak sun hours × performance factor).",
    ],
    warnings: [...new Set(warnings)],
  };
}

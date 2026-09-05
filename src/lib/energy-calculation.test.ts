import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateEnergyAssessment,
  type AssessmentCalculationInput,
} from "./energy-calculation.ts";

const baseInput: AssessmentCalculationInput = {
  objective: "Power most of the property",
  backupHours: 8,
  panelWatts: 500,
  appliances: [
    {
      id: "fridge",
      name: "Refrigerator",
      watts: 200,
      quantity: 1,
      hours: 10,
      backup: true,
      peak: true,
      surge: "high",
    },
    {
      id: "lamp",
      name: "Lamp",
      watts: 50,
      quantity: 2,
      hours: 5,
      backup: true,
      peak: false,
      surge: "none",
    },
    {
      id: "tv",
      name: "Television",
      watts: 100,
      quantity: 1,
      hours: 4,
      backup: false,
      peak: true,
      surge: "none",
    },
  ],
};

function calculate(overrides: Partial<AssessmentCalculationInput> = {}) {
  return calculateEnergyAssessment({ ...baseInput, ...overrides });
}

test("calculates connected load in watts and kilowatts", () => {
  const result = calculate();
  assert.equal(result.loadAnalysis.totalConnectedLoadWatts, 400);
  assert.equal(result.loadAnalysis.totalConnectedLoadKW, 0.4);
});

test("calculates daily and configurable monthly energy", () => {
  const result = calculate({ assumptions: { daysPerMonth: 31 } });
  assert.equal(result.energyProfile.dailyEnergyKWh, 2.9);
  assert.ok(Math.abs(result.energyProfile.monthlyEnergyKWh - 89.9) < 1e-9);
});

test("filters backup energy and applies the selected outage duration", () => {
  const result = calculate();
  assert.equal(result.backupAnalysis.backupDailyEnergyKWh, 2.5);
  assert.equal(result.backupAnalysis.energyRequiredDuringBackupKWh, 2.1);
  assert.equal(result.backupAnalysis.estimatedInstalledBatteryCapacityKWh, 2.1 / (0.8 * 0.92));
});

test("filters peak simultaneous load", () => {
  const result = calculate();
  assert.equal(result.loadAnalysis.peakSimultaneousLoadWatts, 300);
  assert.equal(result.loadAnalysis.peakSimultaneousLoadKW, 0.3);
});

test("exposes explicit surge and inverter sizing", () => {
  const result = calculate();
  assert.equal(result.inverterAnalysis.surgeRequirementKW, 0.5);
  assert.equal(result.inverterAnalysis.continuousLoadKW, 0.3);
  assert.equal(result.inverterAnalysis.minimumInverterKVA, (0.3 * 1.25) / 0.9);
  assert.equal(result.inverterAnalysis.preferredInverterKVA, 0.5 / 0.9);
});

test("calculates solar array and rounds panel quantity up", () => {
  const result = calculate();
  assert.equal(result.solarAnalysis.requiredSolarArrayKWP, 2.9 / (4.5 * 0.8));
  assert.equal(result.panelAnalysis.requiredNumberOfPanels, 2);
});

test("returns structured, ordered recommendation tiers", () => {
  const result = calculate();
  const tiers = [
    result.recommendations.essential,
    result.recommendations.recommended,
    result.recommendations.extended,
  ];
  assert.deepEqual(
    tiers.map((tier) => tier.name),
    ["Essential", "Recommended", "Extended"],
  );
  assert.ok(tiers[0]!.solarArrayKWP < tiers[1]!.solarArrayKWP);
  assert.ok(tiers[1]!.solarArrayKWP < tiers[2]!.solarArrayKWP);
  assert.ok(tiers[0]!.numberOfPanels <= tiers[1]!.numberOfPanels);
  assert.ok(tiers[1]!.numberOfPanels <= tiers[2]!.numberOfPanels);
});

test("handles empty and missing selections with finite zero results and warnings", () => {
  const result = calculate({ appliances: [], panelWatts: 0, backupHours: 0 });
  assert.equal(result.energyProfile.dailyEnergyKWh, 0);
  assert.equal(result.panelAnalysis.requiredNumberOfPanels, 0);
  assert.ok(result.warnings.includes("No appliances have been selected."));
  assert.ok(result.warnings.includes("No appliances have been selected for backup."));
  assert.ok(result.warnings.includes("No appliances have been included in simultaneous demand."));
  assert.ok(
    result.warnings.includes("A valid panel wattage is required to calculate panel quantity."),
  );
});

test("normalizes invalid values without NaN, Infinity, or negative capacities", () => {
  const result = calculate({
    backupHours: 48,
    appliances: [
      {
        id: "bad",
        name: "Invalid",
        watts: -10,
        quantity: 0,
        hours: 30,
        backup: true,
        peak: true,
        surge: "high",
      },
    ],
  });
  const values = [
    result.energyProfile.dailyEnergyKWh,
    result.backupAnalysis.estimatedInstalledBatteryCapacityKWh,
    result.inverterAnalysis.preferredInverterKVA,
    result.solarAnalysis.requiredSolarArrayKWP,
  ];
  assert.ok(values.every((value) => Number.isFinite(value) && value >= 0));
  assert.ok(result.warnings.some((warning) => warning.includes("capped")));
});

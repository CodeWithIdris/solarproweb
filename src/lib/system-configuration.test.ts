import assert from "node:assert/strict";
import test from "node:test";
import { calculateEnergyAssessment } from "./energy-calculation.ts";
import { REFERENCE_EQUIPMENT_CATALOGUE } from "./equipment-catalogue.ts";
import {
  calculatePanelConfiguration,
  generateSystemConfigurations,
} from "./system-configuration.ts";

const result = calculateEnergyAssessment({
  objective: "Power most of the property",
  backupHours: 8,
  panelWatts: 550,
  appliances: [
    {
      id: "load",
      name: "Load",
      watts: 4400,
      quantity: 1,
      hours: 1,
      backup: true,
      peak: true,
      surge: "none",
    },
  ],
});

const panel = REFERENCE_EQUIPMENT_CATALOGUE.panels.find((item) => item.ratedPowerWatts === 550)!;

test("calculates exact panel division", () => {
  const configuration = calculatePanelConfiguration(4.4, 550, panel);
  assert.equal(configuration.panelQuantity, 8);
  assert.equal(configuration.configuredSolarCapacityKWP, 4.4);
});

test("rounds panel quantity upward and reports configured capacity", () => {
  const configuration = calculatePanelConfiguration(
    4.4,
    600,
    REFERENCE_EQUIPMENT_CATALOGUE.panels.find((item) => item.ratedPowerWatts === 600)!,
  );
  assert.equal(configuration.panelQuantity, 8);
  assert.equal(configuration.configuredSolarCapacityKWP, 4.8);
});

test("supports custom panel wattage and rejects invalid wattage without non-finite values", () => {
  const custom = calculatePanelConfiguration(4.4, 545, panel);
  const invalid = calculatePanelConfiguration(4.4, 0, panel);
  assert.equal(custom.panelQuantity, 9);
  assert.equal(custom.configuredSolarCapacityKWP, 4.905);
  assert.equal(invalid.panelQuantity, 0);
  assert.ok(Number.isFinite(invalid.configuredSolarCapacityKWP));
});

test("generates independent panel quantities for every recommendation tier", () => {
  const configurations = generateSystemConfigurations(
    result,
    550,
    REFERENCE_EQUIPMENT_CATALOGUE,
  ).configurations;
  for (const configuration of configurations) {
    assert.equal(
      configuration.solarArray.panelQuantity,
      Math.ceil((configuration.solarArray.requiredSolarCapacityKWP * 1000) / 550),
    );
    assert.ok(
      configuration.solarArray.configuredSolarCapacityKWP >=
        configuration.solarArray.requiredSolarCapacityKWP,
    );
  }
});

test("compares common panel wattages dynamically", () => {
  const comparison = generateSystemConfigurations(
    result,
    550,
    REFERENCE_EQUIPMENT_CATALOGUE,
  ).panelComparison;
  assert.deepEqual(
    comparison.map((item) => item.panelWattage),
    [450, 500, 550, 600],
  );
  assert.ok(
    comparison.every(
      (item) => item.configuredCapacityKWP >= result.recommendations.recommended.solarArrayKWP,
    ),
  );
});

test("selects a battery combination that meets the required nominal capacity", () => {
  const configuration = generateSystemConfigurations(
    result,
    550,
    REFERENCE_EQUIPMENT_CATALOGUE,
  ).configurations.find((item) => item.recommendationTier === "Recommended")!;
  assert.ok(configuration.batteryBank.unitCount > 0);
  assert.ok(
    configuration.batteryBank.configuredNominalCapacityKWh >=
      configuration.batteryBank.requiredInstalledCapacityKWh,
  );
  assert.ok((configuration.batteryBank.configuredUsableCapacityKWh ?? 0) > 0);
});

test("filters for compatible preferred inverter capacity", () => {
  const configuration = generateSystemConfigurations(
    result,
    550,
    REFERENCE_EQUIPMENT_CATALOGUE,
  ).configurations.find((item) => item.recommendationTier === "Recommended")!;
  assert.equal(configuration.compatibilityStatus, "compatible");
  assert.equal(configuration.inverter.meetsMinimumRequirement, true);
  assert.equal(configuration.inverter.meetsPreferredRequirement, true);
});

test("returns structured no-equipment warnings", () => {
  const empty = generateSystemConfigurations(result, 0, {
    panels: [],
    batteries: [],
    inverters: [],
  });
  assert.equal(empty.configurations[0]!.compatibilityStatus, "no-compatible-inverter");
  assert.ok(empty.warnings.some((warning) => warning.includes("valid panel wattage")));
  assert.ok(
    empty.configurations[0]!.warnings.some((warning) => warning.includes("No compatible inverter")),
  );
});

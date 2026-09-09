import assert from "node:assert/strict";
import test from "node:test";
import { CLASSIFICATION_LABEL, isCacheableAsResource, isTelemetry } from "./classification.ts";
import { ProviderPolicy, createDefaultRegistrations } from "./provider-policy.ts";
import { FleetService } from "./fleet-service.ts";
import { DEMO_SITES } from "./site-catalogue.ts";
import { parseCoordinateQuery } from "../geocoding/geocoding-service.ts";

test("classification labels stay honest about what the data is", () => {
  assert.match(CLASSIFICATION_LABEL.modelled_resource, /modelled/i);
  assert.match(CLASSIFICATION_LABEL.estimated_generation, /estimated/i);
  assert.match(CLASSIFICATION_LABEL.satellite_reanalysis, /reanalysis/i);
  assert.equal(isTelemetry("live_telemetry"), true);
  assert.equal(isTelemetry("historical_telemetry"), true);
  assert.equal(isTelemetry("modelled_resource"), false);
  assert.equal(isTelemetry("estimated_generation"), false);
  assert.equal(isTelemetry("demo"), false);
  assert.equal(isCacheableAsResource("modelled_resource"), true);
  assert.equal(isCacheableAsResource("unavailable"), false);
});

test("provider policy selects by coverage, dataset and credentials", () => {
  const policy = new ProviderPolicy(createDefaultRegistrations());
  const inCoverage = policy.select({
    location: { latitude: 10.5, longitude: 7.4 },
    dataset: "resource",
  });
  assert.equal(inCoverage[0]?.id, "pvgis");

  const outsideCoverage = policy.select({
    location: { latitude: -80, longitude: 20 },
    dataset: "resource",
  });
  assert.ok(!outsideCoverage.some((entry) => entry.id === "pvgis"));
  assert.ok(outsideCoverage.some((entry) => entry.id === "nasa-power"));

  const telemetry = policy.select({
    location: { latitude: 10.5, longitude: 7.4 },
    dataset: "telemetry",
  });
  assert.equal(telemetry.length, 0);
});

test("demo sites use real coordinates and claim no telemetry, status or alerts", () => {
  for (const site of DEMO_SITES) {
    assert.ok(Math.abs(site.latitude) <= 90);
    assert.ok(Math.abs(site.longitude) <= 180);
    assert.equal(site.siteType, "demo");
    assert.equal(site.telemetryStatus, "not_connected");
    assert.equal(site.status, "not_connected");
    assert.equal("openAlerts" in site, false);
    assert.equal("performanceRatio" in site, false);
  }
});

test("fleet rows report unavailable instead of inventing generation", async () => {
  const service = new FleetService({
    getInsight: async () => ({
      place: { name: "x", latitude: 1, longitude: 1 },
      telemetry: { status: "not_connected", state: "not_connected", message: "" },
      providerLog: [{ provider: "pvgis", dataset: "performance", outcome: "error" }],
      retrievedAt: new Date().toISOString(),
    }),
  } as never);
  const rows = await service.getRows(DEMO_SITES.slice(0, 1));
  assert.equal(rows[0]?.expectedEnergyTodayKWh, undefined);
  assert.equal(rows[0]?.expectedEnergyClassification, "unavailable");
  assert.equal(rows[0]?.expectedEnergyState, "provider_error");
});

test("fleet rows carry the provider classification when data is returned", async () => {
  const service = new FleetService({
    getInsight: async () => ({
      place: { name: "x", latitude: 1, longitude: 1 },
      performance: {
        state: "available",
        data: {
          expectedDailyGenerationKWh: 42,
          expectedMonthlyGenerationKWh: 1200,
          expectedAnnualGenerationKWh: 15000,
          installedCapacityKW: 10,
          source: {
            provider: "pvgis",
            providerLabel: "PVGIS",
            dataType: "estimated_generation",
            retrievedAt: new Date().toISOString(),
          },
        },
      },
      telemetry: { status: "not_connected", state: "not_connected", message: "" },
      providerLog: [],
      retrievedAt: new Date().toISOString(),
    }),
  } as never);
  const rows = await service.getRows(DEMO_SITES.slice(0, 1));
  assert.equal(rows[0]?.expectedEnergyTodayKWh, 42);
  assert.equal(rows[0]?.expectedEnergyClassification, "estimated_generation");
  assert.equal(rows[0]?.providerLabel, "PVGIS");
});

test("coordinate search never invents coordinates", () => {
  assert.deepEqual(parseCoordinateQuery("40.7128, -74.0060")?.latitude, 40.7128);
  assert.equal(parseCoordinateQuery("120, 20"), undefined);
  assert.equal(parseCoordinateQuery("Kaduna"), undefined);
});

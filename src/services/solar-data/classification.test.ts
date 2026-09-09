import { describe, expect, it, vi } from "vitest";
import {
  CLASSIFICATION_LABEL,
  isCacheableAsResource,
  isTelemetry,
} from "./classification.ts";
import { ProviderPolicy, createDefaultRegistrations } from "./provider-policy.ts";
import { FleetService } from "./fleet-service.ts";
import { DEMO_SITES } from "./site-catalogue.ts";
import { parseCoordinateQuery } from "@/services/geocoding/geocoding-service";

describe("data classification", () => {
  it("labels modelled and estimated data honestly", () => {
    expect(CLASSIFICATION_LABEL.modelled_resource).toMatch(/Modelled/i);
    expect(CLASSIFICATION_LABEL.estimated_generation).toMatch(/Estimated/i);
    expect(CLASSIFICATION_LABEL.satellite_reanalysis).toMatch(/reanalysis/i);
  });

  it("treats only telemetry classifications as telemetry", () => {
    expect(isTelemetry("live_telemetry")).toBe(true);
    expect(isTelemetry("historical_telemetry")).toBe(true);
    expect(isTelemetry("modelled_resource")).toBe(false);
    expect(isTelemetry("estimated_generation")).toBe(false);
    expect(isTelemetry("demo")).toBe(false);
  });

  it("does not cache unavailable data as resource data", () => {
    expect(isCacheableAsResource("modelled_resource")).toBe(true);
    expect(isCacheableAsResource("unavailable")).toBe(false);
  });
});

describe("provider policy", () => {
  const policy = new ProviderPolicy(createDefaultRegistrations());

  it("prefers PVGIS for modelled resource inside its coverage", () => {
    const candidates = policy.select({
      location: { latitude: 10.5, longitude: 7.4 },
      dataset: "resource",
    });
    expect(candidates[0]?.id).toBe("pvgis");
  });

  it("falls back to NASA POWER outside PVGIS coverage", () => {
    const candidates = policy.select({
      location: { latitude: -80, longitude: 20 },
      dataset: "resource",
    });
    expect(candidates.map((entry) => entry.id)).not.toContain("pvgis");
    expect(candidates.map((entry) => entry.id)).toContain("nasa-power");
  });

  it("never selects a credentialled provider without a connection", () => {
    const candidates = policy.select({
      location: { latitude: 10.5, longitude: 7.4 },
      dataset: "telemetry",
    });
    expect(candidates).toHaveLength(0);
  });
});

describe("demo sites", () => {
  it("carry real coordinates and never claim telemetry or alerts", () => {
    for (const site of DEMO_SITES) {
      expect(Math.abs(site.latitude)).toBeLessThanOrEqual(90);
      expect(Math.abs(site.longitude)).toBeLessThanOrEqual(180);
      expect(site.siteType).toBe("demo");
      expect(site.telemetryStatus).toBe("not_connected");
      expect(site.status).toBe("not_connected");
      expect(site).not.toHaveProperty("openAlerts");
      expect(site).not.toHaveProperty("performanceRatio");
    }
  });
});

describe("fleet rows", () => {
  it("reports unavailable rather than inventing generation when providers fail", async () => {
    const insights = {
      getInsight: vi.fn().mockResolvedValue({
        place: { name: "x", latitude: 1, longitude: 1 },
        telemetry: { status: "not_connected", state: "not_connected", message: "" },
        providerLog: [{ provider: "pvgis", dataset: "performance", outcome: "error" }],
        retrievedAt: new Date().toISOString(),
      }),
    };
    const service = new FleetService(insights as never);
    const rows = await service.getRows(DEMO_SITES.slice(0, 1));
    expect(rows[0]?.expectedEnergyTodayKWh).toBeUndefined();
    expect(rows[0]?.expectedEnergyClassification).toBe("unavailable");
    expect(rows[0]?.expectedEnergyState).toBe("provider_error");
  });

  it("passes through provider classification when data is returned", async () => {
    const insights = {
      getInsight: vi.fn().mockResolvedValue({
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
    };
    const rows = await new FleetService(insights as never).getRows(DEMO_SITES.slice(0, 1));
    expect(rows[0]?.expectedEnergyTodayKWh).toBe(42);
    expect(rows[0]?.expectedEnergyClassification).toBe("estimated_generation");
    expect(rows[0]?.providerLabel).toBe("PVGIS");
  });
});

describe("coordinate search", () => {
  it("parses coordinate input", () => {
    expect(parseCoordinateQuery("40.7128, -74.0060")).toMatchObject({
      latitude: 40.7128,
      longitude: -74.006,
    });
  });

  it("rejects out-of-range and non-coordinate input", () => {
    expect(parseCoordinateQuery("120, 20")).toBeUndefined();
    expect(parseCoordinateQuery("Kaduna")).toBeUndefined();
  });
});

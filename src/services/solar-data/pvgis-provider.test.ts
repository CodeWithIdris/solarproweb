import assert from "node:assert/strict";
import test from "node:test";
import { PVGISProvider } from "./providers/pvgis-provider.ts";
import { SolarDataService, clearSolarDataCache } from "./solar-data-service.ts";

test("normalizes PVGIS performance data into Solar Pro provenance fields", async () => {
  let calls = 0;
  const fetcher = async () => {
    calls += 1;
    return new Response(
      JSON.stringify({
        outputs: {
          monthly: [{ month: 1, "H(i)_d": 5, T2m: 27, WS10m: 2 }],
          totals: { fixed: { E_d: 10, E_m: 300, E_y: 3600 } },
        },
      }),
      { status: 200 },
    );
  };
  const service = new SolarDataService(new PVGISProvider("https://example.test", fetcher), 60_000);
  const result = await service.getPVPerformance({
    location: { latitude: 10, longitude: 8 },
    installedCapacityKW: 1,
  });
  assert.equal(result.source.provider, "pvgis");
  assert.equal(result.source.mode, "modelled");
  assert.equal(result.expectedDailyGenerationKWh, 10);
  assert.equal(result.solarResource.annualIrradianceKWhM2, 152.1875);
  assert.equal(calls, 1);
});

test("caches identical resource requests", async () => {
  clearSolarDataCache();
  let calls = 0;
  const fetcher = async () => {
    calls += 1;
    return new Response(JSON.stringify({ outputs: { monthly: [{ month: 1, "H(i)_d": 5 }] } }), {
      status: 200,
    });
  };
  const service = new SolarDataService(new PVGISProvider("https://example.test", fetcher), 60_000);
  const request = { location: { latitude: 10, longitude: 8 } };
  await service.getSolarResource(request);
  await service.getSolarResource(request);
  assert.equal(calls, 1);
});

test("rejects invalid coordinates and provider failures", async () => {
  const provider = new PVGISProvider(
    "https://example.test",
    async () => new Response("", { status: 503 }),
  );
  await assert.rejects(
    provider.getSolarResource({ location: { latitude: 91, longitude: 8 } }),
    /INVALID_COORDINATES/,
  );
  await assert.rejects(
    provider.getSolarResource({ location: { latitude: 10, longitude: 8 } }),
    /PROVIDER_UNAVAILABLE/,
  );
});

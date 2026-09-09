import assert from "node:assert/strict";
import test from "node:test";
import { NasaPowerProvider } from "./providers/nasa-power-provider.ts";
import { SolarDataService, clearSolarDataCache } from "./solar-data-service.ts";

const payload = {
  properties: {
    parameter: {
      ALLSKY_SFC_SW_DWN: {
        JAN: 5,
        FEB: 6,
        MAR: 7,
        APR: 6,
        MAY: 5,
        JUN: 4,
        JUL: 4,
        AUG: 5,
        SEP: 6,
        OCT: 7,
        NOV: 6,
        DEC: 5,
      },
      T2M: { JAN: 20 },
      WS2M: { JAN: 2 },
    },
  },
};

test("normalizes NASA POWER climatology with environmental provenance", async () => {
  const provider = new NasaPowerProvider(
    "https://example.test",
    async () => new Response(JSON.stringify(payload)),
  );
  const result = await provider.getSolarResource({
    location: { latitude: 51.5, longitude: -0.12 },
  });
  assert.equal(result.source.provider, "nasa-power");
  assert.equal(result.source.dataType, "Satellite/reanalysis environmental data");
  assert.equal(result.monthlyIrradianceKWhM2[0]?.value, 155);
  assert.ok(result.annualIrradianceKWhM2 > 0);
});

test("keeps NASA POWER requests in the shared provider cache", async () => {
  clearSolarDataCache();
  let calls = 0;
  const provider = new NasaPowerProvider("https://example.test", async () => {
    calls += 1;
    return new Response(JSON.stringify(payload));
  });
  const service = new SolarDataService(provider, 60_000);
  const request = { location: { latitude: 1, longitude: 2 } };
  await service.getSolarResource(request);
  await service.getSolarResource(request);
  assert.equal(calls, 1);
});

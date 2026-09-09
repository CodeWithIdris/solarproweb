import { createServerFn } from "@tanstack/react-start";
import { solarDataService } from "@/services/solar-data/solar-data-service";
import type { PVGISRequest } from "@/services/solar-data/types";

export const getModelledSolarResource = createServerFn({ method: "POST" })
  .validator((data: PVGISRequest) => data)
  .handler(async ({ data }) => {
    return solarDataService.getSolarResource(data);
  });

export const getModelledPVPerformance = createServerFn({ method: "POST" })
  .validator((data: PVGISRequest) => data)
  .handler(async ({ data }) => {
    return solarDataService.getPVPerformance(data);
  });

export const getMultiProviderSolarResource = createServerFn({ method: "POST" })
  .validator((data: PVGISRequest) => data)
  .handler(async ({ data }) => solarDataService.getMultiProviderSolarResource(data));

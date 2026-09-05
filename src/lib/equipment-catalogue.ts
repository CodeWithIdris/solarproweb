export type EquipmentStatus = "reference" | "active" | "inactive";
export type PanelTechnology = "monocrystalline" | "polycrystalline" | "unknown";
export type BatteryChemistry = "LFP" | "lead-acid" | "unknown";
export type InverterType = "hybrid" | "off-grid" | "grid-tied";
export type InverterPhase = "single-phase" | "three-phase";

export interface SolarPanelModel {
  id: string;
  manufacturer: string;
  model: string;
  ratedPowerWatts: number;
  technology: PanelTechnology;
  voltageCharacteristics?: { openCircuitVoltage?: number; operatingVoltage?: number };
  dimensions?: { lengthMm?: number; widthMm?: number; thicknessMm?: number };
  referenceNotes: string;
  status: EquipmentStatus;
}

export interface BatteryModel {
  id: string;
  manufacturer: string;
  model: string;
  chemistry: BatteryChemistry;
  nominalCapacityKWh: number;
  usableCapacityKWh?: number;
  nominalVoltage: number;
  maximumContinuousPowerKW?: number;
  recommendedDepthOfDischarge?: number;
  expandable: boolean;
  maximumParallelUnits?: number;
  referenceNotes: string;
  status: EquipmentStatus;
}

export interface InverterModel {
  id: string;
  manufacturer: string;
  model: string;
  ratedPowerKW: number;
  ratedPowerKVA?: number;
  surgeCapacity?: { value: number; unit: "kW" | "kVA"; durationSeconds?: number };
  inverterType: InverterType;
  nominalVoltage: number;
  batteryVoltageCompatibility?: number[];
  phase: InverterPhase;
  referenceNotes: string;
  status: EquipmentStatus;
}

export interface EquipmentCatalogue {
  panels: SolarPanelModel[];
  batteries: BatteryModel[];
  inverters: InverterModel[];
}

export const REFERENCE_EQUIPMENT_CATALOGUE: EquipmentCatalogue = {
  panels: [450, 500, 550, 600].map((ratedPowerWatts) => ({
    id: `reference-panel-${ratedPowerWatts}`,
    manufacturer: "Reference",
    model: `Reference ${ratedPowerWatts}W panel`,
    ratedPowerWatts,
    technology: "monocrystalline",
    referenceNotes:
      "Generic reference data for planning only; verify equipment specifications before design.",
    status: "reference",
  })),
  batteries: [
    {
      id: "reference-battery-5-12",
      manufacturer: "Reference",
      model: "Reference 5.12 kWh LFP battery",
      chemistry: "LFP",
      nominalCapacityKWh: 5.12,
      usableCapacityKWh: 4.096,
      nominalVoltage: 51.2,
      maximumContinuousPowerKW: 2.56,
      recommendedDepthOfDischarge: 0.8,
      expandable: true,
      maximumParallelUnits: 8,
      referenceNotes:
        "Generic reference data for planning only; confirm voltage, power, and communications with the manufacturer.",
      status: "reference",
    },
    {
      id: "reference-battery-10-24",
      manufacturer: "Reference",
      model: "Reference 10.24 kWh LFP battery",
      chemistry: "LFP",
      nominalCapacityKWh: 10.24,
      usableCapacityKWh: 8.192,
      nominalVoltage: 51.2,
      maximumContinuousPowerKW: 5.12,
      recommendedDepthOfDischarge: 0.8,
      expandable: true,
      maximumParallelUnits: 8,
      referenceNotes:
        "Generic reference data for planning only; confirm voltage, power, and communications with the manufacturer.",
      status: "reference",
    },
  ],
  inverters: [
    {
      id: "reference-inverter-3",
      manufacturer: "Reference",
      model: "Reference 3 kVA hybrid inverter",
      ratedPowerKW: 2.7,
      ratedPowerKVA: 3,
      surgeCapacity: { value: 6, unit: "kVA", durationSeconds: 5 },
      inverterType: "hybrid",
      nominalVoltage: 230,
      batteryVoltageCompatibility: [48, 51.2],
      phase: "single-phase",
      referenceNotes:
        "Generic reference data for planning only; verify surge duration and battery compatibility.",
      status: "reference",
    },
    {
      id: "reference-inverter-5",
      manufacturer: "Reference",
      model: "Reference 5 kVA hybrid inverter",
      ratedPowerKW: 4.5,
      ratedPowerKVA: 5,
      surgeCapacity: { value: 10, unit: "kVA", durationSeconds: 5 },
      inverterType: "hybrid",
      nominalVoltage: 230,
      batteryVoltageCompatibility: [48, 51.2],
      phase: "single-phase",
      referenceNotes:
        "Generic reference data for planning only; verify surge duration and battery compatibility.",
      status: "reference",
    },
    {
      id: "reference-inverter-8",
      manufacturer: "Reference",
      model: "Reference 8 kVA hybrid inverter",
      ratedPowerKW: 7.2,
      ratedPowerKVA: 8,
      surgeCapacity: { value: 16, unit: "kVA", durationSeconds: 5 },
      inverterType: "hybrid",
      nominalVoltage: 230,
      batteryVoltageCompatibility: [48, 51.2],
      phase: "single-phase",
      referenceNotes:
        "Generic reference data for planning only; verify surge duration and battery compatibility.",
      status: "reference",
    },
  ],
};

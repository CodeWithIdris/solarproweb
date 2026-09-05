import { useEffect, useMemo, useState } from "react";

type ApplianceCategory =
  | "Lighting"
  | "Cooling"
  | "Kitchen"
  | "Entertainment"
  | "Computing"
  | "Pumps and Motors"
  | "Business Equipment"
  | "Other";
type Objective =
  | "Reduce electricity costs"
  | "Backup essential appliances"
  | "Power most of the property"
  | "High energy independence"
  | "Reduce generator dependence"
  | "Custom requirement";
type Appliance = {
  id: string;
  name: string;
  category: ApplianceCategory;
  watts: number;
  quantity: number;
  hours: number;
  backup: boolean;
  peak: boolean;
  surge: "none" | "moderate" | "high";
  priority: "essential" | "important" | "flexible";
};

type Assessment = {
  name: string;
  propertyType: string;
  country: string;
  location: string;
  occupants: string;
  objective: Objective;
  backupHours: number;
  panelWatts: number;
  appliances: Appliance[];
};

const inputClass =
  "w-full rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
const buttonClass = "rounded-sm px-4 py-2 text-sm font-medium transition-colors";
const categories: ApplianceCategory[] = [
  "Lighting",
  "Cooling",
  "Kitchen",
  "Entertainment",
  "Computing",
  "Pumps and Motors",
  "Business Equipment",
  "Other",
];
const library: Omit<Appliance, "id">[] = [
  {
    name: "LED Bulb",
    category: "Lighting",
    watts: 10,
    quantity: 8,
    hours: 5,
    backup: true,
    peak: false,
    surge: "none",
    priority: "essential",
  },
  {
    name: "Standing Fan",
    category: "Cooling",
    watts: 60,
    quantity: 2,
    hours: 8,
    backup: true,
    peak: true,
    surge: "none",
    priority: "important",
  },
  {
    name: "Ceiling Fan",
    category: "Cooling",
    watts: 75,
    quantity: 2,
    hours: 8,
    backup: true,
    peak: true,
    surge: "none",
    priority: "important",
  },
  {
    name: "Refrigerator",
    category: "Kitchen",
    watts: 180,
    quantity: 1,
    hours: 10,
    backup: true,
    peak: true,
    surge: "high",
    priority: "essential",
  },
  {
    name: "Television",
    category: "Entertainment",
    watts: 120,
    quantity: 1,
    hours: 5,
    backup: false,
    peak: false,
    surge: "none",
    priority: "flexible",
  },
  {
    name: "Laptop",
    category: "Computing",
    watts: 65,
    quantity: 1,
    hours: 7,
    backup: true,
    peak: false,
    surge: "none",
    priority: "important",
  },
  {
    name: "Router",
    category: "Computing",
    watts: 15,
    quantity: 1,
    hours: 24,
    backup: true,
    peak: true,
    surge: "none",
    priority: "essential",
  },
  {
    name: "Microwave",
    category: "Kitchen",
    watts: 1200,
    quantity: 1,
    hours: 0.5,
    backup: false,
    peak: false,
    surge: "moderate",
    priority: "flexible",
  },
  {
    name: "Electric Kettle",
    category: "Kitchen",
    watts: 1500,
    quantity: 1,
    hours: 0.4,
    backup: false,
    peak: false,
    surge: "moderate",
    priority: "flexible",
  },
  {
    name: "Air Conditioner",
    category: "Cooling",
    watts: 1500,
    quantity: 1,
    hours: 5,
    backup: false,
    peak: false,
    surge: "high",
    priority: "flexible",
  },
  {
    name: "Water Pump",
    category: "Pumps and Motors",
    watts: 750,
    quantity: 1,
    hours: 1,
    backup: false,
    peak: false,
    surge: "high",
    priority: "important",
  },
  {
    name: "Printer",
    category: "Business Equipment",
    watts: 400,
    quantity: 1,
    hours: 1,
    backup: false,
    peak: false,
    surge: "moderate",
    priority: "flexible",
  },
];

const initialAssessment: Assessment = {
  name: "My first assessment",
  propertyType: "House",
  country: "Nigeria",
  location: "",
  occupants: "",
  objective: "Backup essential appliances",
  backupHours: 8,
  panelWatts: 550,
  appliances: library.slice(0, 4).map((item, index) => ({ ...item, id: `${item.name}-${index}` })),
};

function calculate(assessment: Assessment) {
  const daily =
    assessment.appliances.reduce((sum, item) => sum + item.watts * item.quantity * item.hours, 0) /
    1000;
  const connected =
    assessment.appliances.reduce((sum, item) => sum + item.watts * item.quantity, 0) / 1000;
  const peak =
    assessment.appliances
      .filter((item) => item.peak)
      .reduce((sum, item) => sum + item.watts * item.quantity, 0) / 1000;
  const essential =
    assessment.appliances
      .filter((item) => item.backup)
      .reduce((sum, item) => sum + item.watts * item.quantity * item.hours, 0) / 1000;
  const surgeLoad =
    assessment.appliances
      .filter((item) => item.peak && item.surge !== "none")
      .reduce(
        (sum, item) => sum + item.watts * item.quantity * (item.surge === "high" ? 1.5 : 0.5),
        0,
      ) / 1000;
  const usableBattery = essential * (assessment.backupHours / 8);
  const installedBattery = usableBattery / 0.8 / 0.92;
  const inverter = Math.max(peak * 1.25, 1);
  const solar = Math.max(
    (daily / 4.5 / 0.8) *
      {
        "Reduce electricity costs": 0.7,
        "Backup essential appliances": 0.85,
        "Power most of the property": 1,
        "High energy independence": 1.15,
        "Reduce generator dependence": 1,
        "Custom requirement": 0.9,
      }[assessment.objective],
    1,
  );
  const tiers = [
    {
      name: "Essential",
      solar: solar * 0.75,
      battery: installedBattery * 0.75,
      inverter: inverter * 0.85,
      note: "Critical and selected backup loads",
    },
    {
      name: "Recommended",
      solar,
      battery: installedBattery,
      inverter,
      note: "Balanced around your stated objective",
    },
    {
      name: "Extended",
      solar: solar * 1.3,
      battery: installedBattery * 1.5,
      inverter: inverter * 1.2,
      note: "More autonomy and inverter headroom",
    },
  ];
  return {
    daily,
    monthly: daily * 30,
    connected,
    peak,
    essential,
    surgeLoad,
    usableBattery,
    installedBattery,
    inverter,
    solar,
    panels: Math.ceil((solar * 1000) / assessment.panelWatts),
    tiers,
  };
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

function Metric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="border-l-2 border-solar pl-3">
      <p className="label-technical">{label}</p>
      <p className="mt-1 font-mono text-xl font-medium text-foreground">
        {value} <span className="text-xs font-normal text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}

function StepNav({ step, setStep }: { step: number; setStep: (step: number) => void }) {
  const steps = ["Property", "Load assessment", "Usage profile", "Analysis", "Recommendation"];
  return (
    <div className="border-b border-border bg-muted/30">
      <div className="mx-auto flex max-w-6xl overflow-x-auto px-6">
        {steps.map((label, index) => (
          <button
            key={label}
            onClick={() => index <= step && setStep(index)}
            className={`flex min-w-max items-center gap-2 border-b-2 px-4 py-4 text-sm ${step === index ? "border-solar font-semibold text-foreground" : "border-transparent text-muted-foreground"}`}
          >
            <span className="font-mono text-xs">0{index + 1}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function PropertyStep({
  assessment,
  update,
}: {
  assessment: Assessment;
  update: (patch: Partial<Assessment>) => void;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
      <div className="border border-border bg-card p-6">
        <p className="label-technical">Step 01 — Assessment setup</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          Tell us what you are planning
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          This information organizes your assessment. Location can support more precise solar
          assumptions in a later version.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <Field label="Assessment name">
            <input
              className={inputClass}
              value={assessment.name}
              onChange={(event) => update({ name: event.target.value })}
            />
          </Field>
          <Field label="Property type">
            <select
              className={inputClass}
              value={assessment.propertyType}
              onChange={(event) => update({ propertyType: event.target.value })}
            >
              {[
                "House",
                "Apartment",
                "Office",
                "Shop",
                "Restaurant",
                "School",
                "Small Business",
                "Other",
              ].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </Field>
          <Field label="Country">
            <input
              className={inputClass}
              value={assessment.country}
              onChange={(event) => update({ country: event.target.value })}
            />
          </Field>
          <Field label="City or location">
            <input
              className={inputClass}
              placeholder="e.g. Abuja"
              value={assessment.location}
              onChange={(event) => update({ location: event.target.value })}
            />
          </Field>
          <Field label="Occupants (optional)">
            <input
              className={inputClass}
              type="number"
              min="0"
              value={assessment.occupants}
              onChange={(event) => update({ occupants: event.target.value })}
            />
          </Field>
        </div>
      </div>
      <aside className="border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-6">
        <p className="label-technical">Why this matters</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          A clear assessment record makes it easier to revisit assumptions, compare scenarios, and
          move from planning into a future system design.
        </p>
      </aside>
    </div>
  );
}

function LoadStep({
  assessment,
  update,
}: {
  assessment: Assessment;
  update: (patch: Partial<Assessment>) => void;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ApplianceCategory | "All">("All");
  const [advanced, setAdvanced] = useState(false);
  const filtered = library.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) &&
      (category === "All" || item.category === category),
  );
  const add = (item: Omit<Appliance, "id">) =>
    update({
      appliances: [...assessment.appliances, { ...item, id: `${item.name}-${Date.now()}` }],
    });
  const patch = (id: string, patchValue: Partial<Appliance>) =>
    update({
      appliances: assessment.appliances.map((item) =>
        item.id === id ? { ...item, ...patchValue } : item,
      ),
    });
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-technical">Step 02 — Load builder</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Build your appliance list</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Use the equipment label for the most accurate power rating. Defaults are editable.
          </p>
        </div>
        <button
          className={`${buttonClass} border border-border bg-card`}
          onClick={() => setAdvanced(!advanced)}
        >
          {advanced ? "Simple mode" : "Advanced mode"}
        </button>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <section className="border border-border bg-card p-4">
          <p className="label-technical">Appliance library</p>
          <input
            className={`${inputClass} mt-4`}
            placeholder="Search appliances"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className={`${inputClass} mt-2`}
            value={category}
            onChange={(event) => setCategory(event.target.value as ApplianceCategory | "All")}
          >
            <option>All</option>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <div className="mt-4 divide-y divide-border">
            {filtered.map((item) => (
              <button
                key={item.name}
                className="flex w-full items-center justify-between gap-2 py-3 text-left text-sm hover:text-foreground"
                onClick={() => add(item)}
              >
                <span>
                  <span className="block font-medium text-foreground">{item.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {item.watts} W · {item.category}
                  </span>
                </span>
                <span className="font-mono text-xs text-muted-foreground">+ add</span>
              </button>
            ))}
            <button
              className="w-full py-3 text-left text-sm font-medium text-foreground underline underline-offset-4"
              onClick={() =>
                add({
                  name: "Custom Appliance",
                  category: "Other",
                  watts: 500,
                  quantity: 1,
                  hours: 1,
                  backup: false,
                  peak: true,
                  surge: "none",
                  priority: "important",
                })
              }
            >
              + Add custom appliance
            </button>
          </div>
        </section>
        <section className="overflow-x-auto border border-border bg-card">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="label-technical px-4 py-3">Appliance</th>
                <th className="label-technical px-4 py-3">Power (W)</th>
                <th className="label-technical px-4 py-3">Qty</th>
                <th className="label-technical px-4 py-3">Hours/day</th>
                <th className="label-technical px-4 py-3">Backup</th>
                {advanced && <th className="label-technical px-4 py-3">Peak / priority</th>}
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {assessment.appliances.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {item.name}
                    <span className="block font-mono text-xs font-normal text-muted-foreground">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      className="w-24 rounded-sm border border-input bg-background px-2 py-1 font-mono text-xs"
                      type="number"
                      min="1"
                      value={item.watts}
                      onChange={(event) => patch(item.id, { watts: Number(event.target.value) })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      className="w-16 rounded-sm border border-input bg-background px-2 py-1 font-mono text-xs"
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) => patch(item.id, { quantity: Number(event.target.value) })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      className="w-20 rounded-sm border border-input bg-background px-2 py-1 font-mono text-xs"
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      value={item.hours}
                      onChange={(event) => patch(item.id, { hours: Number(event.target.value) })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={item.backup}
                      onChange={(event) => patch(item.id, { backup: event.target.checked })}
                    />
                  </td>
                  {advanced && (
                    <td className="px-4 py-3">
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={item.peak}
                          onChange={(event) => patch(item.id, { peak: event.target.checked })}
                        />{" "}
                        peak
                      </label>
                      <select
                        className="mt-1 w-28 rounded-sm border border-input bg-background px-1 py-1 text-xs"
                        value={item.priority}
                        onChange={(event) =>
                          patch(item.id, { priority: event.target.value as Appliance["priority"] })
                        }
                      >
                        <option>essential</option>
                        <option>important</option>
                        <option>flexible</option>
                      </select>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <button
                      className="text-xs text-muted-foreground underline underline-offset-4 hover:text-destructive"
                      onClick={() =>
                        update({
                          appliances: assessment.appliances.filter((entry) => entry.id !== item.id),
                        })
                      }
                    >
                      remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {assessment.appliances.length === 0 && (
            <p className="p-6 text-sm text-muted-foreground">
              Add appliances from the library to start the load analysis.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function ProfileStep({
  assessment,
  update,
  result,
}: {
  assessment: Assessment;
  update: (patch: Partial<Assessment>) => void;
  result: ReturnType<typeof calculate>;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <div className="border border-border bg-card p-6">
        <p className="label-technical">Step 03 — Usage and backup profile</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          What should the system achieve?
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Your objective changes how much of the daily load Solar Pro prioritizes in the recommended
          array.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <Field label="Solar objective">
            <select
              className={inputClass}
              value={assessment.objective}
              onChange={(event) => update({ objective: event.target.value as Objective })}
            >
              {[
                "Reduce electricity costs",
                "Backup essential appliances",
                "Power most of the property",
                "High energy independence",
                "Reduce generator dependence",
                "Custom requirement",
              ].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </Field>
          <Field
            label="Backup duration"
            hint="Longer backup generally increases required battery capacity."
          >
            <select
              className={inputClass}
              value={assessment.backupHours}
              onChange={(event) => update({ backupHours: Number(event.target.value) })}
            >
              <option value="4">4 hours</option>
              <option value="8">8 hours</option>
              <option value="12">12 hours</option>
              <option value="24">24 hours</option>
            </select>
          </Field>
          <Field label="Panel wattage">
            <select
              className={inputClass}
              value={assessment.panelWatts}
              onChange={(event) => update({ panelWatts: Number(event.target.value) })}
            >
              <option value="450">450 W</option>
              <option value="500">500 W</option>
              <option value="550">550 W</option>
              <option value="600">600 W</option>
            </select>
          </Field>
        </div>
      </div>
      <aside className="border border-border bg-muted/30 p-5">
        <p className="label-technical">Current profile</p>
        <div className="mt-5 grid gap-5">
          <Metric label="Daily consumption" value={result.daily.toFixed(1)} unit="kWh" />
          <Metric label="Essential energy" value={result.essential.toFixed(1)} unit="kWh/day" />
          <Metric label="Peak simultaneous" value={result.peak.toFixed(2)} unit="kW" />
        </div>
      </aside>
    </div>
  );
}

function AnalysisStep({
  result,
  assessment,
}: {
  result: ReturnType<typeof calculate>;
  assessment: Assessment;
}) {
  return (
    <div>
      <p className="label-technical">Step 04 — Energy profile</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight">Your consumption, made legible</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        These figures come directly from the appliances, ratings, quantities, usage hours, backup
        selections, and peak selections you entered.
      </p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Daily consumption" value={result.daily.toFixed(1)} unit="kWh/day" />
        <Metric label="Monthly consumption" value={result.monthly.toFixed(0)} unit="kWh/month" />
        <Metric label="Connected load" value={result.connected.toFixed(2)} unit="kW" />
        <Metric label="Peak simultaneous" value={result.peak.toFixed(2)} unit="kW" />
      </div>
      <div className="mt-8 overflow-x-auto border border-border bg-card">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="label-technical px-4 py-3">Appliance</th>
              <th className="label-technical px-4 py-3">Qty</th>
              <th className="label-technical px-4 py-3">Power</th>
              <th className="label-technical px-4 py-3">Hours/day</th>
              <th className="label-technical px-4 py-3">Daily energy</th>
              <th className="label-technical px-4 py-3">Backup</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {assessment.appliances.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{item.quantity}</td>
                <td className="px-4 py-3 font-mono text-xs">{item.watts} W</td>
                <td className="px-4 py-3 font-mono text-xs">{item.hours}</td>
                <td className="px-4 py-3 font-mono text-xs">
                  {((item.watts * item.quantity * item.hours) / 1000).toFixed(2)} kWh
                </td>
                <td className="px-4 py-3 text-xs">{item.backup ? "Included" : "Excluded"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RecommendationStep({
  assessment,
  result,
  onSave,
}: {
  assessment: Assessment;
  result: ReturnType<typeof calculate>;
  onSave: () => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-technical">Step 05 — System sizing</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            A recommendation you can inspect
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Three traceable configurations, sized from your assessment rather than a fixed
            calculator answer.
          </p>
        </div>
        <button className={`${buttonClass} bg-primary text-primary-foreground`} onClick={onSave}>
          Save assessment
        </button>
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Usable battery" value={result.usableBattery.toFixed(1)} unit="kWh" />
        <Metric label="Installed battery" value={result.installedBattery.toFixed(1)} unit="kWh" />
        <Metric label="Preferred inverter" value={result.inverter.toFixed(1)} unit="kVA" />
        <Metric label="Solar array" value={result.solar.toFixed(1)} unit="kWp" />
      </div>
      <div className="mt-8 overflow-x-auto border border-border bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="label-technical px-4 py-3">Configuration</th>
              <th className="label-technical px-4 py-3">Solar array</th>
              <th className="label-technical px-4 py-3">Battery</th>
              <th className="label-technical px-4 py-3">Inverter</th>
              <th className="label-technical px-4 py-3">Panels ({assessment.panelWatts} W)</th>
              <th className="label-technical px-4 py-3">Basis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {result.tiers.map((tier) => (
              <tr key={tier.name} className={tier.name === "Recommended" ? "bg-muted/40" : ""}>
                <td className="px-4 py-4 font-semibold">{tier.name}</td>
                <td className="px-4 py-4 font-mono text-xs">{tier.solar.toFixed(1)} kWp</td>
                <td className="px-4 py-4 font-mono text-xs">{tier.battery.toFixed(1)} kWh</td>
                <td className="px-4 py-4 font-mono text-xs">{tier.inverter.toFixed(1)} kVA</td>
                <td className="px-4 py-4 font-mono text-xs">
                  {Math.ceil((tier.solar * 1000) / assessment.panelWatts)}
                </td>
                <td className="px-4 py-4 text-muted-foreground">{tier.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-8 grid gap-6 border-t border-border pt-6 lg:grid-cols-2">
        <div>
          <p className="label-technical">Calculation assumptions</p>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
            <li>
              Backup duration:{" "}
              <span className="font-mono text-foreground">{assessment.backupHours} hours</span>
            </li>
            <li>
              Battery usable capacity:{" "}
              <span className="font-mono text-foreground">80% depth of discharge</span>
            </li>
            <li>
              System efficiency: <span className="font-mono text-foreground">92%</span>
            </li>
            <li>
              Solar production:{" "}
              <span className="font-mono text-foreground">4.5 peak sun hours/day</span>
            </li>
            <li>
              Inverter margin: <span className="font-mono text-foreground">25%</span>
            </li>
          </ul>
        </div>
        <div>
          <p className="label-technical">How we calculated this</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Energy is calculated per appliance as watts × quantity × daily hours. Battery sizing
            uses selected backup energy, duration, depth of discharge, and system efficiency. Solar
            sizing uses the selected objective and an initial 4.5 peak-sun-hour assumption.
          </p>
        </div>
      </div>
      <p className="mt-8 border-l-2 border-solar bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground">
        Planning guidance only. Final design should consider actual ratings, duty cycles, starting
        surge, site conditions, solar resource, equipment specifications, electrical installation,
        local regulations, and professional engineering assessment.
      </p>
    </div>
  );
}

export function EnergyAssessment({ onExit }: { onExit: () => void }) {
  const [step, setStep] = useState(0);
  const [assessment, setAssessment] = useState<Assessment>(initialAssessment);
  const [saved, setSaved] = useState<Assessment[]>([]);
  const result = useMemo(() => calculate(assessment), [assessment]);
  useEffect(() => {
    try {
      setSaved(JSON.parse(localStorage.getItem("solar-pro-assessments") ?? "[]"));
    } catch {
      setSaved([]);
    }
  }, []);
  const update = (patch: Partial<Assessment>) =>
    setAssessment((current) => ({ ...current, ...patch }));
  const save = () => {
    const next = [...saved.filter((item) => item.name !== assessment.name), assessment];
    setSaved(next);
    localStorage.setItem("solar-pro-assessments", JSON.stringify(next));
  };
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <button onClick={onExit} className="font-mono text-sm font-semibold tracking-wide">
            SOLAR PRO
          </button>
          <div className="flex items-center gap-4">
            <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
              PLAN / ENERGY ASSESSMENT
            </span>
            <button
              onClick={onExit}
              className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Exit assessment
            </button>
          </div>
        </div>
      </header>
      <StepNav step={step} setStep={setStep} />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <p className="font-mono text-xs text-muted-foreground">
            ASSESSMENT / {assessment.name.toUpperCase()}
          </p>
          <p className="font-mono text-xs text-muted-foreground">{step + 1} of 5</p>
        </div>
        {step === 0 && <PropertyStep assessment={assessment} update={update} />}
        {step === 1 && <LoadStep assessment={assessment} update={update} />}
        {step === 2 && <ProfileStep assessment={assessment} update={update} result={result} />}
        {step === 3 && <AnalysisStep assessment={assessment} result={result} />}
        {step === 4 && <RecommendationStep assessment={assessment} result={result} onSave={save} />}
        <div className="mt-10 flex justify-between border-t border-border pt-5">
          <button
            className={`${buttonClass} border border-border bg-card ${step === 0 ? "invisible" : ""}`}
            onClick={() => setStep(Math.max(0, step - 1))}
          >
            Back
          </button>
          {step < 4 && (
            <button
              className={`${buttonClass} bg-primary text-primary-foreground`}
              onClick={() => setStep(Math.min(4, step + 1))}
            >
              {step === 3 ? "Generate recommendations" : "Continue"}
            </button>
          )}
          {step === 4 && (
            <button className={`${buttonClass} border border-border bg-card`} onClick={onExit}>
              Return to Solar Pro
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

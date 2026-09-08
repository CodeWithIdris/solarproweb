import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DemoRequestForm } from "@/components/DemoRequestForm";
import { EnergyAssessment } from "@/components/EnergyAssessment";
import type { SolarSite } from "@/services/solar-data/site-types";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Solar Pro — Plan, size, and manage solar systems" },
      {
        name: "description",
        content:
          "Understand electricity needs, estimate solar configurations, and manage energy assets from planning through operation.",
      },
      { property: "og:title", content: "Solar Pro — Plan, size, and manage solar systems" },
      {
        property: "og:description",
        content:
          "Understand electricity needs, estimate solar configurations, and manage energy assets from planning through operation.",
      },
      { property: "og:url", content: "/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Solar Pro",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          description: "Solar planning, system sizing, monitoring, and asset management software.",
        }),
      },
    ],
  }),
});

/* ------------------------------------------------------------------ */
/* Demo locations are real places with real coordinates. Their solar    */
/* figures are retrieved from providers through the Solar Pro service   */
/* layer and carry their classification. No telemetry is invented.      */
/* ------------------------------------------------------------------ */

function useFleetRows() {
  const [rows, setRows] = useState<FleetRow[]>(() =>
    DEMO_SITES.map((site) => ({
      ...site,
      expectedEnergyClassification: "unavailable" as const,
      expectedEnergyState: "loading" as const,
    })),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getFleetOverview()
      .then((result) => {
        if (active) setRows(result as FleetRow[]);
      })
      .catch(() => {
        if (active)
          setRows(
            DEMO_SITES.map((site) => ({
              ...site,
              expectedEnergyClassification: "unavailable" as const,
              expectedEnergyState: "provider_error" as const,
            })),
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { rows, loading };
}

const CAPABILITIES: { term: string; detail: string }[] = [
  {
    term: "System planning",
    detail:
      "Assess property loads, usage patterns, backup requirements, and solar objectives before selecting a practical system configuration.",
  },
  {
    term: "Configuration recommendations",
    detail:
      "Translate calculated energy, battery, inverter, and solar requirements into reference equipment configurations with required-versus-provided comparisons.",
  },
  {
    term: "Telemetry ingestion",
    detail:
      "Meter, inverter, and weather-station readings normalised to a common interval. SCADA historian and API connectors; gaps are flagged, not silently interpolated.",
  },
  {
    term: "Alert triage",
    detail:
      "Threshold and deviation rules evaluated per device. Alerts carry the site, device, first-seen timestamp, and likely cause so technicians start from evidence.",
  },
  {
    term: "Work orders",
    detail:
      "Alerts convert to work orders with assigned technicians, parts lists, and resolution notes. Downtime is booked against the affected device, which feeds availability figures.",
  },
  {
    term: "Production reporting",
    detail:
      "Daily and monthly energy, performance ratio, and availability per site and portfolio. Exportable as CSV for investor and lender reporting.",
  },
  {
    term: "Role-scoped access",
    detail:
      "Operations teams see device-level detail and work queues. Portfolio managers see fleet aggregates, budgets, and contract terms. Same database, different views.",
  },
];

const DATA_MODEL: { entity: string; keyFields: string; description: string }[] = [
  {
    entity: "Assessment",
    keyFields: "property, loads, objective, backup_duration",
    description: "A planning record that captures the inputs behind a solar system recommendation.",
  },
  {
    entity: "Energy profile",
    keyFields: "daily_kwh, monthly_kwh, peak_load_kw, essential_energy_kwh",
    description: "The calculated consumption and demand profile used to size a system.",
  },
  {
    entity: "System configuration",
    keyFields: "tier, panels, battery_bank, inverter, compatibility_status",
    description: "A possible equipment combination compared against the calculated requirements.",
  },
  {
    entity: "Calculation result",
    keyFields: "assumptions, requirements, warnings, methodology",
    description:
      "The transparent calculation record that explains how a recommendation was generated.",
  },
  {
    entity: "Site",
    keyFields: "name, region, capacity_mwp, grid_operator, commissioned_on",
    description: "A physical plant and the unit of portfolio aggregation.",
  },
  {
    entity: "Device",
    keyFields: "site_id, type (inverter | meter | weather_station), model, serial",
    description: "A monitored asset installed at a site.",
  },
  {
    entity: "Reading",
    keyFields: "device_id, recorded_at, metric, value, quality_flag",
    description: "A single telemetry point, retained at native resolution.",
  },
  {
    entity: "Alert",
    keyFields: "site_id, device_id, rule, severity, first_seen, status",
    description: "A rule violation requiring triage; the source of work orders.",
  },
  {
    entity: "Work order",
    keyFields: "alert_id, assigned_to, due_on, downtime_hours, resolution",
    description: "Field work booked against an alert, with downtime attribution.",
  },
  {
    entity: "Report",
    keyFields: "site_id, period, energy_kwh, pr_percent, availability_percent",
    description: "Computed daily and monthly aggregates used in reporting.",
  },
];

function formatNumber(n: number) {
  return n.toLocaleString("en-US");
}

function Header({ onPlan }: { onPlan: () => void }) {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <a href="/" className="flex items-baseline gap-2">
          <span className="font-mono text-sm font-semibold tracking-wide text-foreground">
            SOLAR PRO
          </span>
          <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
            planning + fleet operations
          </span>
        </a>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <button onClick={onPlan} className="hover:text-foreground">
            Plan a system
          </button>
          <a href="#platform" className="hover:text-foreground">
            Platform
          </a>
          <a href="#data-model" className="hover:text-foreground">
            Data model
          </a>
          <a href="#fleet" className="hover:text-foreground">
            Fleet view
          </a>
        </nav>
        <a
          href="#demo"
          className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Request a demo
        </a>
      </div>
    </header>
  );
}

function StatusDot({ status }: { status: SiteStatus }) {
  return <span className={`status-dot ${STATUS_META[status].className}`} aria-hidden />;
}

function Hero({ onPlan }: { onPlan: () => void }) {
  return (
    <section className="border-b border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1.1fr_1fr] lg:gap-14 lg:py-24">
        <div>
          <p className="label-technical">Solar Pro — planning and fleet operations software</p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
            Plan, size, and manage solar systems with confidence.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            Understand your electricity needs, estimate the right solar configuration, and manage
            your energy assets from planning through operation.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#assessment"
              onClick={(event) => {
                event.preventDefault();
                onPlan();
              }}
              className="rounded-sm bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Plan a solar system
            </a>
            <a
              href="#fleet"
              className="rounded-sm border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              Manage solar operations
            </a>
          </div>
          <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-border pt-6">
            <div>
              <dt className="label-technical">Data resolution</dt>
              <dd className="mt-1 font-mono text-lg font-medium text-foreground">1 min</dd>
            </div>
            <div>
              <dt className="label-technical">Retention</dt>
              <dd className="mt-1 font-mono text-lg font-medium text-foreground">Full history</dd>
            </div>
            <div>
              <dt className="label-technical">Deployment</dt>
              <dd className="mt-1 font-mono text-lg font-medium text-foreground">Cloud / VPC</dd>
            </div>
          </dl>
        </div>

        <FleetPanel />
      </div>
    </section>
  );
}

/** Demo locations with provider-retrieved estimates. Nothing here is telemetry. */
function FleetPanel() {
  const { rows, loading } = useFleetRows();
  const totalCapacity = rows.reduce((sum, site) => sum + (site.installedCapacityMwp ?? 0), 0);
  return (
    <div className="self-start border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <p className="label-technical">Demo locations — modelled estimates</p>
        <p className="font-mono text-xs text-muted-foreground">
          {loading ? "Retrieving…" : "No telemetry connected"}
        </p>
      </div>
      <ul className="divide-y divide-border">
        {rows.map((site) => (
          <li key={site.id} className="px-5 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">{site.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {site.id} · {site.installedCapacityMwp?.toFixed(1)} MWp
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm text-foreground">
                  {loading
                    ? "…"
                    : site.expectedEnergyState === "available" &&
                        site.expectedEnergyTodayKWh !== undefined
                      ? `${formatNumber(Math.round(site.expectedEnergyTodayKWh))} kWh/day estimated`
                      : "Estimate unavailable"}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {loading
                    ? "Retrieving provider data"
                    : site.expectedEnergyState === "available"
                      ? `${site.providerLabel ?? site.provider} · ${CLASSIFICATION_LABEL[site.expectedEnergyClassification]}`
                      : AVAILABILITY_MESSAGE[site.expectedEnergyState]}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="border-t border-border px-5 py-3">
        <p className="font-mono text-xs text-muted-foreground">
          {rows.length} demo locations · {totalCapacity.toFixed(1)} MWp · modelled estimates only
        </p>
      </div>
    </div>
  );
}

function Platform() {
  return (
    <section id="platform" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[280px_1fr] lg:gap-16">
          <div>
            <p className="label-technical">01 — Platform</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
              What the system does
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Planning and operations share one technical foundation. Each capability exists because
              a system design, monitoring, maintenance, or reporting workflow needs it.
            </p>
          </div>
          <dl className="divide-y divide-border border-y border-border">
            {CAPABILITIES.map((cap) => (
              <div key={cap.term} className="grid gap-1 py-5 sm:grid-cols-[220px_1fr] sm:gap-8">
                <dt className="text-sm font-semibold text-foreground">{cap.term}</dt>
                <dd className="text-sm leading-relaxed text-muted-foreground">{cap.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function DataModel() {
  return (
    <section id="data-model" className="border-b border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[280px_1fr] lg:gap-16">
          <div>
            <p className="label-technical">02 — Data model</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
              A schema your engineers can inspect
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Planning and operations meet in a shared product model: assessments become system
              configurations, then installed sites, devices, readings, and reports.
            </p>
          </div>
          <div className="overflow-x-auto border border-border bg-card">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="label-technical px-4 py-2.5 font-medium">Entity</th>
                  <th className="label-technical px-4 py-2.5 font-medium">Key fields</th>
                  <th className="label-technical px-4 py-2.5 font-medium">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {DATA_MODEL.map((row) => (
                  <tr key={row.entity}>
                    <td className="px-4 py-3 font-mono text-[13px] font-medium text-foreground">
                      {row.entity}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {row.keyFields}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function FleetView() {
  const { rows, loading } = useFleetRows();
  const totalCapacity = rows.reduce((sum, s) => sum + (s.installedCapacityMwp ?? 0), 0);
  const estimated = rows.filter((row) => row.expectedEnergyState === "available");
  const totalEstimated = estimated.reduce((sum, s) => sum + (s.expectedEnergyTodayKWh ?? 0), 0);

  return (
    <section id="fleet" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label-technical">03 — Location view</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
              One table per decision
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              The portfolio view is a working table: sortable, filterable, and exportable. The
              locations below are demonstration sites with real coordinates. Their solar figures are
              retrieved from external providers and are modelled estimates, not measured production.
            </p>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            {rows.length} demo locations · {totalCapacity.toFixed(1)} MWp ·{" "}
            {loading
              ? "retrieving estimates…"
              : estimated.length > 0
                ? `${formatNumber(Math.round(totalEstimated))} kWh/day estimated`
                : "estimates unavailable"}
          </p>
        </div>

        <div className="mt-8 overflow-x-auto border border-border bg-card">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="label-technical px-4 py-2.5 font-medium">Site</th>
                <th className="label-technical px-4 py-2.5 font-medium">Region</th>
                <th className="label-technical px-4 py-2.5 text-right font-medium">
                  Capacity (MWp)
                </th>
                <th className="label-technical px-4 py-2.5 text-right font-medium">
                  Estimated generation (kWh/day)
                </th>
                <th className="label-technical px-4 py-2.5 font-medium">Data type</th>
                <th className="label-technical px-4 py-2.5 font-medium">Telemetry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((site) => (
                <tr key={site.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <span className="block font-medium text-foreground">{site.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {site.id} · Demo site
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {[site.region, site.country].filter(Boolean).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[13px]">
                    {site.installedCapacityMwp?.toFixed(1) ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[13px]">
                    {loading
                      ? "…"
                      : site.expectedEnergyState === "available" &&
                          site.expectedEnergyTodayKWh !== undefined
                        ? formatNumber(Math.round(site.expectedEnergyTodayKWh))
                        : "Unavailable"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {loading
                      ? "Retrieving…"
                      : site.expectedEnergyState === "available"
                        ? `${site.providerLabel ?? site.provider ?? "Provider"} · ${CLASSIFICATION_LABEL[site.expectedEnergyClassification]}`
                        : AVAILABILITY_MESSAGE[site.expectedEnergyState]}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {TELEMETRY_STATUS_LABEL[site.telemetryStatus]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-3xl font-mono text-xs text-muted-foreground">
          No monitoring provider is connected to these locations, so no measured output, performance
          ratio, operational status or alerts are shown. Data availability varies by provider and
          location.
        </p>
      </div>
    </section>
  );
}

function DemoSection() {
  return (
    <section id="demo" className="border-b border-border bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1fr_1.2fr] lg:gap-16 lg:py-20">
        <div>
          <p className="label-technical">04 — Request a demo</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
            See it against your own fleet
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Demos are run against a dataset shaped like your portfolio: same inverter mix, same
            reporting periods, same alert rules you would actually configure.
          </p>
          <ul className="mt-6 grid gap-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="font-mono text-xs text-foreground">1.</span>
              We review your telemetry sources and portfolio size from the form.
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-xs text-foreground">2.</span>A 45-minute session
              covering the fleet view, alert triage, and reporting.
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-xs text-foreground">3.</span>A written summary with a
              data-integration plan for your sites.
            </li>
          </ul>
        </div>
        <DemoRequestForm />
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8">
        <p className="font-mono text-sm font-semibold text-foreground">SOLAR PRO</p>
        <p className="text-xs text-muted-foreground">
          Plan, size, and manage solar systems from assessment through operation.
        </p>
      </div>
    </footer>
  );
}

function Index() {
  const [showAssessment, setShowAssessment] = useState(false);

  if (showAssessment) {
    return <EnergyAssessment onExit={() => setShowAssessment(false)} />;
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Header onPlan={() => setShowAssessment(true)} />
      <main>
        <Hero onPlan={() => setShowAssessment(true)} />
        <Platform />
        <DataModel />
        <FleetView />
        <DemoSection />
      </main>
      <Footer />
    </div>
  );
}

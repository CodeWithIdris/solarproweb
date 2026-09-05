import { createFileRoute } from "@tanstack/react-router";
import { DemoRequestForm } from "@/components/DemoRequestForm";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Solar Pro — Monitoring and asset management for utility-scale solar" },
      {
        name: "description",
        content:
          "Solar Pro gives operations teams and portfolio managers one system of record for site telemetry, alerts, work orders, and production reporting across utility-scale solar fleets.",
      },
      { property: "og:title", content: "Solar Pro — Solar fleet operations software" },
      {
        property: "og:description",
        content:
          "One system of record for telemetry, alerts, work orders, and production reporting across utility-scale solar portfolios.",
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
          description:
            "Monitoring and asset management software for utility-scale solar portfolios.",
        }),
      },
    ],
  }),
});

/* ------------------------------------------------------------------ */
/* Realistic sample data, structured around the Solar Pro data model.  */
/* Clearly labelled as example data where it appears.                  */
/* ------------------------------------------------------------------ */

type SiteStatus = "operational" | "degraded" | "fault";

interface SampleSite {
  id: string;
  name: string;
  region: string;
  capacityMWp: number;
  status: SiteStatus;
  todayKwh: number;
  prPercent: number;
  openAlerts: number;
}

const SAMPLE_SITES: SampleSite[] = [
  { id: "NG-KD-01", name: "Kaduna North", region: "Kaduna, NG", capacityMWp: 12.4, status: "operational", todayKwh: 68_410, prPercent: 81.2, openAlerts: 0 },
  { id: "NG-KD-02", name: "Kaduna South", region: "Kaduna, NG", capacityMWp: 9.8, status: "operational", todayKwh: 51_930, prPercent: 79.6, openAlerts: 1 },
  { id: "NG-NS-01", name: "Nasarawa East", region: "Nasarawa, NG", capacityMWp: 20.0, status: "degraded", todayKwh: 96_120, prPercent: 71.4, openAlerts: 3 },
  { id: "NG-KN-01", name: "Kano River", region: "Kano, NG", capacityMWp: 7.5, status: "operational", todayKwh: 42_060, prPercent: 82.8, openAlerts: 0 },
  { id: "GH-AS-01", name: "Ashanti Ridge", region: "Ashanti, GH", capacityMWp: 15.2, status: "fault", todayKwh: 18_440, prPercent: 22.1, openAlerts: 6 },
];

const STATUS_META: Record<SiteStatus, { label: string; className: string }> = {
  operational: { label: "Operational", className: "bg-status-ok" },
  degraded: { label: "Degraded", className: "bg-status-warn" },
  fault: { label: "Fault", className: "bg-status-fault" },
};

const CAPABILITIES: { term: string; detail: string }[] = [
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
  { entity: "Site", keyFields: "name, region, capacity_mwp, grid_operator, commissioned_on", description: "A physical plant and the unit of portfolio aggregation." },
  { entity: "Device", keyFields: "site_id, type (inverter | meter | weather_station), model, serial", description: "A monitored asset installed at a site." },
  { entity: "Reading", keyFields: "device_id, recorded_at, metric, value, quality_flag", description: "A single telemetry point, retained at native resolution." },
  { entity: "Alert", keyFields: "site_id, device_id, rule, severity, first_seen, status", description: "A rule violation requiring triage; the source of work orders." },
  { entity: "Work order", keyFields: "alert_id, assigned_to, due_on, downtime_hours, resolution", description: "Field work booked against an alert, with downtime attribution." },
  { entity: "Report", keyFields: "site_id, period, energy_kwh, pr_percent, availability_percent", description: "Computed daily and monthly aggregates used in reporting." },
];

function formatNumber(n: number) {
  return n.toLocaleString("en-US");
}

function Header() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <a href="/" className="flex items-baseline gap-2">
          <span className="font-mono text-sm font-semibold tracking-wide text-foreground">
            SOLAR PRO
          </span>
          <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
            fleet operations
          </span>
        </a>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#platform" className="hover:text-foreground">Platform</a>
          <a href="#data-model" className="hover:text-foreground">Data model</a>
          <a href="#fleet" className="hover:text-foreground">Fleet view</a>
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

function Hero() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1.1fr_1fr] lg:gap-14 lg:py-24">
        <div>
          <p className="label-technical">Solar Pro — fleet operations software</p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
            Monitoring and asset management for utility-scale solar portfolios.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            Solar Pro keeps telemetry, alerts, work orders, and production
            reports in one system of record, so operations teams fix the right
            device first and portfolio managers report from numbers both sides
            trust.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#demo"
              className="rounded-sm bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Request a demo
            </a>
            <a
              href="#platform"
              className="rounded-sm border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              Read the platform overview
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

        {/* Example product surface: a live fleet panel, labelled as sample data */}
        <div className="self-start border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <p className="label-technical">Fleet status — example data</p>
            <p className="font-mono text-xs text-muted-foreground">14:32 UTC</p>
          </div>
          <ul className="divide-y divide-border">
            {SAMPLE_SITES.map((site) => (
              <li key={site.id} className="px-5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <StatusDot status={site.status} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{site.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {site.id} · {site.capacityMWp.toFixed(1)} MWp
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-foreground">
                      {formatNumber(site.todayKwh)} kWh
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      PR {site.prPercent.toFixed(1)}%
                      {site.openAlerts > 0 && (
                        <span className="text-destructive"> · {site.openAlerts} alerts</span>
                      )}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-border px-5 py-3">
            <p className="font-mono text-xs text-muted-foreground">
              5 sites · 64.9 MWp · sample fleet shown for illustration
            </p>
          </div>
        </div>
      </div>
    </section>
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
              Five responsibilities, one database. Each capability exists
              because an operations or reporting workflow needs it.
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
              Six core entities cover the operational record. Field names below
              are the actual column names, not marketing abstractions.
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
  const totalCapacity = SAMPLE_SITES.reduce((sum, s) => sum + s.capacityMWp, 0);
  const totalEnergy = SAMPLE_SITES.reduce((sum, s) => sum + s.todayKwh, 0);
  const totalAlerts = SAMPLE_SITES.reduce((sum, s) => sum + s.openAlerts, 0);

  return (
    <section id="fleet" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label-technical">03 — Fleet view</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
              One table per decision
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              The portfolio view is a working table: sortable, filterable, and
              exportable. Below is a representative slice using sample data.
            </p>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            Totals: {totalCapacity.toFixed(1)} MWp · {formatNumber(totalEnergy)} kWh today ·{" "}
            {totalAlerts} open alerts
          </p>
        </div>

        <div className="mt-8 overflow-x-auto border border-border bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="label-technical px-4 py-2.5 font-medium">Site</th>
                <th className="label-technical px-4 py-2.5 font-medium">Region</th>
                <th className="label-technical px-4 py-2.5 text-right font-medium">Capacity (MWp)</th>
                <th className="label-technical px-4 py-2.5 text-right font-medium">Energy today (kWh)</th>
                <th className="label-technical px-4 py-2.5 text-right font-medium">PR (%)</th>
                <th className="label-technical px-4 py-2.5 text-right font-medium">Open alerts</th>
                <th className="label-technical px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {SAMPLE_SITES.map((site) => (
                <tr key={site.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <span className="block font-medium text-foreground">{site.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{site.id}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{site.region}</td>
                  <td className="px-4 py-3 text-right font-mono text-[13px]">
                    {site.capacityMWp.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[13px]">
                    {formatNumber(site.todayKwh)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[13px]">
                    {site.prPercent.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[13px]">
                    {site.openAlerts}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 text-sm text-foreground">
                      <StatusDot status={site.status} />
                      {STATUS_META[site.status].label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          Example data for illustration. A connected fleet reports at 1-minute resolution.
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
            Demos are run against a dataset shaped like your portfolio: same
            inverter mix, same reporting periods, same alert rules you would
            actually configure.
          </p>
          <ul className="mt-6 grid gap-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="font-mono text-xs text-foreground">1.</span>
              We review your telemetry sources and portfolio size from the form.
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-xs text-foreground">2.</span>
              A 45-minute session covering the fleet view, alert triage, and reporting.
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-xs text-foreground">3.</span>
              A written summary with a data-integration plan for your sites.
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
          Monitoring and asset management for utility-scale solar.
        </p>
      </div>
    </footer>
  );
}

function Index() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Header />
      <main>
        <Hero />
        <Platform />
        <DataModel />
        <FleetView />
        <DemoSection />
      </main>
      <Footer />
    </div>
  );
}

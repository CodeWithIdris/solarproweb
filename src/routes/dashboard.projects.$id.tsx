import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { getProject } from "@/lib/project-store";
import { projectSummary, type SolarProjectRecord } from "@/lib/project-types";
import { SolarResourcePanel } from "@/components/SolarResourcePanel";

export const Route = createFileRoute("/dashboard/projects/$id")({ component: ProjectDetail });
function ProjectDetail() {
  const { id } = Route.useParams();
  const [project, setProject] = useState<SolarProjectRecord | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    getProject(id).then(({ data, error: queryError }) => {
      if (queryError) setError(queryError.message);
      else setProject(data);
    });
  }, [id]);
  if (error)
    return (
      <DashboardShell>
        <p role="alert" className="text-sm text-destructive">
          Project could not be loaded: {error}
        </p>
      </DashboardShell>
    );
  if (!project)
    return (
      <DashboardShell>
        <p className="text-sm text-muted-foreground">Loading project…</p>
      </DashboardShell>
    );
  const summary = projectSummary(project);
  const latitude = project.assessment_inputs["latitude"];
  const longitude = project.assessment_inputs["longitude"];
  const recommendation = project.calculation_result.recommendations.recommended;
  const configuration = project.system_configuration.configurations.find(
    (item) => item.recommendationTier === (project.selected_recommendation_tier ?? "Recommended"),
  );
  return (
    <DashboardShell>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="label-technical">Solar project / {project.status}</p>
          <h2 className="mt-2 text-2xl font-semibold">{project.name}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {project.property_type} · {project.location || "Location not set"}
          </p>
        </div>
        <Link to="/dashboard/projects" className="text-sm underline underline-offset-4">
          Back to projects
        </Link>
      </div>
      <section className="mt-8 grid gap-6 border-b border-border pb-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="label-technical">Recommended system</p>
          <p className="mt-2 font-mono text-xl">{summary.solarCapacityKWP.toFixed(1)} kWp</p>
        </div>
        <div>
          <p className="label-technical">Panel configuration</p>
          <p className="mt-2 font-mono text-xl">
            {summary.panelQuantity} × {summary.panelWattage} W
          </p>
        </div>
        <div>
          <p className="label-technical">Daily energy</p>
          <p className="mt-2 font-mono text-xl">
            {project.calculation_result.energyProfile.dailyEnergyKWh.toFixed(1)} kWh
          </p>
        </div>
        <div>
          <p className="label-technical">Peak load</p>
          <p className="mt-2 font-mono text-xl">
            {project.calculation_result.loadAnalysis.peakSimultaneousLoadKW.toFixed(2)} kW
          </p>
        </div>
      </section>
      <section className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <p className="label-technical">Recommended solar system</p>
          <table className="mt-4 w-full border-y border-border text-sm">
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-3 text-muted-foreground">Required solar capacity</td>
                <td className="py-3 text-right font-mono">
                  {recommendation.solarArrayKWP.toFixed(2)} kWp
                </td>
              </tr>
              <tr>
                <td className="py-3 text-muted-foreground">Selected panel</td>
                <td className="py-3 text-right font-mono">{summary.panelWattage} W</td>
              </tr>
              <tr>
                <td className="py-3 text-muted-foreground">Panels required</td>
                <td className="py-3 text-right font-mono">{summary.panelQuantity}</td>
              </tr>
              <tr>
                <td className="py-3 text-muted-foreground">Installed capacity</td>
                <td className="py-3 text-right font-mono">
                  {summary.configuredSolarCapacityKWP.toFixed(2)} kWp
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          <p className="label-technical">Battery and inverter</p>
          <table className="mt-4 w-full border-y border-border text-sm">
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-3 text-muted-foreground">Battery capacity</td>
                <td className="py-3 text-right font-mono">
                  {recommendation.batteryCapacityKWh.toFixed(2)} kWh
                </td>
              </tr>
              <tr>
                <td className="py-3 text-muted-foreground">Backup duration</td>
                <td className="py-3 text-right font-mono">
                  {recommendation.backupDurationHours} hours
                </td>
              </tr>
              <tr>
                <td className="py-3 text-muted-foreground">Preferred inverter</td>
                <td className="py-3 text-right font-mono">
                  {recommendation.inverterCapacityKVA.toFixed(2)} kVA
                </td>
              </tr>
              <tr>
                <td className="py-3 text-muted-foreground">Selected configuration</td>
                <td className="py-3 text-right">{configuration?.name ?? "Not selected"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section className="mt-8 border-t border-border pt-6">
        <p className="label-technical">Assessment inputs</p>
        <pre className="mt-4 overflow-x-auto border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
          {JSON.stringify(project.assessment_inputs, null, 2)}
        </pre>
      </section>
      {typeof latitude === "number" && typeof longitude === "number" && (
        <SolarResourcePanel latitude={latitude} longitude={longitude} />
      )}
    </DashboardShell>
  );
}

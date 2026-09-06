import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { listProjects } from "@/lib/project-store";
import { projectSummary, type SolarProjectRecord } from "@/lib/project-types";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

function Dashboard() {
  const [projects, setProjects] = useState<SolarProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    listProjects().then(({ data, error: queryError }) => {
      if (queryError) setError(queryError.message);
      else setProjects(data ?? []);
      setLoading(false);
    });
  }, []);
  const totalCapacity = projects.reduce(
    (sum, project) => sum + projectSummary(project).solarCapacityKWP,
    0,
  );
  const totalPanels = projects.reduce(
    (sum, project) => sum + projectSummary(project).panelQuantity,
    0,
  );
  return (
    <DashboardShell>
      <section className="grid gap-6 border-y border-border py-6 md:grid-cols-3">
        <div>
          <p className="label-technical">Solar projects</p>
          <p className="mt-2 font-mono text-2xl">{projects.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">Saved planning records</p>
        </div>
        <div>
          <p className="label-technical">Estimated solar capacity</p>
          <p className="mt-2 font-mono text-2xl">{totalCapacity.toFixed(1)} kWp</p>
          <p className="mt-1 text-sm text-muted-foreground">Across {projects.length} projects</p>
        </div>
        <div>
          <p className="label-technical">Recommended panels</p>
          <p className="mt-2 font-mono text-2xl">{totalPanels}</p>
          <p className="mt-1 text-sm text-muted-foreground">Based on saved recommendations</p>
        </div>
      </section>
      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="label-technical">Recent projects</p>
            <h2 className="mt-2 text-xl font-semibold">Your solar planning work</h2>
          </div>
          <Link to="/dashboard/projects" className="text-sm underline underline-offset-4">
            View all projects
          </Link>
        </div>
        {loading ? (
          <p className="mt-6 text-sm text-muted-foreground">Loading projects…</p>
        ) : error ? (
          <p role="alert" className="mt-6 text-sm text-destructive">
            Projects could not be loaded: {error}
          </p>
        ) : projects.length === 0 ? (
          <div className="mt-6 border border-border bg-card p-6">
            <p className="font-medium">You have not saved a solar project yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Start by calculating your energy requirements and Solar Pro will help you plan the
              right system.
            </p>
            <Link
              to="/"
              className="mt-5 inline-block text-sm font-medium underline underline-offset-4"
            >
              Plan your first solar system
            </Link>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto border border-border bg-card">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="label-technical px-4 py-3">Project</th>
                  <th className="label-technical px-4 py-3">Location</th>
                  <th className="label-technical px-4 py-3">System</th>
                  <th className="label-technical px-4 py-3">Panels</th>
                  <th className="label-technical px-4 py-3">Status</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {projects.slice(0, 5).map((project) => {
                  const summary = projectSummary(project);
                  return (
                    <tr key={project.id}>
                      <td className="px-4 py-3 font-medium">
                        {project.name}
                        <span className="block text-xs text-muted-foreground">
                          {project.property_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {project.location || "Location not set"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {summary.solarCapacityKWP.toFixed(1)} kWp
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {summary.panelQuantity} × {summary.panelWattage} W
                      </td>
                      <td className="px-4 py-3 text-xs">{project.status}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to="/dashboard/projects/$id"
                          params={{ id: project.id }}
                          className="text-sm underline underline-offset-4"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DashboardShell>
  );
}

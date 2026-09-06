import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { deleteProject, listProjects } from "@/lib/project-store";
import { projectSummary, type SolarProjectRecord } from "@/lib/project-types";

export const Route = createFileRoute("/dashboard/projects")({ component: Projects });
function Projects() {
  const [projects, setProjects] = useState<SolarProjectRecord[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");
  const load = () =>
    listProjects().then(({ data, error: queryError }) => {
      if (queryError) setError(queryError.message);
      else setProjects(data ?? []);
    });
  useEffect(() => {
    void load();
  }, []);
  const filtered = useMemo(
    () =>
      projects.filter(
        (project) =>
          `${project.name} ${project.location ?? ""}`
            .toLowerCase()
            .includes(search.toLowerCase()) &&
          (status === "all" || project.status === status),
      ),
    [projects, search, status],
  );
  async function remove(project: SolarProjectRecord) {
    if (!window.confirm(`Delete ${project.name}? This cannot be undone.`)) return;
    const result = await deleteProject(project.id);
    if (result.error) setError(result.error.message);
    else load();
  }
  return (
    <DashboardShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-technical">Project management</p>
          <h2 className="mt-2 text-2xl font-semibold">Solar Projects</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            All your saved solar assessments and system recommendations.
          </p>
        </div>
        <Link
          to="/"
          className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Plan a new solar system
        </Link>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <input
          className="w-full max-w-sm rounded-sm border border-input bg-card px-3 py-2 text-sm"
          placeholder="Search name or location"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="rounded-sm border border-input bg-card px-3 py-2 text-sm"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="saved">Saved</option>
          <option value="calculated">Calculated</option>
          <option value="draft">Draft</option>
        </select>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}
      {filtered.length === 0 ? (
        <p className="mt-8 border border-border p-6 text-sm text-muted-foreground">
          No projects match this view.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto border border-border bg-card">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="label-technical px-4 py-3">Project</th>
                <th className="label-technical px-4 py-3">Location</th>
                <th className="label-technical px-4 py-3">System</th>
                <th className="label-technical px-4 py-3">Panel</th>
                <th className="label-technical px-4 py-3">Status</th>
                <th className="label-technical px-4 py-3">Updated</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((project) => {
                const summary = projectSummary(project);
                return (
                  <tr key={project.id}>
                    <td className="px-4 py-3 font-medium">
                      {project.name}
                      <span className="block text-xs text-muted-foreground">
                        {project.property_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{project.location || "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {summary.solarCapacityKWP.toFixed(1)} kWp
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {summary.panelQuantity} × {summary.panelWattage} W
                    </td>
                    <td className="px-4 py-3 text-xs">{project.status}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(project.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to="/dashboard/projects/$id"
                        params={{ id: project.id }}
                        className="mr-3 text-sm underline underline-offset-4"
                      >
                        Open
                      </Link>
                      <button
                        onClick={() => remove(project)}
                        className="text-sm text-destructive underline underline-offset-4"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}

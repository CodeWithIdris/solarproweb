import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { createDeveloperApiKey } from "@/services/developer-api/server-functions";

export const Route = createFileRoute("/dashboard/developer")({ component: Developer });
const inputClass =
  "rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
type ApiKey = {
  id: string;
  name: string;
  key_prefix: string;
  environment: string;
  status: string;
  created_at: string;
  last_used_at: string | null;
};
function Developer() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [name, setName] = useState("Research project");
  const [environment, setEnvironment] = useState<"test" | "live">("test");
  const [secret, setSecret] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = async () => {
    const query = (supabase as unknown as { from: (table: string) => unknown }).from(
      "api_keys",
    ) as {
      select: (fields: string) => {
        order: (
          field: string,
          options: { ascending: boolean },
        ) => Promise<{ data: ApiKey[] | null; error: { message: string } | null }>;
      };
    };
    const result = await query.select("*").order("created_at", { ascending: false });
    if (result.error) setError(result.error.message);
    else setKeys(result.data ?? []);
    setLoading(false);
  };
  useEffect(() => {
    void load();
  }, []);
  async function createKey() {
    setError("");
    setMessage("");
    setSecret("");
    try {
      const result = await createDeveloperApiKey({
        data: { name, environment, scopes: ["solar:resource:read", "solar:generation:read"] },
      });
      setSecret(result.secret);
      setMessage("Copy this key now. It will not be shown again.");
      await load();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "The key could not be created.",
      );
    }
  }
  async function revoke(id: string) {
    const query = (supabase as unknown as { from: (table: string) => unknown }).from(
      "api_keys",
    ) as {
      update: (row: Record<string, string>) => {
        eq: (field: string, value: string) => Promise<{ error: { message: string } | null }>;
      };
    };
    const result = await query.update({ status: "revoked" }).eq("id", id);
    if (result.error) setError(result.error.message);
    else load();
  }
  return (
    <DashboardShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-technical">Developer API</p>
          <h2 className="mt-2 text-2xl font-semibold">Solar data access</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Use approved Solar Pro services for solar applications, research workflows, feasibility
            tools, and internal analysis. Provider attribution and access policies remain in force.
          </p>
        </div>
      </div>
      <section className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="label-technical">API keys</p>
          <div className="mt-4 border border-border bg-card p-5">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
              <input
                className={inputClass}
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-label="API key name"
              />
              <select
                className={inputClass}
                value={environment}
                onChange={(event) => setEnvironment(event.target.value as "test" | "live")}
                aria-label="API key environment"
              >
                <option value="test">Test key</option>
                <option value="live">Live key</option>
              </select>
              <button
                onClick={() => void createKey()}
                className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Create key
              </button>
            </div>
            {secret && (
              <div className="mt-5 border-l-2 border-solar bg-muted/30 p-4">
                <p className="label-technical">One-time secret</p>
                <code className="mt-2 block break-all text-xs text-foreground">{secret}</code>
                <button
                  onClick={() => void navigator.clipboard?.writeText(secret)}
                  className="mt-3 text-xs underline underline-offset-4"
                >
                  Copy key
                </button>
              </div>
            )}
            {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}
            {error && (
              <p role="alert" className="mt-4 text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          {loading ? (
            <p className="mt-5 text-sm text-muted-foreground">Loading API keys…</p>
          ) : keys.length === 0 ? (
            <p className="mt-5 border border-border p-5 text-sm text-muted-foreground">
              No API keys yet.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto border border-border bg-card">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="label-technical px-4 py-3">Name</th>
                    <th className="label-technical px-4 py-3">Key</th>
                    <th className="label-technical px-4 py-3">Status</th>
                    <th className="label-technical px-4 py-3">Created</th>
                    <th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {keys.map((key) => (
                    <tr key={key.id}>
                      <td className="px-4 py-3 font-medium">
                        {key.name}
                        <span className="block text-xs text-muted-foreground">
                          {key.environment}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{key.key_prefix}••••••••</td>
                      <td className="px-4 py-3 text-xs">{key.status}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(key.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {key.status === "active" && (
                          <button
                            onClick={() => void revoke(key.id)}
                            className="text-xs text-destructive underline underline-offset-4"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <aside>
          <p className="label-technical">Usage</p>
          <div className="mt-4 border-y border-border py-5">
            <p className="font-medium">
              {keys.some((key) => key.last_used_at)
                ? "Usage activity available"
                : "No API requests yet"}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Requests, quotas, and provider provenance will appear here as your keys are used. New
              data access is modelled unless a source is explicitly marked connected or live.
            </p>
          </div>
          <p className="mt-8 label-technical">Authentication</p>
          <pre className="mt-4 overflow-x-auto border border-border bg-muted/30 p-4 text-xs">
            Authorization: Bearer YOUR_API_KEY{"\n\n"}GET
            /v1/solar/resource?latitude=7.3775&longitude=3.9470
          </pre>
          <p className="mt-3 text-xs text-muted-foreground">
            PVGIS-derived data is currently restricted by provider policy from external
            redistribution.
          </p>
        </aside>
      </section>
    </DashboardShell>
  );
}

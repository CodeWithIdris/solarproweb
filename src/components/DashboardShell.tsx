import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { SolarProjectRecord } from "@/lib/project-types";

export function DashboardShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [name, setName] = useState("there");
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        navigate({ to: "/login" });
        return;
      }
      const profileQuery = (supabase as unknown as { from: (table: string) => unknown }).from(
        "profiles",
      ) as {
        select: (fields: string) => {
          eq: (
            field: string,
            value: string,
          ) => { maybeSingle: () => Promise<{ data: { full_name?: string } | null }> };
        };
      };
      const profile = await profileQuery
        .select("full_name")
        .eq("id", data.session.user.id)
        .maybeSingle();
      if (mounted) {
        setName(
          profile.data?.full_name?.split(" ")[0] ||
            data.session.user.email?.split("@")[0] ||
            "there",
        );
        setChecking(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [navigate]);
  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }
  if (checking)
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading your workspace…
      </main>
    );
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <Link to="/dashboard" className="font-mono text-sm font-semibold tracking-wide">
            SOLAR PRO
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/dashboard" activeProps={{ className: "text-foreground" }}>
              Overview
            </Link>
            <Link to="/dashboard/projects" activeProps={{ className: "text-foreground" }}>
              Solar projects
            </Link>
            <Link to="/dashboard/settings" activeProps={{ className: "text-foreground" }}>
              Settings
            </Link>
            <Link to="/dashboard/developer" activeProps={{ className: "text-foreground" }}>
              Developer API
            </Link>
            <button onClick={logout} className="text-foreground underline underline-offset-4">
              Log out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label-technical">Solar planning workspace</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Good morning, {name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage your solar projects, review recommendations, and plan your next energy system.
            </p>
          </div>
          <Link
            to="/"
            className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Plan a new solar system
          </Link>
        </div>
        {children}
      </main>
    </div>
  );
}

export type { SolarProjectRecord };

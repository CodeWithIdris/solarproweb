import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { supabase } from "@/integrations/supabase/client";

/* The profile is loaded once per authenticated workspace visit. */
/* eslint-disable react-hooks/exhaustive-deps */

const inputClass = "w-full rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
type SettingsProfile = { full_name: string; phone: string; company_name: string; country: string; email: string; account_type: string; created_at: string };
export const Route = createFileRoute("/dashboard/settings")({ component: Settings });
function Settings() {
  const [profile, setProfile] = useState<SettingsProfile>({ full_name: "", phone: "", company_name: "", country: "", email: "", account_type: "individual", created_at: "" }); const [state, setState] = useState(""); const [error, setError] = useState("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const query = (supabase as unknown as { from: (table: string) => unknown }).from("profiles") as { select: (fields: string) => { eq: (field: string, value: string) => { maybeSingle: () => Promise<{ data: SettingsProfile | null }> } } };
      const result = await query.select("*").eq("id", data.user.id).maybeSingle();
      if (result.data) setProfile((current) => ({ ...current, ...result.data, email: data.user.email ?? result.data.email }));
    });
  }, []);
  async function save(event: FormEvent) { event.preventDefault(); setState("Saving…"); setError(""); const { data } = await supabase.auth.getUser(); if (!data.user) { setError("Your session has expired. Please sign in again."); setState(""); return; } const query = supabase.from("profiles") as unknown as { update: (row: Record<string, string>) => { eq: (field: string, value: string) => Promise<{ error: { message: string } | null }> } }; const result = await query.update({ full_name: profile.full_name, phone: profile.phone, company_name: profile.company_name, country: profile.country }).eq("id", data.user.id); if (result.error) setError(result.error.message); else setState("Changes saved"); }
  return <DashboardShell><div className="max-w-2xl"><p className="label-technical">Account settings</p><h2 className="mt-2 text-2xl font-semibold">Your profile</h2><form onSubmit={save} className="mt-8 grid gap-5 border border-border bg-card p-6"><label className="grid gap-1.5"><span className="text-sm font-medium">Full name</span><input className={inputClass} value={profile.full_name} onChange={(event) => setProfile({ ...profile, full_name: event.target.value })} /></label><label className="grid gap-1.5"><span className="text-sm font-medium">Email address</span><input className={inputClass} value={profile.email} disabled /></label><div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-1.5"><span className="text-sm font-medium">Phone</span><input className={inputClass} value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></label><label className="grid gap-1.5"><span className="text-sm font-medium">Company</span><input className={inputClass} value={profile.company_name} onChange={(event) => setProfile({ ...profile, company_name: event.target.value })} /></label></div><label className="grid gap-1.5"><span className="text-sm font-medium">Country</span><input className={inputClass} value={profile.country} onChange={(event) => setProfile({ ...profile, country: event.target.value })} /></label><div className="flex flex-wrap items-center justify-between gap-4"><p className="text-sm text-muted-foreground">Account type: {profile.account_type}</p><button className="rounded-sm bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Save changes</button></div>{state && <p className="text-sm text-muted-foreground">{state}</p>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</form></div></DashboardShell>;
}

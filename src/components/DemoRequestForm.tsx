import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

const inputClass =
  "w-full rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

type FormState = "idle" | "submitting" | "success" | "error";

export function DemoRequestForm() {
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const payload = {
      full_name: String(data.get("full_name") ?? "").trim(),
      work_email: String(data.get("work_email") ?? "").trim(),
      company: String(data.get("company") ?? "").trim(),
      role: String(data.get("role") ?? "operations"),
      fleet_size_mw: data.get("fleet_size_mw") ? Number(data.get("fleet_size_mw")) : null,
      message: String(data.get("message") ?? "").trim() || null,
    };

    if (!payload.full_name || !payload.work_email || !payload.company) return;

    setState("submitting");
    setErrorMessage("");

    // Types regenerate outside this edit cycle; the insert shape matches the table.
    const { error } = await (
      supabase.from("demo_requests") as unknown as {
        insert: (row: typeof payload) => Promise<{ error: { message: string } | null }>;
      }
    ).insert(payload);

    if (error) {
      setErrorMessage(error.message);
      setState("error");
      return;
    }
    setState("success");
    form.reset();
  }

  if (state === "success") {
    return (
      <div className="border border-border bg-card p-6">
        <p className="label-technical">Request received</p>
        <p className="mt-3 text-base font-medium text-foreground">
          Thanks. Your request has been received.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Our team will contact you to arrange a suitable time and understand your portfolio and
          telemetry sources.
        </p>
        <button
          type="button"
          onClick={() => setState("idle")}
          className="mt-5 text-sm font-medium text-foreground underline underline-offset-4 hover:text-muted-foreground"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border bg-card">
      <div className="border-b border-border px-6 py-4">
        <p className="label-technical">Form 01 — Demo request</p>
      </div>
      <div className="grid gap-5 px-6 py-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-foreground">Full name</span>
            <input name="full_name" required autoComplete="name" className={inputClass} />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-foreground">Work email</span>
            <input
              name="work_email"
              type="email"
              required
              autoComplete="email"
              className={inputClass}
            />
          </label>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-foreground">Company</span>
            <input name="company" required autoComplete="organization" className={inputClass} />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-foreground">Primary responsibility</span>
            <select name="role" className={inputClass} defaultValue="operations">
              <option value="operations">Operations and maintenance</option>
              <option value="portfolio">Portfolio / asset management</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>
        <label className="grid gap-1.5 sm:max-w-60">
          <span className="text-sm font-medium text-foreground">
            Portfolio size (MWp, optional)
          </span>
          <input
            name="fleet_size_mw"
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            className={inputClass}
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-foreground">
            What do you need to monitor? (optional)
          </span>
          <textarea
            name="message"
            rows={4}
            placeholder="e.g. 14 sites across two ISOs, mixed SMA and Huawei inverters, SCADA historian exports"
            className={inputClass}
          />
        </label>
        {state === "error" && (
          <p role="alert" className="text-sm text-destructive">
            The request could not be saved: {errorMessage}
          </p>
        )}
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Submissions are stored securely and used only to arrange your demo.
          </p>
          <button
            type="submit"
            disabled={state === "submitting"}
            className="shrink-0 rounded-sm bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {state === "submitting" ? "Submitting…" : "Request a demo"}
          </button>
        </div>
      </div>
    </form>
  );
}

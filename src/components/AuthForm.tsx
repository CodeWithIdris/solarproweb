import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const inputClass =
  "w-full rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

type Mode = "login" | "signup" | "forgot" | "reset";

export function AuthForm({ mode }: { mode: Mode }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && mode !== "reset") navigate({ to: "/dashboard" });
      setSessionReady(true);
    });
  }, [mode, navigate]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    try {
      if (mode === "login") {
        const result = await supabase.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
        const destination =
          new URLSearchParams(window.location.search).get("returnTo") || "/dashboard";
        window.location.assign(destination);
      } else if (mode === "signup") {
        const fullName = String(data.get("full_name") ?? "").trim();
        if (password !== String(data.get("confirm_password") ?? ""))
          throw new Error("Passwords do not match.");
        if (password.length < 8) throw new Error("Use at least 8 characters for your password.");
        const result = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: String(data.get("phone") ?? "").trim() || null,
              company_name: String(data.get("company_name") ?? "").trim() || null,
              account_type: data.get("account_type") === "business" ? "business" : "individual",
            },
          },
        });
        if (result.error) throw result.error;
        if (result.data.session) {
          const destination =
            new URLSearchParams(window.location.search).get("returnTo") || "/dashboard";
          window.location.assign(destination);
        } else
          setMessage("Account created. Check your email to confirm your address, then sign in.");
      } else if (mode === "forgot") {
        const result = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (result.error) throw result.error;
        setMessage(
          "If an account exists for that email, password reset instructions are on the way.",
        );
      } else {
        if (password.length < 8) throw new Error("Use at least 8 characters for your password.");
        const result = await supabase.auth.updateUser({ password });
        if (result.error) throw result.error;
        setMessage("Your password has been updated. You can sign in with it now.");
      }
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "The request could not be completed.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!sessionReady)
    return (
      <div className="border border-border bg-card p-6 text-sm text-muted-foreground">
        Loading secure account access…
      </div>
    );
  const titles = {
    login: "Sign in to Solar Pro",
    signup: "Create your Solar Pro account",
    forgot: "Reset your password",
    reset: "Choose a new password",
  };
  return (
    <form onSubmit={submit} className="border border-border bg-card">
      <div className="border-b border-border px-6 py-4">
        <p className="label-technical">Solar Pro account</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">{titles[mode]}</h1>
      </div>
      <div className="grid gap-5 px-6 py-6">
        {mode !== "reset" && (
          <label className="grid gap-1.5">
            <input className={inputClass} name="email" type="email" required autoComplete="email" />
          </label>
        )}
        {mode === "signup" && (
          <>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Full name</span>
              <input className={inputClass} name="full_name" required autoComplete="name" />
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-sm font-medium">Phone (optional)</span>
                <input className={inputClass} name="phone" type="tel" />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium">Company (optional)</span>
                <input className={inputClass} name="company_name" />
              </label>
            </div>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Account type</span>
              <select className={inputClass} name="account_type" defaultValue="individual">
                <option value="individual">Individual</option>
                <option value="business">Business</option>
              </select>
            </label>
          </>
        )}
        {(mode === "login" || mode === "signup" || mode === "reset") && (
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">
              {mode === "reset" ? "New password" : "Password"}
            </span>
            <input
              className={inputClass}
              name="password"
              type="password"
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>
        )}
        {mode === "signup" && (
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Confirm password</span>
            <input
              className={inputClass}
              name="confirm_password"
              type="password"
              required
              autoComplete="new-password"
            />
          </label>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="text-sm text-muted-foreground">
            {message}
          </p>
        )}
        <button
          disabled={loading}
          className="rounded-sm bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {loading
            ? "Working…"
            : mode === "login"
              ? "Sign in"
              : mode === "signup"
                ? "Create account"
                : mode === "forgot"
                  ? "Send reset instructions"
                  : "Update password"}
        </button>
        <div className="flex flex-wrap justify-between gap-3 text-sm text-muted-foreground">
          {mode === "login" && (
            <>
              <Link to="/forgot-password" className="underline underline-offset-4">
                Forgot password?
              </Link>
              <Link to="/signup" className="underline underline-offset-4">
                Create an account
              </Link>
            </>
          )}
          {mode === "signup" && (
            <Link to="/login" className="underline underline-offset-4">
              Already have an account? Sign in
            </Link>
          )}
          {(mode === "forgot" || mode === "reset") && (
            <Link to="/login" className="underline underline-offset-4">
              Back to sign in
            </Link>
          )}
        </div>
      </div>
    </form>
  );
}

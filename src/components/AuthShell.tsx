import { Link } from "@tanstack/react-router";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 block font-mono text-sm font-semibold tracking-wide">
          SOLAR PRO
        </Link>
        {children}
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
          Solar Pro provides planning and estimation guidance. Final system design should be
          reviewed by a qualified professional.
        </p>
      </div>
    </main>
  );
}

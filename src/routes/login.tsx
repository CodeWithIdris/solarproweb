import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/AuthForm";
import { AuthShell } from "@/components/AuthShell";

export const Route = createFileRoute("/login")({
  component: () => (
    <AuthShell>
      <AuthForm mode="login" />
    </AuthShell>
  ),
});

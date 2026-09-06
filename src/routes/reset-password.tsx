import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/AuthForm";
import { AuthShell } from "@/components/AuthShell";

export const Route = createFileRoute("/reset-password")({
  component: () => (
    <AuthShell>
      <AuthForm mode="reset" />
    </AuthShell>
  ),
});

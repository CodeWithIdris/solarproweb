import { supabase } from "@/integrations/supabase/client";
import type { SolarProjectRecord } from "./project-types";

type Query = { data: SolarProjectRecord[] | null; error: { message: string } | null };
const projects = () =>
  (supabase as unknown as { from: (table: string) => unknown }).from("solar_projects") as {
    select: (fields: string) => {
      order: (field: string, options: { ascending: boolean }) => Promise<Query>;
      eq: (
        field: string,
        value: string,
      ) => {
        maybeSingle: () => Promise<{
          data: SolarProjectRecord | null;
          error: { message: string } | null;
        }>;
      };
    };
    insert: (row: Record<string, unknown>) => {
      select: (fields: string) => {
        single: () => Promise<{
          data: SolarProjectRecord | null;
          error: { message: string } | null;
        }>;
      };
    };
    update: (row: Record<string, unknown>) => {
      eq: (
        field: string,
        value: string,
      ) => {
        select: (fields: string) => {
          single: () => Promise<{
            data: SolarProjectRecord | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
    delete: () => {
      eq: (field: string, value: string) => Promise<{ error: { message: string } | null }>;
    };
  };

export async function listProjects() {
  return projects().select("*").order("updated_at", { ascending: false });
}
export async function getProject(id: string) {
  return projects().select("*").eq("id", id).maybeSingle();
}
export async function deleteProject(id: string) {
  return projects().delete().eq("id", id);
}

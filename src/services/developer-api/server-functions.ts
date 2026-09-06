import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createApiKey, hashApiKey, type ApiKeyEnvironment, type ApiScope } from "./api-key-service";

export const createDeveloperApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { name: string; environment: ApiKeyEnvironment; scopes: ApiScope[] }) => data)
  .handler(async ({ data, context }) => {
    const created = createApiKey(context.userId, data.name.trim(), data.environment, data.scopes);
    const query = (supabaseAdmin as unknown as { from: (table: string) => unknown }).from(
      "api_keys",
    ) as {
      insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    };
    const result = await query.insert({
      user_id: context.userId,
      name: created.record.name,
      key_prefix: created.record.prefix,
      key_hash: hashApiKey(created.secret),
      environment: created.record.environment,
      scopes: created.record.scopes,
    });
    if (result.error) throw new Error(result.error.message);
    return { secret: created.secret, record: created.record };
  });

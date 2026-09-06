import { randomBytes, createHash, randomUUID } from "node:crypto";

export const API_SCOPES = [
  "solar:read",
  "solar:resource:read",
  "solar:weather:read",
  "solar:generation:read",
  "assessment:create",
  "assessment:read",
  "sites:read",
  "historical:read",
] as const;
export type ApiScope = (typeof API_SCOPES)[number];
export type ApiKeyEnvironment = "test" | "live";

export interface ApiKeyRecord {
  id: string;
  userId: string;
  name: string;
  prefix: string;
  keyHash: string;
  environment: ApiKeyEnvironment;
  status: "active" | "revoked" | "expired";
  scopes: ApiScope[];
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
}

export interface CreatedApiKey {
  record: ApiKeyRecord;
  secret: string;
}

export function createApiKey(
  userId: string,
  name: string,
  environment: ApiKeyEnvironment,
  scopes: ApiScope[],
  now = new Date(),
): CreatedApiKey {
  const prefix = environment === "live" ? "sp_live_" : "sp_test_";
  const secret = `${prefix}${randomBytes(32).toString("base64url")}`;
  return {
    record: {
      id: randomUUID(),
      userId,
      name,
      prefix: `${prefix}${secret.slice(prefix.length, prefix.length + 6)}...`,
      keyHash: hashApiKey(secret),
      environment,
      status: "active",
      scopes: [...new Set(scopes)],
      createdAt: now.toISOString(),
    },
    secret,
  };
}

export function hashApiKey(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}
export function hasApiScope(
  record: Pick<ApiKeyRecord, "scopes" | "status" | "expiresAt">,
  required: ApiScope,
  now = new Date(),
) {
  return (
    record.status === "active" &&
    (!record.expiresAt || new Date(record.expiresAt) > now) &&
    record.scopes.includes(required)
  );
}
export function invalidApiKeyResponse(
  code: "INVALID_API_KEY" | "API_KEY_REVOKED" | "API_KEY_EXPIRED" | "INSUFFICIENT_SCOPE",
) {
  return {
    error: {
      code,
      message:
        code === "INSUFFICIENT_SCOPE"
          ? "This API key does not have the required scope."
          : "The API key is invalid or unavailable.",
    },
  };
}

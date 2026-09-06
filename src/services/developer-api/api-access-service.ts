import type { ProviderDataPolicy } from "../solar-data/types";
import {
  hasApiScope,
  invalidApiKeyResponse,
  type ApiKeyRecord,
  type ApiScope,
} from "./api-key-service.ts";

export interface ApiAccessDecision {
  allowed: boolean;
  response?: { error: { code: string; message: string } };
}

export function authorizeApiRequest(
  key: ApiKeyRecord | null,
  requiredScope: ApiScope,
  policy: ProviderDataPolicy,
  now = new Date(),
): ApiAccessDecision {
  if (!key || key.status !== "active")
    return {
      allowed: false,
      response: invalidApiKeyResponse(
        key?.status === "revoked"
          ? "API_KEY_REVOKED"
          : key?.status === "expired"
            ? "API_KEY_EXPIRED"
            : "INVALID_API_KEY",
      ),
    };
  if (key.expiresAt && new Date(key.expiresAt) <= now)
    return { allowed: false, response: invalidApiKeyResponse("API_KEY_EXPIRED") };
  if (!hasApiScope(key, requiredScope, now))
    return { allowed: false, response: invalidApiKeyResponse("INSUFFICIENT_SCOPE") };
  if (!policy.apiExposureAllowed)
    return {
      allowed: false,
      response: {
        error: {
          code: "DATA_NOT_AVAILABLE_FOR_API",
          message: "This provider data is currently restricted from Developer API exposure.",
        },
      },
    };
  return { allowed: true };
}

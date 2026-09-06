import assert from "node:assert/strict";
import test from "node:test";
import { authorizeApiRequest } from "./api-access-service.ts";
import { createApiKey, hashApiKey, hasApiScope } from "./api-key-service.ts";
import { rateLimitDecision } from "./api-rate-limit-service.ts";

test("creates a one-time secret and stores only a hash", () => {
  const created = createApiKey("user-1", "Research", "test", ["solar:resource:read"]);
  assert.match(created.secret, /^sp_test_/);
  assert.notEqual(created.record.keyHash, created.secret);
  assert.equal(created.record.keyHash, hashApiKey(created.secret));
  assert.equal(hasApiScope(created.record, "solar:resource:read"), true);
});
test("revoked keys, scopes, and provider policy are enforced", () => {
  const created = createApiKey("user-1", "Research", "live", ["solar:resource:read"]);
  const restricted = {
    provider: "pvgis",
    mode: "internal_only" as const,
    redistributionAllowed: false,
    attributionRequired: true,
    commercialUseAllowed: false,
    cacheAllowed: true,
    maximumCacheDurationSeconds: 60,
    apiExposureAllowed: false,
  };
  assert.equal(
    authorizeApiRequest(created.record, "solar:resource:read", restricted).allowed,
    false,
  );
  assert.equal(
    authorizeApiRequest({ ...created.record, status: "revoked" }, "solar:resource:read", {
      ...restricted,
      apiExposureAllowed: true,
    }).response?.error.code,
    "API_KEY_REVOKED",
  );
});
test("rate limits return a structured denial", () => {
  const result = rateLimitDecision(
    { requestsPerMinute: 2, requestsPerDay: 10, monthlyRequestLimit: 100 },
    { minute: 2, day: 2, month: 2 },
  );
  assert.equal(result.allowed, false);
  assert.equal(result.code, "API_RATE_LIMIT_EXCEEDED");
});

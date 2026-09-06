export interface RateLimit {
  requestsPerMinute: number;
  requestsPerDay: number;
  monthlyRequestLimit: number;
}
export interface UsageWindow {
  minute: number;
  day: number;
  month: number;
}
export function rateLimitDecision(limit: RateLimit, usage: UsageWindow) {
  if (
    usage.minute >= limit.requestsPerMinute ||
    usage.day >= limit.requestsPerDay ||
    usage.month >= limit.monthlyRequestLimit
  )
    return { allowed: false, retryAfterSeconds: 60, code: "API_RATE_LIMIT_EXCEEDED" as const };
  return { allowed: true, retryAfterSeconds: 0, code: null };
}

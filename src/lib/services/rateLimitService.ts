/**
 * MOCK IMPLEMENTATION for MVP rate limiting.
 * In production, this would use Redis or similar.
 */

const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

const MAX_REQUESTS = 100;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function checkIpLimit(ip: string): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const now = Date.now();
  const record = ipRequestCounts.get(ip);

  if (!record || now > record.resetTime) {
    ipRequestCounts.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return { success: true, limit: MAX_REQUESTS, remaining: MAX_REQUESTS - 1, reset: now + WINDOW_MS };
  }

  if (record.count >= MAX_REQUESTS) {
    return { success: false, limit: MAX_REQUESTS, remaining: 0, reset: record.resetTime };
  }

  record.count += 1;
  return { success: true, limit: MAX_REQUESTS, remaining: MAX_REQUESTS - record.count, reset: record.resetTime };
}

const WINDOW_MS = 60 * 1000; // 1 minute sliding window

const LIMITS: Record<string, number> = {
  metadata: 10,   // format list lookups per minute
  download: 5,    // download requests per minute
  default: 20,    // everything else
};

// keyed by `${ip}:${endpoint}`
const store = new Map<string, { count: number; resetTime: number }>();

export async function checkIpLimit(
  ip: string,
  endpoint: keyof typeof LIMITS = 'default',
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const key = `${ip}:${endpoint}`;
  const limit = LIMITS[endpoint] ?? LIMITS.default;
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetTime) {
    store.set(key, { count: 1, resetTime: now + WINDOW_MS });
    return { success: true, limit, remaining: limit - 1, reset: now + WINDOW_MS };
  }

  if (record.count >= limit) {
    return { success: false, limit, remaining: 0, reset: record.resetTime };
  }

  record.count += 1;
  return { success: true, limit, remaining: limit - record.count, reset: record.resetTime };
}

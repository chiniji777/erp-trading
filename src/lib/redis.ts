import { Redis } from "@upstash/redis";

// Redis instance - only created if env vars are set
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

/**
 * Cache wrapper - returns cached data if available, otherwise calls fetcher
 * Falls back to direct DB call if Redis is not configured
 */
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 30
): Promise<T> {
  if (!redis) {
    return fetcher();
  }

  try {
    const cachedData = await redis.get<T>(key);
    if (cachedData !== null && cachedData !== undefined) {
      return cachedData;
    }
  } catch {
    // Redis error - fall through to fetcher
  }

  const data = await fetcher();

  try {
    await redis.set(key, JSON.stringify(data), { ex: ttlSeconds });
  } catch {
    // Redis error - data still returned from fetcher
  }

  return data;
}

/**
 * Invalidate cache keys by pattern prefix
 * Uses SCAN to find and delete all keys matching the prefix
 */
export async function invalidateCache(prefix: string): Promise<void> {
  if (!redis) return;

  try {
    const result = await redis.scan(0, { match: `${prefix}*`, count: 200 });
    const keys = result[1] as string[];
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Redis error - silently fail
  }
}

/**
 * Invalidate a specific cache key
 */
export async function invalidateKey(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    // Redis error - silently fail
  }
}

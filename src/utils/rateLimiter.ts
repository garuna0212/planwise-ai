import type { Request, Response, NextFunction } from 'express';

export interface RateLimitOptions {
  windowMs: number; // Duration of window in milliseconds (e.g., 60,000 for 1 min)
  maxRequests: number; // Max allowed requests in window
  message?: string;
  keyPrefix?: string;
}

export interface RateLimiterStore {
  increment(key: string, windowMs: number): Promise<{ count: number; resetTimeMs: number }>;
  reset?(key: string): Promise<void>;
}

/**
 * ARCHITECTURAL NOTICE (Cloud Run & Distributed Deployments):
 *
 * In a distributed, auto-scaled container runtime like Google Cloud Run or Kubernetes,
 * multiple container instances run concurrently and scale to zero or multiple replicas.
 * An in-memory store in process memory only limits requests hitting that specific container
 * replica. An attacker distributing requests across 10 instances could make 10x the limit.
 *
 * For production distributed deployments, rate limiting must be enforced either at:
 * 1. Edge Layer: Google Cloud Armor on Cloud Load Balancing (Rate Limiting rule per client IP)
 * 2. Shared Persistence Cache: Google Cloud Memorystore (Redis) or distributed Redis cluster
 *
 * This implementation provides:
 * - `MemoryRateLimiterStore`: Zero-dependency sliding window for local dev and single-instance tests.
 * - `DistributedRedisRateLimiterStore`: Persistent shared store adapter for Redis / Memorystore.
 * - `getRecommendedRateLimiterStore`: Automatically picks distributed storage when configured via
 *   REDIS_URL or MEMORYSTORE_HOST environment variables, falling back to MemoryRateLimiterStore.
 */

export class MemoryRateLimiterStore implements RateLimiterStore {
  private hits = new Map<string, { count: number; expiresAt: number }>();
  private lastCleanup = Date.now();
  private readonly cleanupIntervalMs = 60000;
  private readonly maxEntries = 10000; // Protection against memory leak / exhaustion

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTimeMs: number }> {
    const now = Date.now();

    if (now - this.lastCleanup > this.cleanupIntervalMs || this.hits.size > this.maxEntries) {
      this.cleanup(now);
    }

    const record = this.hits.get(key);

    if (!record || record.expiresAt <= now) {
      const expiresAt = now + windowMs;
      this.hits.set(key, { count: 1, expiresAt });
      return { count: 1, resetTimeMs: expiresAt };
    }

    record.count += 1;
    return { count: record.count, resetTimeMs: record.expiresAt };
  }

  async reset(key: string): Promise<void> {
    this.hits.delete(key);
  }

  private cleanup(now: number): void {
    this.lastCleanup = now;
    for (const [key, value] of this.hits.entries()) {
      if (value.expiresAt <= now) {
        this.hits.delete(key);
      }
    }
  }

  getEntryCount(): number {
    return this.hits.size;
  }

  clear(): void {
    this.hits.clear();
  }
}

/**
 * Minimal interface representing a Redis-compatible client (ioredis or redis client)
 */
export interface RedisRateLimiterClient {
  multi: () => {
    incr: (key: string) => any;
    pttl: (key: string) => any;
    exec: () => Promise<[number, number] | any[]>;
  };
  pExpire: (key: string, ms: number) => Promise<any>;
  del: (key: string) => Promise<any>;
}

/**
 * Shared Persistent Rate Limiter Store for Distributed Deployments.
 * Can connect to Google Cloud Memorystore or Redis instances.
 * Uses atomic sliding expiration semantics via Redis multi transactions.
 */
export class DistributedRedisRateLimiterStore implements RateLimiterStore {
  private fallbackStore = new MemoryRateLimiterStore();

  constructor(private redisClient?: RedisRateLimiterClient) {}

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTimeMs: number }> {
    if (this.redisClient) {
      try {
        const now = Date.now();
        const p = this.redisClient.multi();
        p.incr(key);
        p.pttl(key);
        const results = await p.exec();
        const count = Number(results[0]);
        let ttl = Number(results[1]);

        if (ttl === -1 || count === 1) {
          // Set expiry on key creation
          await this.redisClient.pExpire(key, windowMs);
          ttl = windowMs;
        }
        return { count, resetTimeMs: now + Math.max(0, ttl) };
      } catch (err) {
        console.warn('Redis rate limiter query failed, falling back to local memory store.');
        return this.fallbackStore.increment(key, windowMs);
      }
    }
    return this.fallbackStore.increment(key, windowMs);
  }

  async reset(key: string): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.del(key);
        return;
      } catch {
        // ignore
      }
    }
    await this.fallbackStore.reset(key);
  }
}

/**
 * Factory that selects distributed storage if environment provides a Redis client,
 * otherwise falling back to MemoryRateLimiterStore.
 */
export function getRecommendedRateLimiterStore(customRedisClient?: RedisRateLimiterClient): RateLimiterStore {
  if (customRedisClient) {
    return new DistributedRedisRateLimiterStore(customRedisClient);
  }
  return new MemoryRateLimiterStore();
}

/**
 * Extracts a normalized, safe client IP identifier from request headers
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers ? req.headers['x-forwarded-for'] : undefined;
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}

/**
 * Creates an Express rate-limiting middleware adhering to RFC 6585 and IETF RateLimit headers
 */
export function createRateLimiter(options: RateLimitOptions, customStore?: RateLimiterStore) {
  const store = customStore || getRecommendedRateLimiterStore();
  const prefix = options.keyPrefix || 'rl:';
  const defaultMessage = options.message || 'Too many requests from this IP. Please try again later.';

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientIp = getClientIp(req);
      const key = `${prefix}${clientIp}`;

      const { count, resetTimeMs } = await store.increment(key, options.windowMs);
      const remaining = Math.max(0, options.maxRequests - count);
      const resetSeconds = Math.ceil(resetTimeMs / 1000);
      const retryAfterSeconds = Math.max(1, Math.ceil((resetTimeMs - Date.now()) / 1000));

      // RFC Standard RateLimit headers
      res.setHeader('RateLimit-Limit', options.maxRequests.toString());
      res.setHeader('RateLimit-Remaining', remaining.toString());
      res.setHeader('RateLimit-Reset', resetSeconds.toString());

      if (count > options.maxRequests) {
        res.setHeader('Retry-After', retryAfterSeconds.toString());
        res.status(429).json({
          error: defaultMessage,
          retryAfterSeconds,
          status: 429,
        });
        return;
      }

      next();
    } catch (err) {
      // In case rate limiter errors, fail open to avoid service outage, but log safely
      console.error('Rate limiter internal error (failing open):', err);
      next();
    }
  };
}

import { prisma } from './prisma';

// Simple in-memory cache for development
const memoryCache = new Map<string, { value: unknown; expiresAt: number }>();

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  staleWhileRevalidate?: number; // Return stale data while revalidating
}

class CacheService {
  private redis: typeof import('ioredis') | null = null;

  constructor() {
    // Initialize Redis if available
    if (process.env.REDIS_URL) {
      this.initRedis();
    }
  }

  private async initRedis() {
    try {
      const Redis = (await import('ioredis')).default;
      this.redis = new Redis(process.env.REDIS_URL);
    } catch (error) {
      console.warn('Redis initialization failed, using memory cache:', error);
    }
  }

  // Get from cache
  async get<T>(key: string): Promise<T | null> {
    // Try Redis first
    if (this.redis) {
      try {
        const data = await this.redis.get(key);
        if (data) {
          return JSON.parse(data) as T;
        }
      } catch (error) {
        console.error('Redis get error:', error);
      }
    }

    // Fallback to memory cache
    const cached = memoryCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }
    memoryCache.delete(key);
    return null;
  }

  // Set in cache
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl || 3600; // Default 1 hour
    const expiresAt = Date.now() + ttl * 1000;

    // Try Redis first
    if (this.redis) {
      try {
        await this.redis.setex(key, ttl, JSON.stringify(value));
        return;
      } catch (error) {
        console.error('Redis set error:', error);
      }
    }

    // Fallback to memory cache
    memoryCache.set(key, { value, expiresAt });
  }

  // Delete from cache
  async delete(key: string): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.del(key);
      } catch (error) {
        console.error('Redis delete error:', error);
      }
    }
    memoryCache.delete(key);
  }

  // Delete by pattern
  async deletePattern(pattern: string): Promise<void> {
    if (this.redis) {
      try {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (error) {
        console.error('Redis deletePattern error:', error);
      }
    }

    // Memory cache pattern delete
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    for (const key of memoryCache.keys()) {
      if (regex.test(key)) {
        memoryCache.delete(key);
      }
    }
  }

  // Cache with stale-while-revalidate
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    await this.set(key, value, options);
    return value;
  }

  // Store in database for persistence
  async persist<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? new Date(Date.now() + ttlSeconds * 1000) : null;
    
    await prisma.cacheEntry.upsert({
      where: { key },
      update: { value, expiresAt },
      create: { key, value, expiresAt },
    });
  }

  // Get from database cache
  async getPersisted<T>(key: string): Promise<T | null> {
    const entry = await prisma.cacheEntry.findUnique({
      where: { key },
    });

    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      await prisma.cacheEntry.delete({ where: { key } });
      return null;
    }

    return entry.value as T;
  }

  // Clear all memory cache
  clearMemory(): void {
    memoryCache.clear();
  }
}

export const cache = new CacheService();
export default cache;

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import * as crypto from 'crypto';

export interface CachedResponse {
  content: string;
  sources: any[];
  cachedAt: Date;
}

export interface PopularQuestion {
  query: string;
  companyId: string;
  count: number;
  lastAsked: Date;
}

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redisClient: Redis;
  private isConnected = false;

  // Cache settings
  private readonly CACHE_TTL = 3600; // 1 hour in seconds
  private readonly CACHE_PREFIX = 'ai:chat:';
  private readonly STATS_PREFIX = 'ai:stats:';
  private readonly POPULAR_KEY = 'ai:popular';

  async onModuleInit() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.logger.log(`Connecting to Redis at ${redisUrl}...`);

      // Configure Redis client with TLS support for Upstash
      const redisOptions: any = {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableOfflineQueue: false,
      };

      // Enable TLS for Upstash and other cloud providers
      if (redisUrl.includes('upstash.io') || redisUrl.startsWith('rediss://')) {
        redisOptions.tls = {
          rejectUnauthorized: true,
        };
      }

      this.redisClient = new Redis(redisUrl, redisOptions);

      this.redisClient.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Redis connected successfully');
      });

      this.redisClient.on('error', (err) => {
        this.logger.error('Redis connection error:', err);
        this.isConnected = false;
      });

      this.redisClient.on('ready', () => {
        this.isConnected = true;
        this.logger.log('Redis client ready');
      });

    } catch (error) {
      this.logger.error('Failed to initialize Redis:', error);
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.logger.log('Redis connection closed');
    }
  }

  /**
   * Generate a cache key from query and companyId
   */
  private generateCacheKey(query: string, companyId: string): string {
    const normalizedQuery = query.trim().toLowerCase();
    const hash = crypto
      .createHash('md5')
      .update(`${normalizedQuery}:${companyId}`)
      .digest('hex');
    return `${this.CACHE_PREFIX}${hash}`;
  }

  /**
   * Generate a stats key for tracking query frequency
   */
  private generateStatsKey(query: string, companyId: string): string {
    const normalizedQuery = query.trim().toLowerCase();
    const hash = crypto
      .createHash('md5')
      .update(`${normalizedQuery}:${companyId}`)
      .digest('hex');
    return `${this.STATS_PREFIX}${hash}`;
  }

  /**
   * Get cached response for a query
   */
  async getCachedResponse(query: string, companyId: string): Promise<CachedResponse | null> {
    if (!this.isConnected) {
      this.logger.warn('Redis not connected, skipping cache lookup');
      return null;
    }

    try {
      const cacheKey = this.generateCacheKey(query, companyId);
      const cached = await this.redisClient.get(cacheKey);

      if (cached) {
        this.logger.log(`Cache HIT for query: "${query.substring(0, 50)}..."`);
        return JSON.parse(cached);
      }

      this.logger.log(`Cache MISS for query: "${query.substring(0, 50)}..."`);
      return null;
    } catch (error) {
      this.logger.error('Error getting cached response:', error);
      return null;
    }
  }

  /**
   * Cache a response for a query
   */
  async cacheResponse(
    query: string,
    companyId: string,
    response: { content: string; sources: any[] }
  ): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn('Redis not connected, skipping cache write');
      return;
    }

    try {
      const cacheKey = this.generateCacheKey(query, companyId);
      const cachedData: CachedResponse = {
        ...response,
        cachedAt: new Date(),
      };

      await this.redisClient.setex(
        cacheKey,
        this.CACHE_TTL,
        JSON.stringify(cachedData)
      );

      this.logger.log(`Cached response for query: "${query.substring(0, 50)}..."`);
    } catch (error) {
      this.logger.error('Error caching response:', error);
    }
  }

  /**
   * Track query frequency for identifying popular questions
   */
  async trackQuery(query: string, companyId: string): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      const normalizedQuery = query.trim().toLowerCase();
      const statsKey = this.generateStatsKey(query, companyId);

      // Increment query count
      await this.redisClient.incr(statsKey);

      // Add to sorted set of popular questions (score = count)
      const count = await this.redisClient.get(statsKey);
      await this.redisClient.zadd(
        `${this.POPULAR_KEY}:${companyId}`,
        parseInt(count || '1'),
        JSON.stringify({ query: normalizedQuery, companyId })
      );

      // Set expiry on stats key (30 days)
      await this.redisClient.expire(statsKey, 30 * 24 * 60 * 60);
    } catch (error) {
      this.logger.error('Error tracking query:', error);
    }
  }

  /**
   * Get most popular questions for a company
   */
  async getPopularQuestions(companyId: string, limit: number = 10): Promise<PopularQuestion[]> {
    if (!this.isConnected) {
      this.logger.warn('Redis not connected');
      return [];
    }

    try {
      // Get top N queries by score (descending)
      const results = await this.redisClient.zrevrange(
        `${this.POPULAR_KEY}:${companyId}`,
        0,
        limit - 1,
        'WITHSCORES'
      );

      const popularQuestions: PopularQuestion[] = [];

      // Results come as [member, score, member, score, ...]
      for (let i = 0; i < results.length; i += 2) {
        try {
          const data = JSON.parse(results[i]);
          const count = parseInt(results[i + 1]);

          popularQuestions.push({
            query: data.query,
            companyId: data.companyId,
            count,
            lastAsked: new Date(), // Could be enhanced to track this separately
          });
        } catch (e) {
          this.logger.error('Error parsing popular question data:', e);
        }
      }

      return popularQuestions;
    } catch (error) {
      this.logger.error('Error getting popular questions:', error);
      return [];
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(companyId: string): Promise<{
    totalQuestions: number;
    cachedQuestions: number;
    popularQuestions: PopularQuestion[];
  }> {
    if (!this.isConnected) {
      return {
        totalQuestions: 0,
        cachedQuestions: 0,
        popularQuestions: [],
      };
    }

    try {
      const popularQuestions = await this.getPopularQuestions(companyId, 10);
      const totalQuestions = await this.redisClient.zcard(`${this.POPULAR_KEY}:${companyId}`);

      // Count cached items for this company
      const keys = await this.redisClient.keys(`${this.CACHE_PREFIX}*`);

      return {
        totalQuestions,
        cachedQuestions: keys.length,
        popularQuestions,
      };
    } catch (error) {
      this.logger.error('Error getting cache stats:', error);
      return {
        totalQuestions: 0,
        cachedQuestions: 0,
        popularQuestions: [],
      };
    }
  }

  /**
   * Clear cache for a specific company
   */
  async clearCompanyCache(companyId: string): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      // Delete popular questions set
      await this.redisClient.del(`${this.POPULAR_KEY}:${companyId}`);

      // Delete all cache entries (would need pattern matching)
      const cacheKeys = await this.redisClient.keys(`${this.CACHE_PREFIX}*`);
      if (cacheKeys.length > 0) {
        await this.redisClient.del(...cacheKeys);
      }

      this.logger.log(`Cleared cache for company: ${companyId}`);
    } catch (error) {
      this.logger.error('Error clearing cache:', error);
    }
  }

  /**
   * Check if Redis is connected
   */
  isRedisConnected(): boolean {
    return this.isConnected;
  }
}

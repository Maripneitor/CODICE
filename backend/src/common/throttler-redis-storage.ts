import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';

interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

@Injectable()
export class ThrottlerRedisStorage implements ThrottlerStorage, OnModuleDestroy {
  private readonly redis: Redis;
  private useMemoryFallback = false;
  private readonly fallbackMemory = new Map<string, { totalHits: number; expiresAt: number }>();

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      maxRetriesPerRequest: 1, // Minimize block time on Redis fail
    });

    this.redis.on('error', (err) => {
      console.error('ThrottlerRedisStorage: Redis connection error, falling back to memory storage.', err.message);
      this.useMemoryFallback = true;
    });
    
    this.redis.on('connect', () => {
      console.log('ThrottlerRedisStorage: Redis connected successfully.');
      this.useMemoryFallback = false;
    });
  }

  /**
   * Increment the counter for the given key.
   */
  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    if (this.useMemoryFallback) {
      return this.incrementFallback(key, ttl, limit, blockDuration);
    }

    try {
      const ttlSeconds = Math.ceil(ttl / 1000);
      const multi = this.redis.multi();
      multi.incr(key);
      multi.ttl(key);
      
      const results = await multi.exec();
      if (!results) {
        return { totalHits: 1, timeToExpire: ttl, isBlocked: false, timeToBlockExpire: 0 };
      }

      const totalHits = results[0][1] as number;
      let timeToExpireSeconds = results[1][1] as number;

      // If key does not have an expiration, set it
      if (timeToExpireSeconds < 0) {
        await this.redis.expire(key, ttlSeconds);
        timeToExpireSeconds = ttlSeconds;
      }

      const timeToExpire = timeToExpireSeconds * 1000;
      const isBlocked = totalHits > limit;
      const timeToBlockExpire = isBlocked ? Math.ceil(blockDuration / 1000) : 0;

      return { 
        totalHits, 
        timeToExpire,
        isBlocked,
        timeToBlockExpire,
      };
    } catch (err) {
      console.error('ThrottlerRedisStorage: Redis error during increment. Falling back to memory storage.', err);
      this.useMemoryFallback = true;
      return this.incrementFallback(key, ttl, limit, blockDuration);
    }
  }

  private incrementFallback(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
  ): ThrottlerStorageRecord {
    const now = Date.now();
    let record = this.fallbackMemory.get(key);

    if (!record || record.expiresAt < now) {
      record = { totalHits: 0, expiresAt: now + ttl };
    }

    record.totalHits += 1;
    this.fallbackMemory.set(key, record);

    const timeToExpire = record.expiresAt - now;
    const isBlocked = record.totalHits > limit;
    const timeToBlockExpire = isBlocked ? blockDuration : 0;

    return {
      totalHits: record.totalHits,
      timeToExpire,
      isBlocked,
      timeToBlockExpire,
    };
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }
}

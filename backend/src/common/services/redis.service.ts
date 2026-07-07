import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    });

    this.redis.on('error', (err) => {
      console.error('RedisService connection error:', err.message);
    });
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.redis.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.redis.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async addToBlacklist(tokenId: string, ttlSeconds: number): Promise<void> {
    await this.set(`blacklist:${tokenId}`, 'true', ttlSeconds);
  }

  async isBlacklisted(tokenId: string): Promise<boolean> {
    return this.exists(`blacklist:${tokenId}`);
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }
}

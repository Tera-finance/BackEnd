import Redis from 'ioredis';
import { config } from './config.js';

// Mock Redis for development if Redis is not available
class MockRedis {
  private storage: Map<string, { value: string; expires?: number }>;

  constructor() {
    this.storage = new Map();
  }

  async get(key: string): Promise<string | null> {
    const item = this.storage.get(key);
    if (!item) return null;

    if (item.expires && Date.now() > item.expires) {
      this.storage.delete(key);
      return null;
    }

    return item.value;
  }

  async set(key: string, value: string): Promise<string> {
    this.storage.set(key, { value });
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<string> {
    this.storage.set(key, {
      value,
      expires: Date.now() + (seconds * 1000)
    });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    return this.storage.delete(key) ? 1 : 0;
  }

  async ping(): Promise<string> {
    return 'PONG';
  }

  async quit(): Promise<string> {
    this.storage.clear();
    return 'OK';
  }

  on(event: string, callback: (...args: any[]) => void): this {
    // Mock event listener
    return this;
  }
}

let redis: Redis | MockRedis;

// Always start with mock in development
if (config.nodeEnv === 'development') {
  redis = new MockRedis();
  console.log('⚠️  Using mock Redis (development mode)');
} else {
  try {
    redis = new Redis(config.redis.url, {
      enableReadyCheck: false,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      connectTimeout: 1000,
      commandTimeout: 1000
    });

    redis.on('error', (error: Error) => {
      console.warn('Redis connection error, falling back to mock:', error.message);
      redis = new MockRedis();
    });

    redis.on('connect', () => {
      console.log('✅ Connected to Redis');
    });
  } catch (error) {
    console.warn('Redis not available, using in-memory mock');
    redis = new MockRedis();
  }
}

export { redis };

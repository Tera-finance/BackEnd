import Redis from 'ioredis';
import { config } from './config.js';
// Mock Redis for development if Redis is not available
class MockRedis {
    constructor() {
        this.storage = new Map();
    }
    async get(key) {
        const item = this.storage.get(key);
        if (!item)
            return null;
        if (item.expires && Date.now() > item.expires) {
            this.storage.delete(key);
            return null;
        }
        return item.value;
    }
    async set(key, value) {
        this.storage.set(key, { value });
        return 'OK';
    }
    async setex(key, seconds, value) {
        this.storage.set(key, {
            value,
            expires: Date.now() + (seconds * 1000)
        });
        return 'OK';
    }
    async del(key) {
        return this.storage.delete(key) ? 1 : 0;
    }
    async ping() {
        return 'PONG';
    }
    async quit() {
        this.storage.clear();
        return 'OK';
    }
    on(event, callback) {
        // Mock event listener
        return this;
    }
}
let redis;
// Always start with mock in development
if (config.nodeEnv === 'development') {
    redis = new MockRedis();
    console.log('⚠️  Using mock Redis (development mode)');
}
else {
    try {
        redis = new Redis(config.redis.url, {
            enableReadyCheck: false,
            maxRetriesPerRequest: 1,
            lazyConnect: true,
            connectTimeout: 1000,
            commandTimeout: 1000
        });
        redis.on('error', (error) => {
            console.warn('Redis connection error, falling back to mock:', error.message);
            redis = new MockRedis();
        });
        redis.on('connect', () => {
            console.log('✅ Connected to Redis');
        });
    }
    catch (error) {
        console.warn('Redis not available, using in-memory mock');
        redis = new MockRedis();
    }
}
export { redis };

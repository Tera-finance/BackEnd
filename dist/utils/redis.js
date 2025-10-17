import { config } from './config.js';
// Simple in-memory Redis mock for serverless environments
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
// Redis client for serverless (using upstash-redis for better compatibility)
class UpstashRedis {
    constructor(url) {
        // Parse Upstash Redis URL: rediss://default:token@host:port
        const match = url.match(/rediss?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)/);
        if (!match) {
            throw new Error('Invalid Redis URL format');
        }
        const [, , token, host, port] = match;
        this.baseUrl = `https://${host}`;
        this.token = token;
    }
    async request(command) {
        try {
            const response = await fetch(`${this.baseUrl}/${command.join('/')}`, {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                },
            });
            if (!response.ok) {
                throw new Error(`Redis request failed: ${response.statusText}`);
            }
            const data = await response.json();
            return data.result;
        }
        catch (error) {
            console.error('Redis request error:', error);
            throw error;
        }
    }
    async get(key) {
        return await this.request(['GET', key]);
    }
    async set(key, value) {
        await this.request(['SET', key, value]);
        return 'OK';
    }
    async setex(key, seconds, value) {
        await this.request(['SETEX', key, seconds.toString(), value]);
        return 'OK';
    }
    async del(key) {
        return await this.request(['DEL', key]);
    }
    async ping() {
        return await this.request(['PING']);
    }
    async quit() {
        return 'OK';
    }
    on(event, callback) {
        // Event listener stub for compatibility
        return this;
    }
}
let redis;
// Use Upstash Redis in production, Mock in development
if (config.nodeEnv === 'production' && config.redis.url.includes('upstash.io')) {
    try {
        redis = new UpstashRedis(config.redis.url);
        console.log('✅ Using Upstash Redis (production)');
    }
    catch (error) {
        console.warn('Failed to initialize Upstash Redis, using mock:', error);
        redis = new MockRedis();
    }
}
else {
    redis = new MockRedis();
    console.log('⚠️  Using mock Redis (development mode)');
}
export { redis };

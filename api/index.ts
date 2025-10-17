import app from '../src/app.js';
import { testConnection } from '../src/utils/database.js';
import { redis } from '../src/utils/redis.js';

// Initialize connections on first request (cold start)
let initialized = false;

async function initialize() {
  if (!initialized) {
    try {
      // Test MySQL database connection
      const dbConnected = await testConnection();
      if (dbConnected) {
        console.log('✅ Connected to MySQL database');
      } else {
        console.warn('⚠️  MySQL connection test failed');
      }

      // Test Redis connection
      await redis.ping();
      console.log('✅ Connected to Redis');

      initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize:', error);
      // Don't throw - allow requests to proceed even if connections fail
    }
  }
}

// Export the Express app as a Vercel serverless function
export default async function handler(req: any, res: any) {
  await initialize();
  return app(req, res);
}

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

      // Test Redis connection (optional - don't fail if Redis is down)
      try {
        await redis.ping();
        console.log('✅ Connected to Redis');
      } catch (redisError) {
        console.warn('⚠️  Redis connection failed:', redisError.message);
      }

      initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize:', error);
      // Don't throw - allow requests to proceed even if connections fail
    }
  }
}

// Export the Express app as a Vercel serverless function
export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  await initialize();
  return app(req, res);
}

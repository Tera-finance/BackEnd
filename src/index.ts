import app from './app.js';
import { config } from './utils/config.js';
import { testConnection, closePool } from './utils/database.js';
import { redis } from './utils/redis.js';

async function startServer() {
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

    // Start server
    const server = app.listen(config.port, () => {
      console.log(`🚀 TrustBridge Backend running on port ${config.port}`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
      console.log(`� Cardano Network: ${config.cardano.network}`);
      console.log(`💾 Database: MySQL`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('HTTP server closed.');
        
        try {
          await closePool();
          console.log('MySQL connection pool closed.');
          
          await redis.quit();
          console.log('Redis connection closed.');
          
          console.log('Graceful shutdown completed.');
          process.exit(0);
        } catch (error) {
          console.error('Error during shutdown:', error);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
import app from './app';
import { config } from './utils/config';
import { prisma } from './utils/database';
import { redis } from './utils/redis';

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL database');

    // Test Redis connection
    await redis.ping();
    console.log('✅ Connected to Redis');

    // Start server
    const server = app.listen(config.port, () => {
      console.log(`🚀 TrustBridge Backend running on port ${config.port}`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
      console.log(`📱 WhatsApp webhook ready at /api/whatsapp/webhook`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('HTTP server closed.');
        
        try {
          await prisma.$disconnect();
          console.log('Database connection closed.');
          
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
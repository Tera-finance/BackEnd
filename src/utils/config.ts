import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/trustbridge'
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
    expiresIn: '15m',
    refreshExpiresIn: '7d'
  },
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY || ''
  },
  
  blockchain: {
    polygonRpcUrl: process.env.POLYGON_RPC_URL || '',
    polygonTestnetRpcUrl: process.env.POLYGON_TESTNET_RPC_URL || '',
    privateKey: process.env.PRIVATE_KEY || ''
  },
  
  ipfs: {
    apiUrl: process.env.IPFS_API_URL || 'http://localhost:5001'
  },
  
  whatsapp: {
    apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || ''
  },
  
  indodax: {
    apiUrl: process.env.INDODAX_API_URL || 'https://indodax.com/api'
  },
  
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key'
  },
  
  rateLimiting: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
  }
};
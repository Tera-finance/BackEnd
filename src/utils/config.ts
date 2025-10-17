import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',

  // MySQL Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'trustbridge',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'trustbridge'
  },

  // Redis Cache
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },

  // JWT Authentication
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
    expiresIn: '15m',
    refreshExpiresIn: '7d'
  },

  // Base Sepolia Blockchain Configuration
  blockchain: {
    network: 'base-sepolia',
    chainId: 84532,
    rpcUrl: process.env.RPC_URL || 'https://sepolia.base.org',
    privateKey: process.env.PRIVATE_KEY || '',
    explorerUrl: 'https://sepolia.basescan.org'
  },

  // Smart Contract Addresses on Base Sepolia
  contracts: {
    remittanceSwap: process.env.REMITTANCE_SWAP_ADDRESS || '',
    multiTokenSwap: process.env.MULTI_TOKEN_SWAP_ADDRESS || '',
    // Mock token addresses
    usdc: process.env.USDC_ADDRESS || '',
    idrx: process.env.IDRX_ADDRESS || '',
    cnht: process.env.CNHT_ADDRESS || '',
    euroc: process.env.EUROC_ADDRESS || '',
    jpyc: process.env.JPYC_ADDRESS || '',
    mxnt: process.env.MXNT_ADDRESS || ''
  },

  // Exchange Rates API (for fiat conversions)
  exchange: {
    apiKey: process.env.EXCHANGE_RATE_API_KEY || '',
    apiUrl: process.env.EXCHANGE_RATE_API_URL || 'https://api.exchangerate-api.com/v4/latest'
  },

  // Encryption
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key'
  },

  // Rate Limiting
  rateLimiting: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
  }
};

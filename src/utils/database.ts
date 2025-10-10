import mysql from 'mysql2/promise';
import { config } from './config.js';

// Create MySQL connection pool
export const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Helper function to execute queries
export const query = async <T = any>(sql: string, params?: any[]): Promise<T[]> => {
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
};

// Helper function to execute single row query
export const queryOne = async <T = any>(sql: string, params?: any[]): Promise<T | null> => {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
};

// Helper function to test connection
export const testConnection = async (): Promise<boolean> => {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Graceful shutdown
export const closePool = async (): Promise<void> => {
  try {
    await pool.end();
    console.log('✅ MySQL connection pool closed');
  } catch (error) {
    console.error('❌ Error closing MySQL pool:', error);
  }
};

// Database types
export interface User {
  id: string;
  whatsapp_number: string;
  country_code: string;
  status: 'PENDING_KYC' | 'VERIFIED' | 'SUSPENDED';
  kyc_nft_token_id?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Transaction {
  id: string;
  sender_id: string;
  recipient_phone: string;
  source_currency: string;
  target_currency: string;
  source_amount: number;
  target_amount: number;
  exchange_rate: number;
  fee_amount: number;
  total_amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  blockchain_tx_hash?: string | null;
  recipient_bank_account?: string | null;
  created_at: Date;
  completed_at?: Date | null;
}

export interface CardanoToken {
  id: number;
  token_name: string;
  token_symbol: string;
  policy_id: string;
  asset_unit: string;
  decimals: number;
  total_supply: bigint;
  deployment_tx_hash: string;
  cardano_network: 'Preprod' | 'Mainnet';
  deployed_at: Date;
  is_active: boolean;
  description?: string | null;
}

export interface CardanoMint {
  id: number;
  token_id: number;
  amount: bigint;
  recipient_address: string;
  tx_hash: string;
  cardano_scan_url: string;
  redeemer_data?: string | null;
  created_at: Date;
}

export interface CardanoSwap {
  id: number;
  from_token_id: number;
  to_token_id: number;
  from_amount: bigint;
  to_amount: bigint;
  exchange_rate: number;
  sender_address: string;
  recipient_address: string;
  tx_hash: string;
  cardano_scan_url: string;
  swap_type: 'DIRECT' | 'VIA_HUB';
  hub_token_id?: number | null;
  created_at: Date;
}

export interface ExchangeRateCache {
  id: number;
  from_currency: string;
  to_currency: string;
  rate: number;
  source: string;
  cached_at: Date;
  expires_at: Date;
}
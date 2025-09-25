import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import { config } from './config';

// Initialize Supabase client
export const supabase = createClient(
  config.supabaseUrl || '',
  config.supabaseServiceRoleKey || ''
);

// Initialize PostgreSQL pool for direct SQL queries if needed
export const pgPool = new Pool({
  connectionString: config.databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

// Helper function to execute raw SQL queries
export const query = async (text: string, params?: any[]) => {
  const client = await pgPool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

// Database types matching the previous Prisma schema
export interface User {
  id: string;
  whatsapp_number: string;
  country_code: string;
  status: 'PENDING_KYC' | 'VERIFIED' | 'SUSPENDED';
  kyc_nft_token_id?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface KycData {
  id: string;
  user_id: string;
  document_type: 'E_KTP' | 'PASSPORT';
  document_number: string;
  full_name: string;
  date_of_birth: Date;
  address: string;
  ipfs_hash: string;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verified_at?: Date | null;
  created_at: Date;
}

export interface Wallet {
  id: string;
  user_id: string;
  wallet_address: string;
  private_key_encrypted: string;
  wallet_type: 'GENERATED' | 'IMPORTED';
  is_active: boolean;
  created_at: Date;
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
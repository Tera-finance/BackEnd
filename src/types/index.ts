// Re-export database types from our database module
export { User, KycData, Wallet, Transaction } from '../utils/database';

// Define enums that were previously from Prisma
export type UserStatus = 'PENDING_KYC' | 'VERIFIED' | 'SUSPENDED';
export type DocumentType = 'E_KTP' | 'PASSPORT';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type WalletType = 'GENERATED' | 'IMPORTED';
export type TransactionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface CreateUserRequest {
  whatsappNumber: string;
  countryCode: string;
}

export interface CreateKycRequest {
  userId: string;
  documentType: DocumentType;
  documentNumber: string;
  fullName: string;
  dateOfBirth: string;
  address: string;
  documentFile: Express.Multer.File;
}

export interface CreateTransactionRequest {
  recipientPhone: string;
  sourceCurrency: string;
  targetCurrency: string;
  sourceAmount: number;
}

export interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  text?: {
    body: string;
  };
  image?: {
    id: string;
    mime_type: string;
    sha256: string;
  };
}

export interface AIProcessingResult {
  intent: 'transfer' | 'balance' | 'rate' | 'history' | 'help' | 'kyc' | 'unknown';
  data?: any;
  response: string;
}

export interface ExchangeRateResponse {
  from: string;
  to: string;
  rate: number;
  timestamp: number;
}

export interface BlockchainTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  blockNumber: number;
}
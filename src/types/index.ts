import { User, KycData, Wallet, Transaction, UserStatus, DocumentType, VerificationStatus, WalletType, TransactionStatus } from '@prisma/client';

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

export {
  User,
  KycData,
  Wallet,
  Transaction,
  UserStatus,
  DocumentType,
  VerificationStatus,
  WalletType,
  TransactionStatus
};
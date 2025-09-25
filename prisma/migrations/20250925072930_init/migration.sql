-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "whatsapp_number" TEXT NOT NULL,
    "country_code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_KYC',
    "kyc_nft_token_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "kyc_data" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "document_number" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "date_of_birth" DATETIME NOT NULL,
    "address" TEXT NOT NULL,
    "ipfs_hash" TEXT NOT NULL,
    "verification_status" TEXT NOT NULL DEFAULT 'PENDING',
    "verified_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "kyc_data_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "private_key_encrypted" TEXT NOT NULL,
    "wallet_type" TEXT NOT NULL DEFAULT 'GENERATED',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sender_id" TEXT NOT NULL,
    "recipient_phone" TEXT NOT NULL,
    "source_currency" TEXT NOT NULL,
    "target_currency" TEXT NOT NULL,
    "source_amount" DECIMAL NOT NULL,
    "target_amount" DECIMAL NOT NULL,
    "exchange_rate" DECIMAL NOT NULL,
    "fee_amount" DECIMAL NOT NULL,
    "total_amount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "blockchain_tx_hash" TEXT,
    "recipient_bank_account" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    CONSTRAINT "transactions_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_whatsapp_number_key" ON "users"("whatsapp_number");

-- CreateIndex
CREATE UNIQUE INDEX "kyc_data_ipfs_hash_key" ON "kyc_data"("ipfs_hash");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_wallet_address_key" ON "wallets"("wallet_address");

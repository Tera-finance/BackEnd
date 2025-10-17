-- ==========================================
-- TrustBridge Database Schema for Base Sepolia (EVM)
-- ==========================================
-- Network: Base Sepolia Testnet
-- Chain ID: 84532
-- Smart Contracts: RemittanceSwap, MultiTokenSwap
-- ==========================================

USE defaultdb;

-- ==========================================
-- TABLE: users
-- Store user information with wallet addresses
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  whatsapp_number VARCHAR(50) UNIQUE NOT NULL,
  country_code VARCHAR(10) NOT NULL DEFAULT '+62',
  wallet_address VARCHAR(42) NULL,
  status ENUM('PENDING_KYC', 'VERIFIED', 'SUSPENDED') DEFAULT 'VERIFIED',
  kyc_nft_token_id VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_whatsapp_number (whatsapp_number),
  INDEX idx_wallet_address (wallet_address),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABLE: evm_tokens
-- Store Base Sepolia ERC20 token information
-- ==========================================
CREATE TABLE IF NOT EXISTS evm_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token_symbol VARCHAR(10) NOT NULL UNIQUE,
  token_name VARCHAR(100) NOT NULL,
  contract_address VARCHAR(42) NOT NULL UNIQUE,
  decimals INT NOT NULL DEFAULT 6,
  network VARCHAR(20) NOT NULL DEFAULT 'base-sepolia',
  chain_id INT NOT NULL DEFAULT 84532,
  is_active BOOLEAN DEFAULT TRUE,
  explorer_url VARCHAR(300) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_token_symbol (token_symbol),
  INDEX idx_contract_address (contract_address),
  INDEX idx_is_active (is_active),
  INDEX idx_network (network)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABLE: smart_contracts
-- Store deployed smart contract addresses
-- ==========================================
CREATE TABLE IF NOT EXISTS smart_contracts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contract_name VARCHAR(50) NOT NULL UNIQUE,
  contract_address VARCHAR(42) NOT NULL UNIQUE,
  contract_type ENUM('SWAP', 'TOKEN', 'ROUTER', 'OTHER') NOT NULL,
  description TEXT NULL,
  network VARCHAR(20) NOT NULL DEFAULT 'base-sepolia',
  chain_id INT NOT NULL DEFAULT 84532,
  deployer_address VARCHAR(42) NULL,
  deployed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  explorer_url VARCHAR(300) NULL,
  INDEX idx_contract_name (contract_name),
  INDEX idx_contract_address (contract_address),
  INDEX idx_contract_type (contract_type),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABLE: transfers
-- Main transfer table for WhatsApp bot transactions
-- ==========================================
CREATE TABLE IF NOT EXISTS transfers (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(36) NULL,
  whatsapp_number VARCHAR(50) NOT NULL,
  status ENUM('pending', 'paid', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',

  -- Payment information
  payment_method ENUM('WALLET', 'MASTERCARD') NOT NULL,

  -- Sender information
  sender_currency VARCHAR(10) NOT NULL,
  sender_amount DECIMAL(20, 8) NOT NULL,
  sender_token_address VARCHAR(42) NULL,
  total_amount DECIMAL(20, 8) NOT NULL,

  -- Recipient information
  recipient_name VARCHAR(255) NOT NULL,
  recipient_currency VARCHAR(10) NOT NULL,
  recipient_token_address VARCHAR(42) NULL,
  recipient_expected_amount DECIMAL(20, 8) NOT NULL,
  recipient_bank VARCHAR(100) NOT NULL,
  recipient_account VARCHAR(100) NOT NULL,
  recipient_wallet_address VARCHAR(42) NULL,

  -- Conversion details
  exchange_rate DECIMAL(20, 8) NOT NULL,
  conversion_path TEXT NULL,

  -- Fees
  fee_percentage DECIMAL(5, 2) NOT NULL,
  fee_amount DECIMAL(20, 8) NOT NULL,

  -- Blockchain information (Base Sepolia)
  network VARCHAR(20) DEFAULT 'base-sepolia',
  chain_id INT DEFAULT 84532,
  tx_hash VARCHAR(66) NULL,
  block_number BIGINT NULL,
  contract_address VARCHAR(42) NULL,
  gas_used BIGINT NULL,
  blockchain_tx_url VARCHAR(300) NULL,

  -- Card details (encrypted, for MASTERCARD only)
  card_number_encrypted TEXT NULL,
  card_last4 VARCHAR(4) NULL,

  -- Payment link (for WALLET method)
  payment_link TEXT NULL,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  paid_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,

  -- Foreign keys
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,

  -- Indexes
  INDEX idx_whatsapp_number (whatsapp_number),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_payment_method (payment_method),
  INDEX idx_tx_hash (tx_hash),
  INDEX idx_created_at (created_at),
  INDEX idx_status_created (status, created_at),
  INDEX idx_network (network)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABLE: evm_swaps
-- Store Base Sepolia swap transaction records
-- ==========================================
CREATE TABLE IF NOT EXISTS evm_swaps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transfer_id VARCHAR(50) NULL,
  user_id VARCHAR(36) NULL,

  -- Token information
  from_token_symbol VARCHAR(10) NOT NULL,
  from_token_address VARCHAR(42) NOT NULL,
  to_token_symbol VARCHAR(10) NOT NULL,
  to_token_address VARCHAR(42) NOT NULL,

  -- Amounts
  from_amount DECIMAL(20, 8) NOT NULL,
  to_amount DECIMAL(20, 8) NOT NULL,
  exchange_rate DECIMAL(20, 8) NOT NULL,

  -- Addresses
  sender_address VARCHAR(42) NOT NULL,
  recipient_address VARCHAR(42) NOT NULL,

  -- Swap details
  swap_contract VARCHAR(42) NOT NULL,
  swap_type ENUM('REMITTANCE', 'MULTI_TOKEN', 'UNISWAP') DEFAULT 'MULTI_TOKEN',

  -- Blockchain data
  tx_hash VARCHAR(66) NOT NULL UNIQUE,
  block_number BIGINT NULL,
  gas_used BIGINT NULL,
  network VARCHAR(20) DEFAULT 'base-sepolia',
  chain_id INT DEFAULT 84532,
  explorer_url VARCHAR(300) NULL,

  -- Status
  status ENUM('PENDING', 'CONFIRMED', 'FAILED') DEFAULT 'PENDING',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (transfer_id) REFERENCES transfers(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,

  INDEX idx_transfer_id (transfer_id),
  INDEX idx_user_id (user_id),
  INDEX idx_from_token (from_token_symbol),
  INDEX idx_to_token (to_token_symbol),
  INDEX idx_tx_hash (tx_hash),
  INDEX idx_sender_address (sender_address),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABLE: transactions (Legacy - for compatibility)
-- ==========================================
CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  sender_id VARCHAR(36) NOT NULL,
  recipient_phone VARCHAR(50) NOT NULL,
  source_currency VARCHAR(10) NOT NULL,
  target_currency VARCHAR(10) NOT NULL,
  source_amount DECIMAL(20, 8) NOT NULL,
  target_amount DECIMAL(20, 8) NOT NULL,
  exchange_rate DECIMAL(20, 8) NOT NULL,
  fee_amount DECIMAL(20, 8) NOT NULL,
  total_amount DECIMAL(20, 8) NOT NULL,
  status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
  blockchain_tx_hash VARCHAR(66) NULL,
  recipient_bank_account VARCHAR(255) NULL,
  network VARCHAR(20) DEFAULT 'base-sepolia',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sender_id (sender_id),
  INDEX idx_recipient_phone (recipient_phone),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_blockchain_tx_hash (blockchain_tx_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABLE: exchange_rates_cache
-- Cache exchange rates to reduce API calls
-- ==========================================
CREATE TABLE IF NOT EXISTS exchange_rates_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  from_currency VARCHAR(10) NOT NULL,
  to_currency VARCHAR(10) NOT NULL,
  rate DECIMAL(20, 8) NOT NULL,
  source VARCHAR(50) NOT NULL,
  cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  UNIQUE KEY idx_currency_pair (from_currency, to_currency),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABLE: schema_version
-- ==========================================
CREATE TABLE IF NOT EXISTS schema_version (
  id INT AUTO_INCREMENT PRIMARY KEY,
  version INT NOT NULL,
  description VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ==========================================
-- INSERT INITIAL DATA
-- ==========================================

-- Insert Base Sepolia ERC20 Tokens
INSERT INTO evm_tokens (token_symbol, token_name, contract_address, decimals, network, chain_id, explorer_url) VALUES
('USDC', 'Mock USD Coin', '0x886664e1707b8e013a4242ee0dbfe753c68bf7d4', 6, 'base-sepolia', 84532, 'https://sepolia.basescan.org/address/0x886664e1707b8e013a4242ee0dbfe753c68bf7d4'),
('IDRX', 'Mock Indonesian Rupiah', '0x67cacfe96ca874ec7a78ee0d6f7044e878ba9c4c', 6, 'base-sepolia', 84532, 'https://sepolia.basescan.org/address/0x67cacfe96ca874ec7a78ee0d6f7044e878ba9c4c'),
('CNHT', 'Mock Chinese Yuan', '0x993f00d791509cfab774e3b97dab1f0470ffc9cf', 6, 'base-sepolia', 84532, 'https://sepolia.basescan.org/address/0x993f00d791509cfab774e3b97dab1f0470ffc9cf'),
('EUROC', 'Mock Euro Coin', '0x76c9d8f6eb862d4582784d7e2848872f83a64c1b', 6, 'base-sepolia', 84532, 'https://sepolia.basescan.org/address/0x76c9d8f6eb862d4582784d7e2848872f83a64c1b'),
('JPYC', 'Mock Japanese Yen Coin', '0x5246818cdeccf2a5a08267f27ad76dce8239eaec', 6, 'base-sepolia', 84532, 'https://sepolia.basescan.org/address/0x5246818cdeccf2a5a08267f27ad76dce8239eaec'),
('MXNT', 'Mock Mexican Peso', '0x83d1214238dd4323bd165170cf9761a4718ae1db', 6, 'base-sepolia', 84532, 'https://sepolia.basescan.org/address/0x83d1214238dd4323bd165170cf9761a4718ae1db')
ON DUPLICATE KEY UPDATE
  token_name = VALUES(token_name),
  updated_at = CURRENT_TIMESTAMP;

-- Insert Smart Contracts
INSERT INTO smart_contracts (contract_name, contract_address, contract_type, description, network, chain_id, deployer_address, explorer_url) VALUES
('RemittanceSwap', '0x9354839fba186309fd2c32626e424361f57233d2', 'SWAP', 'USDC to IDRX swap contract', 'base-sepolia', 84532, '0x00d1e028a70ee8d422bfd1132b50464e2d21fbcd', 'https://sepolia.basescan.org/address/0x9354839fba186309fd2c32626e424361f57233d2'),
('MultiTokenSwap', '0x2c7f17bc795be548a0b1da28d536d57f78df0543', 'SWAP', 'Multi-token swap contract supporting all stablecoins', 'base-sepolia', 84532, '0x00d1e028a70ee8d422bfd1132b50464e2d21fbcd', 'https://sepolia.basescan.org/address/0x2c7f17bc795be548a0b1da28d536d57f78df0543'),
('UniswapV3Router', '0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4', 'ROUTER', 'Uniswap V3 Swap Router on Base Sepolia', 'base-sepolia', 84532, NULL, 'https://sepolia.basescan.org/address/0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4')
ON DUPLICATE KEY UPDATE
  description = VALUES(description);

-- Insert Schema Version
INSERT INTO schema_version (version, description) VALUES
(1, 'Base Sepolia EVM schema with smart contracts and tokens'),
(2, 'Added transfers and swaps tables for Base Sepolia'),
(3, 'Replaced Cardano tables with EVM/Base Sepolia tables')
ON DUPLICATE KEY UPDATE version = VALUES(version);

-- ==========================================
-- VIEWS
-- ==========================================

-- View: Active EVM Tokens
CREATE OR REPLACE VIEW v_active_evm_tokens AS
SELECT
  t.id,
  t.token_symbol,
  t.token_name,
  t.contract_address,
  t.decimals,
  t.network,
  t.chain_id,
  t.explorer_url,
  COUNT(DISTINCT s.id) as swap_count,
  COALESCE(SUM(s.from_amount), 0) as total_swapped_from,
  COALESCE(SUM(s.to_amount), 0) as total_swapped_to
FROM evm_tokens t
LEFT JOIN evm_swaps s ON (t.token_symbol = s.from_token_symbol OR t.token_symbol = s.to_token_symbol)
WHERE t.is_active = TRUE
GROUP BY t.id, t.token_symbol, t.token_name, t.contract_address, t.decimals, t.network, t.chain_id, t.explorer_url;

-- View: Recent Swaps with Token Details
CREATE OR REPLACE VIEW v_recent_swaps AS
SELECT
  s.id,
  s.tx_hash,
  s.from_token_symbol,
  s.from_amount,
  s.to_token_symbol,
  s.to_amount,
  s.exchange_rate,
  s.swap_type,
  s.sender_address,
  s.recipient_address,
  s.status,
  s.explorer_url,
  s.created_at
FROM evm_swaps s
ORDER BY s.created_at DESC
LIMIT 100;

-- View: Transfer History
CREATE OR REPLACE VIEW v_transfer_history AS
SELECT
  t.id as transfer_id,
  t.whatsapp_number,
  u.wallet_address,
  t.sender_currency,
  t.recipient_currency,
  t.sender_amount,
  t.recipient_expected_amount,
  t.exchange_rate,
  t.fee_amount,
  t.total_amount,
  t.status,
  t.payment_method,
  t.tx_hash,
  t.network,
  t.blockchain_tx_url,
  t.created_at,
  t.completed_at
FROM transfers t
LEFT JOIN users u ON t.user_id = u.id
ORDER BY t.created_at DESC;

SELECT '✅ TrustBridge Base Sepolia EVM schema created successfully!' as Status;
SELECT CONCAT('Tokens configured: ', COUNT(*), ' ERC20 tokens on Base Sepolia') as TokenInfo FROM evm_tokens;
SELECT CONCAT('Contracts configured: ', COUNT(*), ' smart contracts') as ContractInfo FROM smart_contracts;

-- ==========================================
-- TrustBridge Database Setup for Aiven MySQL
-- ==========================================
-- Uses existing 'defaultdb' database
-- Compatible with Aiven's MySQL constraints
-- ==========================================

-- Use the existing Aiven database
USE defaultdb;

-- ==========================================
-- TABLE: users
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  whatsapp_number VARCHAR(50) UNIQUE NOT NULL,
  country_code VARCHAR(10) NOT NULL DEFAULT '+62',
  status ENUM('PENDING_KYC', 'VERIFIED', 'SUSPENDED') DEFAULT 'VERIFIED',
  kyc_nft_token_id VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_whatsapp_number (whatsapp_number),
  INDEX idx_status (status),
  INDEX idx_user_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABLE: transfers
-- ==========================================
CREATE TABLE IF NOT EXISTS transfers (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(36) NULL,
  whatsapp_number VARCHAR(50) NOT NULL,
  status ENUM('pending', 'paid', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
  payment_method ENUM('WALLET', 'MASTERCARD') NOT NULL,
  sender_currency VARCHAR(10) NOT NULL,
  sender_amount DECIMAL(20, 8) NOT NULL,
  total_amount DECIMAL(20, 8) NOT NULL,
  recipient_name VARCHAR(255) NOT NULL,
  recipient_currency VARCHAR(10) NOT NULL,
  recipient_expected_amount DECIMAL(20, 8) NOT NULL,
  recipient_bank VARCHAR(100) NOT NULL,
  recipient_account VARCHAR(100) NOT NULL,
  ada_amount DECIMAL(20, 8) NULL,
  exchange_rate DECIMAL(20, 8) NOT NULL,
  conversion_path TEXT NULL,
  fee_percentage DECIMAL(5, 2) NOT NULL,
  fee_amount DECIMAL(20, 8) NOT NULL,
  uses_mock_token BOOLEAN DEFAULT FALSE,
  mock_token VARCHAR(50) NULL,
  policy_id VARCHAR(56) NULL,
  tx_hash VARCHAR(64) NULL,
  blockchain_tx_url VARCHAR(300) NULL,
  card_number_encrypted TEXT NULL,
  card_last4 VARCHAR(4) NULL,
  payment_link TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  paid_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_whatsapp_number (whatsapp_number),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_payment_method (payment_method),
  INDEX idx_created_at (created_at),
  INDEX idx_status_created (status, created_at),
  INDEX idx_tx_hash (tx_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABLE: transactions (Legacy table)
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
  blockchain_tx_hash VARCHAR(255) NULL,
  recipient_bank_account VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sender_id (sender_id),
  INDEX idx_recipient_phone (recipient_phone),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_transaction_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABLE: cardano_tokens
-- ==========================================
CREATE TABLE IF NOT EXISTS cardano_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token_name VARCHAR(50) NOT NULL UNIQUE,
  token_symbol VARCHAR(10) NOT NULL,
  policy_id VARCHAR(56) NOT NULL UNIQUE,
  asset_unit VARCHAR(120) NOT NULL UNIQUE,
  decimals INT NOT NULL DEFAULT 6,
  total_supply BIGINT NOT NULL,
  deployment_tx_hash VARCHAR(64) NOT NULL,
  cardano_network ENUM('Preprod', 'Mainnet') DEFAULT 'Preprod',
  deployed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT NULL,
  INDEX idx_token_name (token_name),
  INDEX idx_policy_id (policy_id),
  INDEX idx_token_symbol (token_symbol),
  INDEX idx_is_active (is_active),
  INDEX idx_token_active_name (is_active, token_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABLE: cardano_mints
-- ==========================================
CREATE TABLE IF NOT EXISTS cardano_mints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token_id INT NOT NULL,
  amount BIGINT NOT NULL,
  recipient_address VARCHAR(200) NOT NULL,
  tx_hash VARCHAR(64) NOT NULL UNIQUE,
  cardano_scan_url VARCHAR(300) NOT NULL,
  redeemer_data TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (token_id) REFERENCES cardano_tokens(id) ON DELETE CASCADE,
  INDEX idx_token_id (token_id),
  INDEX idx_tx_hash (tx_hash),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABLE: cardano_swaps
-- ==========================================
CREATE TABLE IF NOT EXISTS cardano_swaps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  from_token_id INT NOT NULL,
  to_token_id INT NOT NULL,
  from_amount BIGINT NOT NULL,
  to_amount BIGINT NOT NULL,
  exchange_rate DECIMAL(20, 8) NOT NULL,
  sender_address VARCHAR(200) NOT NULL,
  recipient_address VARCHAR(200) NOT NULL,
  tx_hash VARCHAR(64) NOT NULL UNIQUE,
  cardano_scan_url VARCHAR(300) NOT NULL,
  swap_type ENUM('DIRECT', 'VIA_HUB') DEFAULT 'VIA_HUB',
  hub_token_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_token_id) REFERENCES cardano_tokens(id) ON DELETE CASCADE,
  FOREIGN KEY (to_token_id) REFERENCES cardano_tokens(id) ON DELETE CASCADE,
  FOREIGN KEY (hub_token_id) REFERENCES cardano_tokens(id) ON DELETE SET NULL,
  INDEX idx_from_token (from_token_id),
  INDEX idx_to_token (to_token_id),
  INDEX idx_tx_hash (tx_hash),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABLE: exchange_rates_cache
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
-- TABLE: schema_version (with PRIMARY KEY required by Aiven)
-- ==========================================
CREATE TABLE IF NOT EXISTS schema_version (
  id INT AUTO_INCREMENT PRIMARY KEY,
  version INT NOT NULL,
  description VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ==========================================
-- INSERT SCHEMA VERSION
-- ==========================================
INSERT INTO schema_version (version, description) VALUES
(1, 'Initial schema with MySQL migration and Cardano blockchain tables'),
(2, 'Added transfers table for WhatsApp bot integration'),
(3, 'Aiven-compatible schema with required primary keys')
ON DUPLICATE KEY UPDATE version = VALUES(version);

-- ==========================================
-- VIEWS
-- ==========================================

-- View: Active Cardano Tokens with Stats
CREATE OR REPLACE VIEW v_active_tokens AS
SELECT
  t.id,
  t.token_name,
  t.token_symbol,
  t.policy_id,
  t.decimals,
  t.total_supply,
  t.deployed_at,
  COUNT(DISTINCT m.id) as mint_count,
  COALESCE(SUM(m.amount), 0) as total_minted
FROM cardano_tokens t
LEFT JOIN cardano_mints m ON t.id = m.token_id
WHERE t.is_active = TRUE
GROUP BY t.id, t.token_name, t.token_symbol, t.policy_id, t.decimals, t.total_supply, t.deployed_at;

-- View: Recent Swaps with Token Details
CREATE OR REPLACE VIEW v_recent_swaps AS
SELECT
  s.id,
  s.tx_hash,
  s.cardano_scan_url,
  ft.token_name as from_token,
  ft.token_symbol as from_symbol,
  s.from_amount,
  tt.token_name as to_token,
  tt.token_symbol as to_symbol,
  s.to_amount,
  s.exchange_rate,
  s.swap_type,
  s.created_at
FROM cardano_swaps s
JOIN cardano_tokens ft ON s.from_token_id = ft.id
JOIN cardano_tokens tt ON s.to_token_id = tt.id
ORDER BY s.created_at DESC
LIMIT 100;

-- View: Transaction History with Blockchain Data
CREATE OR REPLACE VIEW v_transaction_history AS
SELECT
  t.id as transaction_id,
  t.sender_id,
  u.whatsapp_number,
  t.source_currency,
  t.target_currency,
  t.source_amount,
  t.target_amount,
  t.exchange_rate,
  t.fee_amount,
  t.total_amount,
  t.status,
  t.blockchain_tx_hash,
  t.created_at,
  t.completed_at
FROM transactions t
JOIN users u ON t.sender_id = u.id
ORDER BY t.created_at DESC;

SELECT '✅ TrustBridge database schema created successfully on Aiven!' as Status;

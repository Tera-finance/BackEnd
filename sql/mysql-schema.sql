-- TrustBridge MySQL Database Schema
-- Simplified schema with Cardano blockchain data storage

-- Create database
CREATE DATABASE IF NOT EXISTS trustbridge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE trustbridge;

-- ==========================================
-- USERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  whatsapp_number VARCHAR(50) UNIQUE NOT NULL,
  country_code VARCHAR(10) NOT NULL,
  status ENUM('PENDING_KYC', 'VERIFIED', 'SUSPENDED') DEFAULT 'PENDING_KYC',
  kyc_nft_token_id VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_whatsapp_number (whatsapp_number),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TRANSACTIONS TABLE
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
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- CARDANO TOKENS TABLE (NEW)
-- Store deployed token information from be-offchain
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
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Deployed Cardano tokens (mockADA, mockUSDC, etc.)';

-- ==========================================
-- CARDANO MINTS TABLE (NEW)
-- Store mint transaction records from be-offchain
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cardano token mint transactions';

-- ==========================================
-- CARDANO SWAPS TABLE (NEW)
-- Store swap transaction records from be-offchain
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cardano token swap transactions';

-- ==========================================
-- EXCHANGE RATES CACHE TABLE (OPTIONAL)
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cached exchange rates';

-- ==========================================
-- INSERT SAMPLE CARDANO TOKENS
-- (These should be inserted by be-offchain scripts after deployment)
-- ==========================================
-- Note: These are placeholders. Real data comes from be-offchain deployment
INSERT INTO cardano_tokens (token_name, token_symbol, policy_id, asset_unit, decimals, total_supply, deployment_tx_hash, description) VALUES
('mockADA', 'mADA', '1c05bdd719318cef47811522e134bfeba87fce3f73b4892c62561c93', '1c05bdd719318cef47811522e134bfeba87fce3f73b4892c62561c936d6f636b414441', 6, 1000000000, 'placeholder-tx-hash', 'Hub token for all conversions'),
('mockUSDC', 'mUSDC', '7c3b8b1a3b1e1a8e5e0f3c8b1a3b1e1a8e5e0f3c8b1a3b1e1a8e5e0f', 'placeholder-asset-unit', 6, 1000000000, 'placeholder-tx-hash', 'Mock USDC stablecoin'),
('mockIDRX', 'mIDRX', '5c9a67cc3c085c4ad001492d1e460f5aea9cc2b8847c23e1683c26d9', 'placeholder-asset-unit', 6, 1000000000, 'placeholder-tx-hash', 'Mock IDR stablecoin')
ON DUPLICATE KEY UPDATE
  token_name = VALUES(token_name);

-- ==========================================
-- VIEWS FOR EASY QUERYING
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

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Trigger: Clean expired exchange rate cache
DELIMITER //
CREATE TRIGGER IF NOT EXISTS cleanup_expired_rates
  BEFORE INSERT ON exchange_rates_cache
  FOR EACH ROW
BEGIN
  DELETE FROM exchange_rates_cache WHERE expires_at < NOW();
END;//
DELIMITER ;

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- Additional composite indexes
CREATE INDEX idx_transaction_status_created ON transactions(status, created_at);
CREATE INDEX idx_user_status ON users(status);
CREATE INDEX idx_token_active_name ON cardano_tokens(is_active, token_name);

-- ==========================================
-- STORED PROCEDURES (OPTIONAL)
-- ==========================================

-- Procedure: Get Token by Policy ID
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS get_token_by_policy_id(IN p_policy_id VARCHAR(56))
BEGIN
  SELECT * FROM cardano_tokens WHERE policy_id = p_policy_id AND is_active = TRUE;
END;//
DELIMITER ;

-- Procedure: Get Conversion Path (USD → mockADA → IDR)
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS get_conversion_path(
  IN p_from_currency VARCHAR(10),
  IN p_to_currency VARCHAR(10)
)
BEGIN
  -- Returns the token path for conversion
  SELECT 
    'mockADA' as hub_token,
    policy_id as hub_policy_id
  FROM cardano_tokens 
  WHERE token_name = 'mockADA' AND is_active = TRUE
  LIMIT 1;
END;//
DELIMITER ;

-- ==========================================
-- GRANT PERMISSIONS (OPTIONAL)
-- ==========================================
-- GRANT ALL PRIVILEGES ON trustbridge.* TO 'trustbridge_user'@'localhost';
-- FLUSH PRIVILEGES;

-- ==========================================
-- SCHEMA VERSION
-- ==========================================
CREATE TABLE IF NOT EXISTS schema_version (
  version INT NOT NULL,
  description VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO schema_version (version, description) VALUES 
(1, 'Initial schema with MySQL migration and Cardano blockchain tables');

SELECT 'Schema created successfully!' as Status;

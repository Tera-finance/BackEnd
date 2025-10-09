-- Add transfers table for WhatsApp bot integration
-- This table stores detailed transfer data including payment methods and blockchain info

USE trustbridge;

-- ==========================================
-- TRANSFERS TABLE
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
  total_amount DECIMAL(20, 8) NOT NULL,

  -- Recipient information
  recipient_name VARCHAR(255) NOT NULL,
  recipient_currency VARCHAR(10) NOT NULL,
  recipient_expected_amount DECIMAL(20, 8) NOT NULL,
  recipient_bank VARCHAR(100) NOT NULL,
  recipient_account VARCHAR(100) NOT NULL,

  -- Conversion details
  ada_amount DECIMAL(20, 8) NULL,
  exchange_rate DECIMAL(20, 8) NOT NULL,
  conversion_path TEXT NULL,

  -- Fees
  fee_percentage DECIMAL(5, 2) NOT NULL,
  fee_amount DECIMAL(20, 8) NOT NULL,

  -- Blockchain information
  uses_mock_token BOOLEAN DEFAULT FALSE,
  mock_token VARCHAR(50) NULL,
  policy_id VARCHAR(56) NULL,
  tx_hash VARCHAR(64) NULL,
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

  -- Foreign key
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,

  -- Indexes
  INDEX idx_whatsapp_number (whatsapp_number),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_payment_method (payment_method),
  INDEX idx_created_at (created_at),
  INDEX idx_status_created (status, created_at),
  INDEX idx_tx_hash (tx_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Transfer records from WhatsApp bot';

-- Update schema version
INSERT INTO schema_version (version, description) VALUES
(2, 'Added transfers table for WhatsApp bot integration');

SELECT 'Transfers table created successfully!' as Status;

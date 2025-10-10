-- ==========================================
-- TrustBridge Useful SQL Queries
-- Common queries for monitoring and maintenance
-- ==========================================

USE trustbridge;

-- ==========================================
-- DATABASE OVERVIEW
-- ==========================================

-- Show all tables
SHOW TABLES;

-- Show table sizes
SELECT
  table_name AS 'Table',
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'trustbridge'
ORDER BY (data_length + index_length) DESC;

-- ==========================================
-- TRANSFER STATISTICS
-- ==========================================

-- Total transfers by status
SELECT
  status,
  COUNT(*) as count,
  SUM(sender_amount) as total_amount
FROM transfers
GROUP BY status
ORDER BY count DESC;

-- Recent transfers (last 24 hours)
SELECT
  id,
  payment_method,
  sender_currency,
  sender_amount,
  recipient_currency,
  recipient_name,
  status,
  created_at
FROM transfers
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY created_at DESC;

-- Transfers by payment method
SELECT
  payment_method,
  COUNT(*) as total,
  SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending,
  SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) as failed
FROM transfers
GROUP BY payment_method;

-- Daily transfer volume
SELECT
  DATE(created_at) as date,
  COUNT(*) as transfers,
  SUM(sender_amount) as total_amount,
  AVG(sender_amount) as avg_amount
FROM transfers
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Top recipients
SELECT
  recipient_name,
  recipient_bank,
  COUNT(*) as transfer_count,
  SUM(recipient_expected_amount) as total_received
FROM transfers
WHERE status = 'completed'
GROUP BY recipient_name, recipient_bank
ORDER BY transfer_count DESC
LIMIT 10;

-- ==========================================
-- TOKEN STATISTICS
-- ==========================================

-- Active tokens
SELECT
  token_name,
  token_symbol,
  CONCAT(SUBSTRING(policy_id, 1, 8), '...', SUBSTRING(policy_id, -8)) as policy_id,
  total_supply,
  is_active
FROM cardano_tokens
WHERE is_active = TRUE
ORDER BY token_name;

-- Mint statistics
SELECT
  t.token_name,
  COUNT(m.id) as mint_count,
  SUM(m.amount) as total_minted,
  SUM(m.amount) / t.decimals as total_minted_decimal
FROM cardano_tokens t
LEFT JOIN cardano_mints m ON t.id = m.token_id
WHERE t.is_active = TRUE
GROUP BY t.id, t.token_name, t.decimals
ORDER BY total_minted DESC;

-- Recent mints
SELECT
  t.token_name,
  m.amount,
  m.tx_hash,
  m.created_at
FROM cardano_mints m
JOIN cardano_tokens t ON m.token_id = t.id
ORDER BY m.created_at DESC
LIMIT 20;

-- ==========================================
-- USER STATISTICS
-- ==========================================

-- Total users by status
SELECT
  status,
  COUNT(*) as user_count
FROM users
GROUP BY status;

-- Active users (with transfers)
SELECT
  u.whatsapp_number,
  u.status,
  COUNT(DISTINCT tr.id) as transfer_count,
  MAX(tr.created_at) as last_transfer
FROM users u
LEFT JOIN transfers tr ON u.id = tr.user_id OR u.whatsapp_number = tr.whatsapp_number
GROUP BY u.id, u.whatsapp_number, u.status
HAVING transfer_count > 0
ORDER BY transfer_count DESC;

-- ==========================================
-- BLOCKCHAIN STATISTICS
-- ==========================================

-- Swap statistics
SELECT
  ft.token_symbol as from_token,
  tt.token_symbol as to_token,
  COUNT(*) as swap_count,
  AVG(s.exchange_rate) as avg_rate,
  SUM(s.from_amount) as total_from,
  SUM(s.to_amount) as total_to
FROM cardano_swaps s
JOIN cardano_tokens ft ON s.from_token_id = ft.id
JOIN cardano_tokens tt ON s.to_token_id = tt.id
GROUP BY ft.token_symbol, tt.token_symbol
ORDER BY swap_count DESC;

-- Recent swaps
SELECT
  ft.token_symbol as from_token,
  s.from_amount,
  tt.token_symbol as to_token,
  s.to_amount,
  s.exchange_rate,
  s.tx_hash,
  s.created_at
FROM cardano_swaps s
JOIN cardano_tokens ft ON s.from_token_id = ft.id
JOIN cardano_tokens tt ON s.to_token_id = tt.id
ORDER BY s.created_at DESC
LIMIT 20;

-- ==========================================
-- PERFORMANCE MONITORING
-- ==========================================

-- Transfer completion rate
SELECT
  CONCAT(
    ROUND(
      (SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) / COUNT(*)) * 100,
      2
    ),
    '%'
  ) as completion_rate,
  COUNT(*) as total_transfers,
  SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) as failed
FROM transfers;

-- Average processing time (completed transfers)
SELECT
  AVG(TIMESTAMPDIFF(SECOND, created_at, completed_at)) as avg_seconds,
  MIN(TIMESTAMPDIFF(SECOND, created_at, completed_at)) as min_seconds,
  MAX(TIMESTAMPDIFF(SECOND, created_at, completed_at)) as max_seconds
FROM transfers
WHERE status = 'completed'
  AND completed_at IS NOT NULL;

-- Pending transfers older than 1 hour
SELECT
  id,
  payment_method,
  sender_amount,
  sender_currency,
  status,
  TIMESTAMPDIFF(MINUTE, created_at, NOW()) as minutes_pending,
  created_at
FROM transfers
WHERE status IN ('pending', 'processing')
  AND created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)
ORDER BY created_at ASC;

-- ==========================================
-- MAINTENANCE QUERIES
-- ==========================================

-- Clean old exchange rate cache (older than 24 hours)
DELETE FROM exchange_rates_cache
WHERE expires_at < NOW();

-- Find duplicate transfers (by whatsapp + amount + time)
SELECT
  whatsapp_number,
  sender_amount,
  recipient_name,
  COUNT(*) as duplicate_count,
  GROUP_CONCAT(id) as transfer_ids
FROM transfers
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
GROUP BY whatsapp_number, sender_amount, recipient_name, DATE(created_at)
HAVING COUNT(*) > 1;

-- Update token symbols if needed
-- UPDATE cardano_tokens SET token_symbol = 'ADA' WHERE token_name = 'mockADA';
-- UPDATE cardano_tokens SET token_symbol = 'IDRX' WHERE token_name = 'mockIDRX';

-- ==========================================
-- BACKUP & EXPORT
-- ==========================================

-- Export completed transfers to CSV (run in mysql client)
-- SELECT
--   id,
--   payment_method,
--   sender_currency,
--   sender_amount,
--   recipient_currency,
--   recipient_expected_amount,
--   recipient_name,
--   recipient_bank,
--   tx_hash,
--   created_at,
--   completed_at
-- FROM transfers
-- WHERE status = 'completed'
-- INTO OUTFILE '/tmp/completed_transfers.csv'
-- FIELDS TERMINATED BY ','
-- ENCLOSED BY '"'
-- LINES TERMINATED BY '\n';

-- ==========================================
-- DEBUGGING QUERIES
-- ==========================================

-- Find transfer by ID
-- SELECT * FROM transfers WHERE id = 'TXN-xxx';

-- Find transfers by WhatsApp number
-- SELECT * FROM transfers WHERE whatsapp_number = '+6281234567890' ORDER BY created_at DESC;

-- Find transfer by transaction hash
-- SELECT * FROM transfers WHERE tx_hash = 'xxx';

-- Check token configuration
SELECT
  token_name,
  token_symbol,
  policy_id,
  decimals,
  is_active
FROM cardano_tokens
WHERE token_name IN ('mockADA', 'mockIDRX', 'mockUSDC');

-- Verify foreign key relationships
SELECT
  CONSTRAINT_NAME,
  TABLE_NAME,
  COLUMN_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_SCHEMA = 'trustbridge'
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- ==========================================
-- EXAMPLE: Update transfer status manually
-- ==========================================
-- UPDATE transfers SET status = 'completed', completed_at = NOW()
-- WHERE id = 'TXN-xxx' AND status = 'processing';

-- ==========================================
-- EXAMPLE: Reset a failed transfer
-- ==========================================
-- UPDATE transfers SET status = 'pending', tx_hash = NULL, blockchain_tx_url = NULL
-- WHERE id = 'TXN-xxx' AND status = 'failed';

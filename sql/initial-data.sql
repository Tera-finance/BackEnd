-- ==========================================
-- TrustBridge Initial Data
-- Populates database with Cardano tokens and test data
-- ==========================================
-- Version: 1.0
-- Last Updated: 2025-10-10
-- Description: Initial token data from deployment
-- ==========================================

USE trustbridge;

-- ==========================================
-- INSERT CARDANO TOKENS
-- Data from actual Preprod deployments
-- ==========================================

INSERT INTO cardano_tokens (
  token_name,
  token_symbol,
  policy_id,
  asset_unit,
  decimals,
  total_supply,
  deployment_tx_hash,
  cardano_network,
  description
) VALUES
-- mockADA (Hub Token) - REQUIRED
(
  'mockADA',
  'ADA',
  '1c05bdd719318cef47811522e134bfeba87fce3f73b4892c62561c93',
  '1c05bdd719318cef47811522e134bfeba87fce3f73b4892c62561c936d6f636b414441',
  6,
  1000000000000,
  'placeholder-tx-hash',
  'Preprod',
  'Hub token for all currency conversions'
),

-- mockIDRX (Indonesian Rupiah)
(
  'mockIDRX',
  'IDRX',
  '5c9a67cc3c085c4ad001492d1e460f5aea9cc2b8847c23e1683c26d9',
  '5c9a67cc3c085c4ad001492d1e460f5aea9cc2b8847c23e1683c26d96d6f636b49445258',
  6,
  100000000000,
  'placeholder-tx-hash',
  'Preprod',
  'Mock Indonesian Rupiah stablecoin'
),

-- mockUSDC (USD Coin)
(
  'mockUSDC',
  'USDC',
  '4cbb15ff52c7459cd734c79c1a9fae87cab77b2a49f9a83907c8125d',
  '4cbb15ff52c7459cd734c79c1a9fae87cab77b2a49f9a83907c8125d6d6f636b55534443',
  6,
  100000000000,
  '7bf267cbef09f5f80fb7d9e588f5af0af3307b108312c764f2e5367c5e074f92',
  'Preprod',
  'Mock USD Coin stablecoin'
),

-- mockCNHT (Chinese Yuan)
(
  'mockCNHT',
  'CNHT',
  'c7bdad55621e968c6ccb0967493808c9ab50601b3b9aec77b2ba6888',
  'c7bdad55621e968c6ccb0967493808c9ab50601b3b9aec77b2ba68886d6f636b434e4854',
  6,
  100000000000,
  '8e4d120670815bbbe198f90ea2babbb6717cb3038715b138a102d24bb07849f8',
  'Preprod',
  'Mock Chinese Yuan stablecoin'
),

-- mockEUROC (Euro Coin)
(
  'mockEUROC',
  'EUROC',
  'f766f151787a989166869375f4c57cfa36c533241033c8000a5481c1',
  'f766f151787a989166869375f4c57cfa36c533241033c8000a5481c16d6f636b4555524f43',
  6,
  100000000000,
  '8afb1b104fa6ad4539b8307a3c67e7263f06100fd83ee203bf69cb942a9a8dd1',
  'Preprod',
  'Mock Euro Coin stablecoin'
),

-- mockJPYC (Japanese Yen)
(
  'mockJPYC',
  'JPYC',
  '7725300e8d414e0fccad0a562e3a9c585970e84e7e92d422111e1e29',
  '7725300e8d414e0fccad0a562e3a9c585970e84e7e92d422111e1e296d6f636b4a505943',
  2,
  100000000000,
  '0e083b140f907076f17984148c303cfbfb96a1cfd2cc17a62bb1c52c9111d593',
  'Preprod',
  'Mock Japanese Yen stablecoin'
),

-- mockMXNT (Mexican Peso)
(
  'mockMXNT',
  'MXNT',
  'c73682653bd1ff615e54a3d79c00068e1f4977a7a9628f39add50dc3',
  'c73682653bd1ff615e54a3d79c00068e1f4977a7a9628f39add50dc36d6f636b4d584e54',
  6,
  100000000000,
  '9fba05fc1006b7aad0e6bd02714845d5403ff0a698dfaa605d4d95a710cb97ee',
  'Preprod',
  'Mock Mexican Peso stablecoin'
)

ON DUPLICATE KEY UPDATE
  token_symbol = VALUES(token_symbol),
  policy_id = VALUES(policy_id),
  asset_unit = VALUES(asset_unit),
  decimals = VALUES(decimals),
  total_supply = VALUES(total_supply),
  deployment_tx_hash = VALUES(deployment_tx_hash),
  description = VALUES(description);

-- ==========================================
-- CREATE TEST USER (OPTIONAL)
-- Uncomment if you want a test user
-- ==========================================
-- INSERT INTO users (whatsapp_number, country_code, status) VALUES
-- ('+6281234567890', '+62', 'VERIFIED')
-- ON DUPLICATE KEY UPDATE status = VALUES(status);

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================
SELECT '✅ Token data inserted successfully!' as Status;

SELECT
  COUNT(*) as total_tokens,
  SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_tokens
FROM cardano_tokens;

SELECT
  token_name,
  token_symbol,
  CONCAT(SUBSTRING(policy_id, 1, 8), '...') as policy_id_short,
  decimals,
  is_active
FROM cardano_tokens
ORDER BY id;

-- Show expected configuration
SELECT '
========================================
IMPORTANT: Update your .env file with:
========================================

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=trustbridge
DB_PASSWORD=trustbridge123
DB_NAME=trustbridge

# Cardano Configuration
CARDANO_NETWORK=Preprod
WALLET_SEED=<your-wallet-seed-phrase>
BLOCKFROST_API_KEY=<your-blockfrost-preprod-key>
BLOCKFROST_URL=https://cardano-preprod.blockfrost.io/api/v0

# API Keys
COINGECKO_API_KEY=<optional>
EXCHANGERATE_API_KEY=<optional>

========================================
' as NextSteps;

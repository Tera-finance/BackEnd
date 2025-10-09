"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveDeployedToken = saveDeployedToken;
exports.getTokenByPolicyId = getTokenByPolicyId;
exports.getTokenBySymbol = getTokenBySymbol;
exports.getAllActiveTokens = getAllActiveTokens;
exports.updateTokenSupply = updateTokenSupply;
exports.saveMintTransaction = saveMintTransaction;
exports.getMintHistory = getMintHistory;
exports.saveSwapTransaction = saveSwapTransaction;
exports.getSwapHistory = getSwapHistory;
exports.getSwapHistoryByTokens = getSwapHistoryByTokens;
exports.getTokenStats = getTokenStats;
const database_1 = require("../utils/database");
/**
 * Repository for managing Cardano blockchain data
 * Used by be-offchain scripts to save deployment, mint, and swap data
 */
// ==================== TOKEN OPERATIONS ====================
/**
 * Save deployed token information
 * Called after successful token deployment from be-offchain scripts
 */
async function saveDeployedToken(tokenData) {
    const sql = `
    INSERT INTO cardano_tokens 
    (token_name, token_symbol, policy_id, asset_unit, decimals, total_supply, 
     deployment_tx_hash, cardano_network, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
    const result = await (0, database_1.query)(sql, [
        tokenData.tokenName,
        tokenData.tokenSymbol,
        tokenData.policyId,
        tokenData.assetUnit,
        tokenData.decimals,
        tokenData.totalSupply.toString(),
        tokenData.deploymentTxHash,
        tokenData.cardanoNetwork,
        tokenData.description || null
    ]);
    // Get the inserted token
    const token = await getTokenByPolicyId(tokenData.policyId);
    if (!token) {
        throw new Error('Failed to save token');
    }
    return token;
}
/**
 * Get token by policy ID
 */
async function getTokenByPolicyId(policyId) {
    return await (0, database_1.queryOne)('SELECT * FROM cardano_tokens WHERE policy_id = ? AND is_active = true', [policyId]);
}
/**
 * Get token by symbol
 */
async function getTokenBySymbol(symbol) {
    return await (0, database_1.queryOne)('SELECT * FROM cardano_tokens WHERE token_symbol = ? AND is_active = true', [symbol]);
}
/**
 * Get all active tokens
 */
async function getAllActiveTokens() {
    return await (0, database_1.query)('SELECT * FROM cardano_tokens WHERE is_active = true ORDER BY deployed_at DESC');
}
/**
 * Update token total supply (when new tokens are minted)
 */
async function updateTokenSupply(policyId, newSupply) {
    await (0, database_1.query)('UPDATE cardano_tokens SET total_supply = ? WHERE policy_id = ?', [newSupply.toString(), policyId]);
}
// ==================== MINT OPERATIONS ====================
/**
 * Save mint transaction
 * Called after successful token minting from be-offchain scripts
 */
async function saveMintTransaction(mintData) {
    let tokenId = mintData.tokenId;
    // If tokenId not provided, get it from policyId
    if (!tokenId && mintData.policyId) {
        const token = await getTokenByPolicyId(mintData.policyId);
        if (!token) {
            throw new Error(`Token with policy ID ${mintData.policyId} not found`);
        }
        tokenId = token.id;
    }
    if (!tokenId) {
        throw new Error('Either tokenId or policyId must be provided');
    }
    const cardanoScanUrl = `https://preprod.cardanoscan.io/transaction/${mintData.txHash}`;
    const sql = `
    INSERT INTO cardano_mints 
    (token_id, amount, recipient_address, tx_hash, cardano_scan_url, redeemer_data)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
    const result = await (0, database_1.query)(sql, [
        tokenId,
        mintData.amount.toString(),
        mintData.recipientAddress,
        mintData.txHash,
        cardanoScanUrl,
        mintData.redeemerData || null
    ]);
    // Update token total supply
    const token = await (0, database_1.queryOne)('SELECT * FROM cardano_tokens WHERE id = ?', [tokenId]);
    if (token) {
        const newSupply = BigInt(token.total_supply) + mintData.amount;
        await updateTokenSupply(token.policy_id, newSupply);
    }
    // Return the inserted mint record
    const mint = await (0, database_1.queryOne)('SELECT * FROM cardano_mints WHERE tx_hash = ?', [mintData.txHash]);
    if (!mint) {
        throw new Error('Failed to save mint transaction');
    }
    return mint;
}
/**
 * Get mint history for a token
 */
async function getMintHistory(policyId, limit = 10) {
    const sql = `
    SELECT m.* FROM cardano_mints m
    JOIN cardano_tokens t ON m.token_id = t.id
    WHERE t.policy_id = ?
    ORDER BY m.created_at DESC
    LIMIT ?
  `;
    return await (0, database_1.query)(sql, [policyId, limit]);
}
// ==================== SWAP OPERATIONS ====================
/**
 * Save swap transaction
 * Called after successful token swap from be-offchain scripts
 */
async function saveSwapTransaction(swapData) {
    // Resolve fromTokenId
    let fromTokenId = swapData.fromTokenId;
    if (!fromTokenId && swapData.fromPolicyId) {
        const token = await getTokenByPolicyId(swapData.fromPolicyId);
        if (!token)
            throw new Error(`From token with policy ID ${swapData.fromPolicyId} not found`);
        fromTokenId = token.id;
    }
    // Resolve toTokenId
    let toTokenId = swapData.toTokenId;
    if (!toTokenId && swapData.toPolicyId) {
        const token = await getTokenByPolicyId(swapData.toPolicyId);
        if (!token)
            throw new Error(`To token with policy ID ${swapData.toPolicyId} not found`);
        toTokenId = token.id;
    }
    // Resolve hubTokenId if VIA_HUB
    let hubTokenId = swapData.hubTokenId;
    if (swapData.swapType === 'VIA_HUB' && !hubTokenId && swapData.hubPolicyId) {
        const token = await getTokenByPolicyId(swapData.hubPolicyId);
        if (!token)
            throw new Error(`Hub token with policy ID ${swapData.hubPolicyId} not found`);
        hubTokenId = token.id;
    }
    if (!fromTokenId || !toTokenId) {
        throw new Error('Both fromTokenId/fromPolicyId and toTokenId/toPolicyId must be provided');
    }
    const cardanoScanUrl = `https://preprod.cardanoscan.io/transaction/${swapData.txHash}`;
    const sql = `
    INSERT INTO cardano_swaps 
    (from_token_id, to_token_id, from_amount, to_amount, exchange_rate, 
     sender_address, recipient_address, tx_hash, cardano_scan_url, swap_type, hub_token_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
    await (0, database_1.query)(sql, [
        fromTokenId,
        toTokenId,
        swapData.fromAmount.toString(),
        swapData.toAmount.toString(),
        swapData.exchangeRate,
        swapData.senderAddress,
        swapData.recipientAddress,
        swapData.txHash,
        cardanoScanUrl,
        swapData.swapType,
        hubTokenId || null
    ]);
    // Return the inserted swap record
    const swap = await (0, database_1.queryOne)('SELECT * FROM cardano_swaps WHERE tx_hash = ?', [swapData.txHash]);
    if (!swap) {
        throw new Error('Failed to save swap transaction');
    }
    return swap;
}
/**
 * Get swap history
 */
async function getSwapHistory(limit = 10) {
    return await (0, database_1.query)('SELECT * FROM cardano_swaps ORDER BY created_at DESC LIMIT ?', [limit]);
}
/**
 * Get swap history for specific tokens
 */
async function getSwapHistoryByTokens(fromPolicyId, toPolicyId, limit = 10) {
    let sql = `
    SELECT s.* FROM cardano_swaps s
    JOIN cardano_tokens ft ON s.from_token_id = ft.id
    JOIN cardano_tokens tt ON s.to_token_id = tt.id
    WHERE 1=1
  `;
    const params = [];
    if (fromPolicyId) {
        sql += ' AND ft.policy_id = ?';
        params.push(fromPolicyId);
    }
    if (toPolicyId) {
        sql += ' AND tt.policy_id = ?';
        params.push(toPolicyId);
    }
    sql += ' ORDER BY s.created_at DESC LIMIT ?';
    params.push(limit);
    return await (0, database_1.query)(sql, params);
}
// ==================== STATISTICS ====================
/**
 * Get token statistics
 */
async function getTokenStats(policyId) {
    const token = await getTokenByPolicyId(policyId);
    if (!token) {
        throw new Error(`Token with policy ID ${policyId} not found`);
    }
    const mintStats = await (0, database_1.queryOne)(`SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total 
     FROM cardano_mints WHERE token_id = ?`, [token.id]);
    const swapStats = await (0, database_1.queryOne)(`SELECT COUNT(*) as count FROM cardano_swaps 
     WHERE from_token_id = ? OR to_token_id = ?`, [token.id, token.id]);
    const lastActivity = await (0, database_1.queryOne)(`SELECT MAX(created_at) as last_activity FROM (
      SELECT created_at FROM cardano_mints WHERE token_id = ?
      UNION ALL
      SELECT created_at FROM cardano_swaps WHERE from_token_id = ? OR to_token_id = ?
    ) activities`, [token.id, token.id, token.id]);
    return {
        totalMints: mintStats?.count || 0,
        totalMintedAmount: BigInt(mintStats?.total || '0'),
        totalSwaps: swapStats?.count || 0,
        lastActivity: lastActivity?.last_activity || null
    };
}

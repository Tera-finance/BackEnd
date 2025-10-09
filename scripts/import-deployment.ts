#!/usr/bin/env ts-node
/**
 * Import deployed token data from be-offchain deployment-info.json
 * Run this after deploying contracts with: npm run deploy
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { saveDeployedToken } from '../src/repositories/cardano.repository';
import { closePool } from '../src/utils/database';

interface DeploymentInfo {
  timestamp: string;
  network: 'Preprod' | 'Mainnet';
  walletAddress: string;
  tokens: Array<{
    name: string;
    policyId: string;
    txHash: string;
    success: boolean;
    cardanoscanUrl: string;
    policyUrl: string;
  }>;
}

async function importDeployment() {
  try {
    // Read deployment info from local backend directory
    const deploymentPath = join(__dirname, '../deployment-info.json');
    console.log(`📂 Reading deployment info from: ${deploymentPath}`);
    
    const deploymentData: DeploymentInfo = JSON.parse(
      readFileSync(deploymentPath, 'utf-8')
    );

    console.log(`\n🌐 Network: ${deploymentData.network}`);
    console.log(`📅 Deployment Time: ${deploymentData.timestamp}`);
    console.log(`💼 Wallet: ${deploymentData.walletAddress}`);
    console.log(`🪙 Tokens to import: ${deploymentData.tokens.length}\n`);

    // Import each token
    let successCount = 0;
    for (const token of deploymentData.tokens) {
      if (!token.success) {
        console.log(`⏭️  Skipping failed token: ${token.name}`);
        continue;
      }

      try {
        // Map token names to symbols and decimals
        const tokenConfig = getTokenConfig(token.name);
        
        const savedToken = await saveDeployedToken({
          tokenName: token.name,
          tokenSymbol: tokenConfig.symbol,
          policyId: token.policyId,
          assetUnit: `${token.policyId}.${tokenConfig.symbol}`,
          decimals: tokenConfig.decimals,
          totalSupply: BigInt(0), // Initial supply is 0, will be updated when minting
          deploymentTxHash: token.txHash,
          cardanoNetwork: deploymentData.network,
          description: `${tokenConfig.symbol} stablecoin on Cardano ${deploymentData.network}`
        });

        console.log(`✅ Imported: ${token.name} (${tokenConfig.symbol})`);
        console.log(`   Policy ID: ${token.policyId}`);
        console.log(`   TX: ${token.txHash}`);
        console.log(`   Database ID: ${savedToken.id}\n`);
        
        successCount++;
      } catch (error: any) {
        if (error.message?.includes('Duplicate entry')) {
          console.log(`⚠️  Already exists: ${token.name} - skipping`);
        } else {
          console.error(`❌ Error importing ${token.name}:`, error.message);
        }
      }
    }

    console.log(`\n✨ Import complete!`);
    console.log(`   Successfully imported: ${successCount}/${deploymentData.tokens.length} tokens`);
    
  } catch (error: any) {
    console.error('\n❌ Import failed:', error.message);
    process.exit(1);
  } finally {
    await closePool();
    process.exit(0);
  }
}

/**
 * Get token configuration (symbol and decimals)
 */
function getTokenConfig(tokenName: string): { symbol: string; decimals: number } {
  const configs: Record<string, { symbol: string; decimals: number }> = {
    'mockUSDC': { symbol: 'USDC', decimals: 6 },
    'mockCNHT': { symbol: 'CNHT', decimals: 6 },
    'mockEUROC': { symbol: 'EUROC', decimals: 6 },
    'mockIDRX': { symbol: 'IDRX', decimals: 2 },
    'mockJPYC': { symbol: 'JPYC', decimals: 2 },
    'mockMXNT': { symbol: 'MXNT', decimals: 6 },
  };

  return configs[tokenName] || { symbol: tokenName.replace('mock', ''), decimals: 6 };
}

// Run the import
importDeployment();

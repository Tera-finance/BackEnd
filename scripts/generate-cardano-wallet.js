const fs = require('fs');
const path = require('path');
const CardanoWasm = require('@emurgo/cardano-serialization-lib-nodejs');
const bip39 = require('bip39');

function harden(num) {
  return 0x80000000 + num;
}

async function generateWallet() {
  try {
    console.log('🔑 Generating new Cardano wallet...\n');

    // Generate mnemonic
    const mnemonic = bip39.generateMnemonic(256); // 24 words
    console.log('✅ Mnemonic generated (24 words)');
    console.log('⚠️  SAVE THIS SECURELY - This is your wallet recovery phrase!\n');
    console.log(mnemonic);
    console.log('');

    // Convert mnemonic to entropy
    const entropy = bip39.mnemonicToEntropy(mnemonic);
    const rootKey = CardanoWasm.Bip32PrivateKey.from_bip39_entropy(
      Buffer.from(entropy, 'hex'),
      Buffer.from('')
    );

    // Derive payment key (m/1852'/1815'/0'/0/0)
    const accountKey = rootKey
      .derive(harden(1852)) // purpose
      .derive(harden(1815)) // coin_type (ADA)
      .derive(harden(0));   // account

    const paymentKey = accountKey
      .derive(0)  // external chain
      .derive(0); // address_index

    // Generate address (testnet) - using enterprise address for simplicity
    const paymentKeyHash = paymentKey
      .to_public()
      .to_raw_key()
      .hash();

    // Create enterprise address (simpler, no staking)
    const enterpriseAddr = CardanoWasm.EnterpriseAddress.new(
      0, // testnet network id
      CardanoWasm.StakeCredential.from_keyhash(paymentKeyHash)
    );

    const address = enterpriseAddr.to_address().to_bech32();
    const privateKeyHex = Buffer.from(paymentKey.as_bytes()).toString('hex');

    console.log('✅ Wallet generated successfully!\n');
    console.log('📍 Address (Preprod Testnet):');
    console.log(address);
    console.log('');

    // Save to file
    const walletData = {
      mnemonic,
      privateKey: privateKeyHex,
      address,
      network: 'Preprod',
      createdAt: new Date().toISOString()
    };

    const walletPath = path.join(process.cwd(), '.cardano-wallet.json');
    fs.writeFileSync(walletPath, JSON.stringify(walletData, null, 2));

    console.log(`✅ Wallet saved to: ${walletPath}\n`);
    console.log('⚠️  IMPORTANT SECURITY NOTES:');
    console.log('   1. Back up your mnemonic phrase in a secure location');
    console.log('   2. Never share your private key or mnemonic');
    console.log('   3. The .cardano-wallet.json file contains sensitive data');
    console.log('   4. This file is already in .gitignore\n');
    console.log('📝 Next steps:');
    console.log('   1. Fund this wallet from the Cardano testnet faucet:');
    console.log('      https://docs.cardano.org/cardano-testnet/tools/faucet/');
    console.log('   2. Start your backend: npm run build && npm start');
    console.log('   3. Check balance: curl http://localhost:3000/api/cardano/backend-info\n');

  } catch (error) {
    console.error('❌ Error generating wallet:', error);
    process.exit(1);
  }
}

generateWallet();

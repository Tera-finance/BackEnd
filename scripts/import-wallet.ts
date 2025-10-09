import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function importWallet() {
  console.log('🔑 Cardano Wallet Import Tool\n');
  console.log('⚠️  WARNING: This will overwrite any existing wallet!\n');

  const privateKey = await question('Enter your Cardano private key (ed25519): ');

  if (!privateKey || privateKey.trim() === '') {
    console.log('❌ Private key is required');
    rl.close();
    return;
  }

  const address = await question('Enter your Cardano address (optional, will be derived): ');

  const walletData = {
    privateKey: privateKey.trim(),
    address: address.trim() || 'will-be-derived-on-startup',
    createdAt: new Date().toISOString()
  };

  const walletPath = path.join(process.cwd(), '.cardano-wallet.json');

  try {
    fs.writeFileSync(walletPath, JSON.stringify(walletData, null, 2));
    console.log('\n✅ Wallet imported successfully!');
    console.log('📁 Saved to:', walletPath);
    console.log('\n⚠️  IMPORTANT:');
    console.log('1. Keep this file secure and backed up');
    console.log('2. Never commit it to git (already in .gitignore)');
    console.log('3. Start your server with: npm run build && npm start');
  } catch (error) {
    console.error('❌ Error saving wallet:', error);
  }

  rl.close();
}

importWallet();

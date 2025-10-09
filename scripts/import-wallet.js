"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const readline = __importStar(require("readline"));
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
function question(query) {
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
    }
    catch (error) {
        console.error('❌ Error saving wallet:', error);
    }
    rl.close();
}
importWallet();

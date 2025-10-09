"use strict";
// Supported currencies configuration for TrustBridge global remittance
Object.defineProperty(exports, "__esModule", { value: true });
exports.MOCK_TOKEN_POLICIES = exports.MOCK_TOKEN_MAPPING = exports.RECIPIENT_CURRENCIES = exports.WALLET_CURRENCIES = exports.MASTERCARD_CURRENCIES = void 0;
exports.getCurrencyByCode = getCurrencyByCode;
exports.hasMockToken = hasMockToken;
exports.getMockToken = getMockToken;
exports.getPolicyId = getPolicyId;
// Mastercard supported fiat currencies
exports.MASTERCARD_CURRENCIES = [
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', type: 'fiat' },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', type: 'fiat' },
    { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', type: 'fiat' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', type: 'fiat' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', type: 'fiat' },
    { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽', type: 'fiat' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', type: 'fiat' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', type: 'fiat' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭', type: 'fiat' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', type: 'fiat' },
];
// Wallet/Crypto supported currencies
exports.WALLET_CURRENCIES = [
    { code: 'ADA', name: 'Cardano', symbol: '₳', type: 'crypto', decimals: 6 },
    { code: 'USDT', name: 'Tether', symbol: '₮', type: 'crypto', decimals: 6 },
    { code: 'USDC', name: 'USD Coin', symbol: 'USDC', type: 'crypto', decimals: 6 },
    { code: 'mockUSDC', name: 'Mock USD Coin', symbol: 'mUSDC', type: 'mock', decimals: 6 },
    { code: 'mockEUROC', name: 'Mock Euro Coin', symbol: 'mEUROC', type: 'mock', decimals: 6 },
    { code: 'mockCNHT', name: 'Mock CNY Token', symbol: 'mCNHT', type: 'mock', decimals: 6 },
    { code: 'mockJPYC', name: 'Mock JPY Coin', symbol: 'mJPYC', type: 'mock', decimals: 6 },
    { code: 'mockMXNT', name: 'Mock MXN Token', symbol: 'mMXNT', type: 'mock', decimals: 6 },
    { code: 'mockIDRX', name: 'Mock IDR Token', symbol: 'mIDRX', type: 'mock', decimals: 6 },
];
// Recipient bank payout currencies
exports.RECIPIENT_CURRENCIES = [
    // Asia Pacific
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩', region: 'APAC', mockToken: 'mockIDRX' },
    { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭', region: 'APAC' },
    { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳', region: 'APAC' },
    { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭', region: 'APAC' },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾', region: 'APAC' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', region: 'APAC' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', region: 'APAC' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', region: 'APAC', mockToken: 'mockJPYC' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', region: 'APAC', mockToken: 'mockCNHT' },
    // Americas
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', region: 'Americas', mockToken: 'mockUSDC' },
    { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽', region: 'Americas', mockToken: 'mockMXNT' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷', region: 'Americas' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', region: 'Americas' },
    { code: 'ARS', name: 'Argentine Peso', symbol: '$', flag: '🇦🇷', region: 'Americas' },
    // Europe
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', region: 'Europe', mockToken: 'mockEUROC' },
    { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', region: 'Europe' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭', region: 'Europe' },
    { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱', region: 'Europe' },
    // Africa & Middle East
    { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦', region: 'Africa' },
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', region: 'Africa' },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪', region: 'Africa' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪', region: 'Middle East' },
];
// Mock token mapping
exports.MOCK_TOKEN_MAPPING = {
    'USD': 'mockUSDC',
    'EUR': 'mockEUROC',
    'CNY': 'mockCNHT',
    'JPY': 'mockJPYC',
    'MXN': 'mockMXNT',
    'IDR': 'mockIDRX',
};
// Policy IDs for deployed mock tokens (from plutus.json)
exports.MOCK_TOKEN_POLICIES = {
    'mockUSDC': '4cbb15ff52c7459cd734c79c1a9fae87cab77b2a49f9a83907c8125d',
    'mockCNHT': 'c7bdad55621e968c6ccb0967493808c9ab50601b3b9aec77b2ba6888',
    'mockEUROC': 'f766f151787a989166869375f4c57cfa36c533241033c8000a5481c1',
    'mockIDRX': '5c9a67cc3c085c4ad001492d1e460f5aea9cc2b8847c23e1683c26d9',
    'mockJPYC': '7725300e8d414e0fccad0a562e3a9c585970e84e7e92d422111e1e29',
    'mockMXNT': 'c73682653bd1ff615e54a3d79c00068e1f4977a7a9628f39add50dc3',
};
// Helper functions
function getCurrencyByCode(code) {
    const allCurrencies = [
        ...exports.MASTERCARD_CURRENCIES,
        ...exports.WALLET_CURRENCIES,
        ...exports.RECIPIENT_CURRENCIES,
    ];
    return allCurrencies.find(c => c.code === code);
}
function hasMockToken(currencyCode) {
    return currencyCode in exports.MOCK_TOKEN_MAPPING;
}
function getMockToken(currencyCode) {
    return exports.MOCK_TOKEN_MAPPING[currencyCode] || null;
}
function getPolicyId(mockToken) {
    return exports.MOCK_TOKEN_POLICIES[mockToken] || null;
}

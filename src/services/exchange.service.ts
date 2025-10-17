import axios from 'axios';
import NodeCache from 'node-cache';
import { config } from '../utils/config.js';

// Cache exchange rates for 5 minutes
const rateCache = new NodeCache({ stdTTL: 300 });

interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
}

interface Currency {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
}

const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2 },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', decimals: 0 },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimals: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0 },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso', decimals: 2 }
];

// Token to currency mapping
const TOKEN_CURRENCY_MAP: Record<string, string> = {
  'USDC': 'USD',
  'IDRX': 'IDR',
  'CNHT': 'CNY',
  'EUROC': 'EUR',
  'JPYC': 'JPY',
  'MXNT': 'MXN'
};

export class ExchangeService {
  /**
   * Get all supported currencies
   */
  static getSupportedCurrencies(): Currency[] {
    return SUPPORTED_CURRENCIES;
  }

  /**
   * Get currency info by code
   */
  static getCurrencyInfo(code: string): Currency | undefined {
    return SUPPORTED_CURRENCIES.find(c => c.code === code);
  }

  /**
   * Get currency code from token symbol
   */
  static getCurrencyFromToken(tokenSymbol: string): string {
    return TOKEN_CURRENCY_MAP[tokenSymbol] || tokenSymbol;
  }

  /**
   * Get token symbol from currency code
   */
  static getTokenFromCurrency(currencyCode: string): string {
    const entry = Object.entries(TOKEN_CURRENCY_MAP).find(([_, currency]) => currency === currencyCode);
    return entry ? entry[0] : currencyCode;
  }

  /**
   * Fetch exchange rate from external API
   */
  static async fetchExchangeRate(from: string, to: string): Promise<number> {
    // Check cache first
    const cacheKey = `${from}-${to}`;
    const cached = rateCache.get<number>(cacheKey);
    if (cached) {
      console.log(`📦 Using cached rate for ${from}/${to}: ${cached}`);
      return cached;
    }

    try {
      // If same currency, rate is 1
      if (from === to) {
        return 1;
      }

      // Use exchangerate-api.com (free tier, no API key needed)
      const url = `${config.exchange.apiUrl}/${from}`;
      console.log(`🌐 Fetching exchange rate: ${url}`);

      const response = await axios.get(url, { timeout: 5000 });

      if (!response.data || !response.data.rates) {
        throw new Error('Invalid response from exchange rate API');
      }

      const rate = response.data.rates[to];
      if (!rate) {
        throw new Error(`Exchange rate not found for ${from}/${to}`);
      }

      // Cache the result
      rateCache.set(cacheKey, rate);
      console.log(`✅ Fetched rate for ${from}/${to}: ${rate}`);

      return rate;
    } catch (error: any) {
      console.error(`❌ Error fetching exchange rate for ${from}/${to}:`, error.message);

      // Return fallback rates based on approximate real-world values
      const fallbackRates = this.getFallbackRate(from, to);
      if (fallbackRates) {
        console.log(`⚠️  Using fallback rate for ${from}/${to}: ${fallbackRates}`);
        return fallbackRates;
      }

      throw new Error(`Failed to get exchange rate for ${from}/${to}`);
    }
  }

  /**
   * Get fallback rates when API is unavailable
   */
  private static getFallbackRate(from: string, to: string): number | null {
    // Approximate rates (as of late 2024)
    const usdRates: Record<string, number> = {
      'IDR': 15700,
      'CNY': 7.24,
      'EUR': 0.92,
      'JPY': 149.50,
      'MXN': 17.05,
      'USD': 1
    };

    if (from === 'USD' && usdRates[to]) {
      return usdRates[to];
    }

    if (to === 'USD' && usdRates[from]) {
      return 1 / usdRates[from];
    }

    // Cross-rate calculation: from -> USD -> to
    if (usdRates[from] && usdRates[to]) {
      return usdRates[to] / usdRates[from];
    }

    return null;
  }

  /**
   * Get all exchange rates for a base currency
   */
  static async getAllRates(baseCurrency: string = 'USD'): Promise<Record<string, number>> {
    const rates: Record<string, number> = {};

    for (const currency of SUPPORTED_CURRENCIES) {
      if (currency.code === baseCurrency) {
        rates[currency.code] = 1;
      } else {
        try {
          rates[currency.code] = await this.fetchExchangeRate(baseCurrency, currency.code);
        } catch (error) {
          console.error(`Failed to fetch rate for ${currency.code}`);
          rates[currency.code] = 0;
        }
      }
    }

    return rates;
  }

  /**
   * Calculate conversion amount
   */
  static async convertAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<{ convertedAmount: number; rate: number }> {
    const rate = await this.fetchExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = amount * rate;

    return {
      convertedAmount,
      rate
    };
  }

  /**
   * Calculate transfer quote with fees
   */
  static async getTransferQuote(
    senderCurrency: string,
    recipientCurrency: string,
    amount: number,
    feePercentage: number = 1.5
  ): Promise<{
    senderAmount: number;
    recipientAmount: number;
    exchangeRate: number;
    feeAmount: number;
    totalAmount: number;
    senderToken: string;
    recipientToken: string;
  }> {
    // Get exchange rate
    const { rate, convertedAmount } = await this.convertAmount(amount, senderCurrency, recipientCurrency);

    // Calculate fee
    const feeAmount = amount * (feePercentage / 100);
    const totalAmount = amount + feeAmount;

    // Get corresponding token symbols
    const senderToken = this.getTokenFromCurrency(senderCurrency);
    const recipientToken = this.getTokenFromCurrency(recipientCurrency);

    return {
      senderAmount: amount,
      recipientAmount: convertedAmount,
      exchangeRate: rate,
      feeAmount,
      totalAmount,
      senderToken,
      recipientToken
    };
  }

  /**
   * Clear rate cache (for testing)
   */
  static clearCache(): void {
    rateCache.flushAll();
  }
}

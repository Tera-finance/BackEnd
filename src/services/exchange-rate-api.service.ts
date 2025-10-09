import axios from 'axios';
import NodeCache from 'node-cache';

/**
 * Exchange Rate API Service
 * Integrates multiple exchange rate APIs for real-time currency conversion
 * 
 * APIs used:
 * 1. CoinGecko - For crypto prices (ADA, USDT, USDC)
 * 2. ExchangeRate-API - For fiat currency rates
 * 3. Fallback to cached rates if APIs fail
 */

interface ExchangeRates {
  [currency: string]: number;
}

interface CryptoPrice {
  usd: number;
  eur: number;
  jpy: number;
  cny: number;
  idr: number;
  [key: string]: number; // Allow indexing with any string
}

export class ExchangeRateAPIService {
  private cache: NodeCache;
  private readonly CACHE_TTL = 300; // 5 minutes cache
  
  // API endpoints
  private readonly COINGECKO_API = 'https://api.coingecko.com/api/v3';
  private readonly EXCHANGERATE_API = 'https://api.exchangerate-api.com/v4/latest';
  
  constructor() {
    this.cache = new NodeCache({ stdTTL: this.CACHE_TTL });
  }

  /**
   * Get ADA price in multiple fiat currencies
   */
  async getADAPrices(): Promise<CryptoPrice> {
    const cacheKey = 'ada_prices';
    const cached = this.cache.get<CryptoPrice>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await axios.get(
        `${this.COINGECKO_API}/simple/price`,
        {
          params: {
            ids: 'cardano',
            vs_currencies: 'usd,eur,jpy,cny,idr,gbp,mxn,php,vnd,thb,inr,sgd,myr,brl,cad,chf,zar,ngn,aed',
          },
        }
      );

      const prices = response.data.cardano;
      this.cache.set(cacheKey, prices);
      
      return prices;
    } catch (error) {
      console.error('Error fetching ADA prices from CoinGecko:', error);
      
      // Fallback to default rates
      return {
        usd: 0.67,
        eur: 0.62,
        jpy: 98.0,
        cny: 4.85,
        idr: 10500,
      };
    }
  }

  /**
   * Get fiat currency exchange rates (base: USD)
   */
  async getFiatRates(): Promise<ExchangeRates> {
    const cacheKey = 'fiat_rates';
    const cached = this.cache.get<ExchangeRates>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await axios.get(`${this.EXCHANGERATE_API}/USD`);
      const rates = response.data.rates;
      
      this.cache.set(cacheKey, rates);
      return rates;
    } catch (error) {
      console.error('Error fetching fiat rates:', error);
      
      // Fallback rates
      return {
        EUR: 0.92,
        GBP: 0.79,
        JPY: 149.50,
        CNY: 7.24,
        MXN: 17.08,
        IDR: 15629.60,
        PHP: 56.18,
        VND: 24520,
        THB: 35.80,
        MYR: 4.72,
        INR: 83.12,
        SGD: 1.34,
        BRL: 4.98,
        CAD: 1.36,
        AUD: 1.52,
        CHF: 0.88,
        ZAR: 18.65,
        NGN: 1570,
        AED: 3.67,
      };
    }
  }

  /**
   * Convert any currency to ADA
   */
  async convertToADA(amount: number, fromCurrency: string): Promise<number> {
    const adaPrices = await this.getADAPrices();
    
    // If currency is directly available in ADA prices
    const directPrice = adaPrices[fromCurrency.toLowerCase()];
    if (directPrice) {
      return amount / directPrice;
    }

    // Convert via USD for other currencies
    const fiatRates = await this.getFiatRates();
    const usdRate = fiatRates[fromCurrency] || 1;
    const amountInUSD = amount / usdRate;
    
    return amountInUSD / adaPrices.usd;
  }

  /**
   * Convert ADA to any currency
   */
  async convertFromADA(adaAmount: number, toCurrency: string): Promise<number> {
    const adaPrices = await this.getADAPrices();
    
    // If currency is directly available in ADA prices
    const directPrice = adaPrices[toCurrency.toLowerCase()];
    if (directPrice) {
      return adaAmount * directPrice;
    }

    // Convert via USD for other currencies
    const fiatRates = await this.getFiatRates();
    const amountInUSD = adaAmount * adaPrices.usd;
    const usdRate = fiatRates[toCurrency] || 1;
    
    return amountInUSD * usdRate;
  }

  /**
   * Get exchange rate between any two currencies
   */
  async getExchangeRate(from: string, to: string): Promise<number> {
    if (from === to) return 1.0;

    const adaPrices = await this.getADAPrices();
    const fiatRates = await this.getFiatRates();

    // Both are in ADA prices
    const fromInADA = adaPrices[from.toLowerCase()];
    const toInADA = adaPrices[to.toLowerCase()];
    
    if (fromInADA && toInADA) {
      return fromInADA / toInADA;
    }

    // Convert via USD
    const fromRate = fiatRates[from] || 1;
    const toRate = fiatRates[to] || 1;
    
    return toRate / fromRate;
  }

  /**
   * Convert between any two currencies
   */
  async convert(amount: number, from: string, to: string): Promise<number> {
    const rate = await this.getExchangeRate(from, to);
    return amount * rate;
  }

  /**
   * Get conversion details including path
   */
  async getConversionDetails(
    amount: number,
    from: string,
    to: string
  ): Promise<{
    originalAmount: number;
    originalCurrency: string;
    adaAmount: number;
    finalAmount: number;
    finalCurrency: string;
    exchangeRate: number;
    path: string[];
  }> {
    const adaAmount = await this.convertToADA(amount, from);
    const finalAmount = await this.convertFromADA(adaAmount, to);
    const directRate = await this.getExchangeRate(from, to);

    return {
      originalAmount: amount,
      originalCurrency: from,
      adaAmount,
      finalAmount,
      finalCurrency: to,
      exchangeRate: directRate,
      path: [from, 'ADA', to],
    };
  }

  /**
   * Get crypto token prices (USDT, USDC, etc.)
   */
  async getCryptoPrice(symbol: string): Promise<number> {
    const cacheKey = `crypto_${symbol}`;
    const cached = this.cache.get<number>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const coinIds: Record<string, string> = {
        'USDT': 'tether',
        'USDC': 'usd-coin',
        'ADA': 'cardano',
      };

      const coinId = coinIds[symbol.toUpperCase()];
      if (!coinId) return 1.0;

      const response = await axios.get(
        `${this.COINGECKO_API}/simple/price`,
        {
          params: {
            ids: coinId,
            vs_currencies: 'usd',
          },
        }
      );

      const price = response.data[coinId].usd;
      this.cache.set(cacheKey, price);
      
      return price;
    } catch (error) {
      console.error(`Error fetching ${symbol} price:`, error);
      
      // Fallback prices
      const fallbackPrices: Record<string, number> = {
        'USDT': 1.0,
        'USDC': 1.0,
        'ADA': 0.67,
      };
      
      return fallbackPrices[symbol.toUpperCase()] || 1.0;
    }
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.flushAll();
  }
}

// Export singleton instance
export const exchangeRateService = new ExchangeRateAPIService();

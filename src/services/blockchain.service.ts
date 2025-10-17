import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  formatUnits,
  Address,
  parseAbi
} from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { config } from '../utils/config.js';

// RemittanceSwap ABI (simplified - add full ABI later)
const REMITTANCE_SWAP_ABI = parseAbi([
  'function swapUSDCToIDRX(uint256 amountIn, address recipient, uint256 minAmountOut) external returns (uint256)',
  'function getEstimatedOutput(uint256 amountIn) external returns (uint256 estimatedOut, uint256 fee, uint256 netOut)',
  'function feeRate() external view returns (uint256)',
  'function minSwapAmount() external view returns (uint256)',
  'function maxSwapAmount() external view returns (uint256)',
  'event SwapExecuted(address indexed sender, address indexed recipient, uint256 amountIn, uint256 amountOut, uint256 fee)'
]);

// MultiTokenSwap ABI
const MULTI_TOKEN_SWAP_ABI = parseAbi([
  'function swap(address tokenIn, address tokenOut, uint256 amountIn, address recipient, uint256 minAmountOut) external returns (uint256)',
  'function getEstimatedOutput(address tokenIn, address tokenOut, uint256 amountIn) external returns (uint256 estimatedOut, uint256 fee, uint256 netOut)',
  'function supportedTokens(address token) external view returns (bool)',
  'function getSupportedTokens() external view returns (address[])',
  'event SwapExecuted(address indexed sender, address indexed recipient, address indexed tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut, uint256 fee)'
]);

// ERC20 ABI
const ERC20_ABI = parseAbi([
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function name() external view returns (string)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
]);

class BlockchainService {
  private publicClient;
  private walletClient;
  private account;

  constructor() {
    // Initialize public client for reading blockchain data with timeouts
    this.publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(config.blockchain.rpcUrl, {
        timeout: 10000, // 10 second timeout
        retryCount: 2,
        retryDelay: 1000
      })
    });

    // Initialize wallet client only if private key is available
    if (config.blockchain.privateKey) {
      try {
        this.account = privateKeyToAccount(config.blockchain.privateKey as Address);

        this.walletClient = createWalletClient({
          account: this.account,
          chain: baseSepolia,
          transport: http(config.blockchain.rpcUrl, {
            timeout: 10000,
            retryCount: 2,
            retryDelay: 1000
          })
        });
      } catch (error) {
        console.warn('⚠️  Failed to initialize wallet client:', error);
      }
    }
  }

  // ==================== WALLET OPERATIONS ====================

  async getBackendAddress(): Promise<string> {
    if (!this.account) {
      throw new Error('Backend wallet not configured');
    }
    return this.account.address;
  }

  async getBalance(address?: string): Promise<{ native: string; formatted: string }> {
    const targetAddress = (address || this.account?.address) as Address;
    if (!targetAddress) {
      throw new Error('No address provided');
    }

    try {
      const balance = await this.publicClient.getBalance({ address: targetAddress });
      return {
        native: balance.toString(),
        formatted: formatUnits(balance, 18) // ETH has 18 decimals
      };
    } catch (error: any) {
      console.error('Error getting balance:', error.message);
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  // ==================== TOKEN OPERATIONS ====================

  async getTokenBalance(tokenAddress: string, walletAddress?: string): Promise<{ balance: string; formatted: string; decimals: number }> {
    const targetAddress = (walletAddress || this.account?.address) as Address;
    if (!targetAddress) {
      throw new Error('No address provided');
    }

    const balance = await this.publicClient.readContract({
      address: tokenAddress as Address,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [targetAddress]
    }) as bigint;

    const decimals = await this.publicClient.readContract({
      address: tokenAddress as Address,
      abi: ERC20_ABI,
      functionName: 'decimals'
    }) as number;

    return {
      balance: balance.toString(),
      formatted: formatUnits(balance, decimals),
      decimals
    };
  }

  async getTokenInfo(tokenAddress: string): Promise<{ name: string; symbol: string; decimals: number }> {
    try {
      const [name, symbol, decimals] = await Promise.all([
        this.publicClient.readContract({
          address: tokenAddress as Address,
          abi: ERC20_ABI,
          functionName: 'name'
        }) as Promise<string>,
        this.publicClient.readContract({
          address: tokenAddress as Address,
          abi: ERC20_ABI,
          functionName: 'symbol'
        }) as Promise<string>,
        this.publicClient.readContract({
          address: tokenAddress as Address,
          abi: ERC20_ABI,
          functionName: 'decimals'
        }) as Promise<number>
      ]);

      return { name, symbol, decimals };
    } catch (error: any) {
      console.error('Error getting token info:', error.message);
      throw new Error(`Failed to get token info: ${error.message}`);
    }
  }

  // ==================== SWAP OPERATIONS ====================

  async estimateSwapOutput(amountIn: string): Promise<{ estimatedOut: string; fee: string; netOut: string }> {
    if (!config.contracts.remittanceSwap) {
      throw new Error('RemittanceSwap contract address not configured');
    }

    // Note: This function may not exist on the contract if not exposed
    // Using simulation instead for now
    return {
      estimatedOut: '0',
      fee: '0',
      netOut: '0'
    };
  }

  async estimateMultiTokenSwap(
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<{ estimatedOut: string; fee: string; netOut: string }> {
    if (!config.contracts.multiTokenSwap) {
      throw new Error('MultiTokenSwap contract address not configured');
    }

    // Note: This function may not exist on the contract if not exposed
    // Using simulation instead for now
    return {
      estimatedOut: '0',
      fee: '0',
      netOut: '0'
    };
  }

  // ==================== TRANSACTION STATUS ====================

  async getTransaction(txHash: string) {
    return await this.publicClient.getTransaction({ hash: txHash as Address });
  }

  async getTransactionReceipt(txHash: string) {
    return await this.publicClient.getTransactionReceipt({ hash: txHash as Address });
  }

  async waitForTransaction(txHash: string, confirmations: number = 1) {
    return await this.publicClient.waitForTransactionReceipt({
      hash: txHash as Address,
      confirmations
    });
  }

  // ==================== UTILITY METHODS ====================

  async getBlockNumber(): Promise<bigint> {
    try {
      return await this.publicClient.getBlockNumber();
    } catch (error: any) {
      console.error('Error getting block number:', error.message);
      throw new Error(`Failed to get block number: ${error.message}`);
    }
  }

  async getGasPrice(): Promise<string> {
    try {
      const gasPrice = await this.publicClient.getGasPrice();
      return gasPrice.toString();
    } catch (error: any) {
      console.error('Error getting gas price:', error.message);
      throw new Error(`Failed to get gas price: ${error.message}`);
    }
  }

  isReady(): boolean {
    return this.walletClient !== undefined && this.account !== undefined;
  }

  getExplorerUrl(txHash: string): string {
    return `${config.blockchain.explorerUrl}/tx/${txHash}`;
  }

  getAddressExplorerUrl(address: string): string {
    return `${config.blockchain.explorerUrl}/address/${address}`;
  }
}

// Export class for lazy initialization
let _blockchainService: BlockchainService | null = null;

export function getBlockchainService(): BlockchainService {
  if (!_blockchainService) {
    _blockchainService = new BlockchainService();
  }
  return _blockchainService;
}

// Also export direct instance for backward compatibility (but use getter in routes)
export const blockchainService = {
  get instance() {
    return getBlockchainService();
  }
};

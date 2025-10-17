import { createPublicClient, createWalletClient, http, formatUnits, parseAbi } from 'viem';
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
    constructor() {
        // Initialize public client for reading blockchain data
        this.publicClient = createPublicClient({
            chain: baseSepolia,
            transport: http(config.blockchain.rpcUrl)
        });
        // Initialize wallet client only if private key is available
        if (config.blockchain.privateKey) {
            this.account = privateKeyToAccount(config.blockchain.privateKey);
            this.walletClient = createWalletClient({
                account: this.account,
                chain: baseSepolia,
                transport: http(config.blockchain.rpcUrl)
            });
        }
    }
    // ==================== WALLET OPERATIONS ====================
    async getBackendAddress() {
        if (!this.account) {
            throw new Error('Backend wallet not configured');
        }
        return this.account.address;
    }
    async getBalance(address) {
        const targetAddress = (address || this.account?.address);
        if (!targetAddress) {
            throw new Error('No address provided');
        }
        const balance = await this.publicClient.getBalance({ address: targetAddress });
        return {
            native: balance.toString(),
            formatted: formatUnits(balance, 18) // ETH has 18 decimals
        };
    }
    // ==================== TOKEN OPERATIONS ====================
    async getTokenBalance(tokenAddress, walletAddress) {
        const targetAddress = (walletAddress || this.account?.address);
        if (!targetAddress) {
            throw new Error('No address provided');
        }
        const balance = await this.publicClient.readContract({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [targetAddress]
        });
        const decimals = await this.publicClient.readContract({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'decimals'
        });
        return {
            balance: balance.toString(),
            formatted: formatUnits(balance, decimals),
            decimals
        };
    }
    async getTokenInfo(tokenAddress) {
        const [name, symbol, decimals] = await Promise.all([
            this.publicClient.readContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: 'name'
            }),
            this.publicClient.readContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: 'symbol'
            }),
            this.publicClient.readContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: 'decimals'
            })
        ]);
        return { name, symbol, decimals };
    }
    // ==================== SWAP OPERATIONS ====================
    async estimateSwapOutput(amountIn) {
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
    async estimateMultiTokenSwap(tokenIn, tokenOut, amountIn) {
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
    async getTransaction(txHash) {
        return await this.publicClient.getTransaction({ hash: txHash });
    }
    async getTransactionReceipt(txHash) {
        return await this.publicClient.getTransactionReceipt({ hash: txHash });
    }
    async waitForTransaction(txHash, confirmations = 1) {
        return await this.publicClient.waitForTransactionReceipt({
            hash: txHash,
            confirmations
        });
    }
    // ==================== UTILITY METHODS ====================
    async getBlockNumber() {
        return await this.publicClient.getBlockNumber();
    }
    async getGasPrice() {
        const gasPrice = await this.publicClient.getGasPrice();
        return gasPrice.toString();
    }
    isReady() {
        return this.walletClient !== undefined && this.account !== undefined;
    }
    getExplorerUrl(txHash) {
        return `${config.blockchain.explorerUrl}/tx/${txHash}`;
    }
    getAddressExplorerUrl(address) {
        return `${config.blockchain.explorerUrl}/address/${address}`;
    }
}
// Export singleton instance
export const blockchainService = new BlockchainService();

import { cardanoWalletService } from './cardano-wallet.service.js';

type Lucid = any;
type UTxO = any;

/**
 * Cardano Smart Contract Service
 * Handles interaction with Plutus smart contracts on Cardano
 */
export class CardanoContractService {
  private lucid?: Lucid;

  constructor() {
    // Lucid will be loaded lazily
  }

  private async ensureLucid() {
    if (!this.lucid) {
      this.lucid = cardanoWalletService.getLucidInstance();
    }
  }

  /**
   * Get backend's public key hash to share with smart contract
   */
  async getBackendPublicKeyHash(): Promise<string> {
    return await cardanoWalletService.getBackendPublicKeyHash();
  }

  /**
   * Get backend's address to receive payments from smart contract
   */
  async getBackendAddress(): Promise<string> {
    return await cardanoWalletService.getBackendAddress();
  }

  /**
   * Lock funds in a smart contract
   * @param scriptAddress - The Plutus script address
   * @param amount - Amount in lovelace to lock
   * @param datum - Data to attach to the UTxO
   */
  async lockFundsInContract(
    scriptAddress: string,
    amount: bigint,
    datum: any
  ): Promise<string> {
    await this.ensureLucid();

    if (!this.lucid) {
      throw new Error('Cardano wallet service not initialized');
    }

    try {
      const { Data } = await import('lucid-cardano');
      // Convert datum to Plutus data format
      const datumData = Data.to(datum);

      // Build transaction
      const tx = await this.lucid
        .newTx()
        .payToContract(scriptAddress, { inline: datumData }, { lovelace: amount })
        .complete();

      // Sign transaction
      const signedTx = await tx.sign().complete();

      // Submit transaction
      const txHash = await signedTx.submit();

      console.log('✅ Funds locked in contract:', txHash);
      return txHash;
    } catch (error) {
      console.error('Error locking funds in contract:', error);
      throw error;
    }
  }

  /**
   * Unlock funds from a smart contract
   * @param scriptAddress - The Plutus script address
   * @param scriptCbor - The script CBOR hex string
   * @param utxos - UTxOs to spend from the script
   * @param redeemer - Redeemer data
   */
  async unlockFundsFromContract(
    scriptAddress: string,
    scriptCbor: string,
    utxos: UTxO[],
    redeemer: any
  ): Promise<string> {
    await this.ensureLucid();

    if (!this.lucid) {
      throw new Error('Cardano wallet service not initialized');
    }

    try {
      const { Data } = await import('lucid-cardano');
      const redeemerData = Data.to(redeemer);

      // Build transaction to spend from script
      const tx = await this.lucid
        .newTx()
        .collectFrom(utxos, redeemerData)
        .attachSpendingValidator({
          type: 'PlutusV2',
          script: scriptCbor
        })
        .complete();

      // Sign transaction with backend wallet
      const signedTx = await tx.sign().complete();

      // Submit transaction
      const txHash = await signedTx.submit();

      console.log('✅ Funds unlocked from contract:', txHash);
      return txHash;
    } catch (error) {
      console.error('Error unlocking funds from contract:', error);
      throw error;
    }
  }

  /**
   * Get UTxOs at a script address
   */
  async getScriptUtxos(scriptAddress: string): Promise<UTxO[]> {
    await this.ensureLucid();

    if (!this.lucid) {
      throw new Error('Cardano wallet service not initialized');
    }

    try {
      const utxos = await this.lucid.utxosAt(scriptAddress);
      return utxos;
    } catch (error) {
      console.error('Error getting script UTxOs:', error);
      throw error;
    }
  }

  /**
   * Submit signed transaction data (for when user signs on frontend)
   */
  async submitSignedTransaction(signedTxCbor: string): Promise<string> {
    await this.ensureLucid();

    if (!this.lucid) {
      throw new Error('Cardano wallet service not initialized');
    }

    try {
      const txHash = await this.lucid.provider.submitTx(signedTxCbor);
      console.log('✅ Signed transaction submitted:', txHash);
      return txHash;
    } catch (error) {
      console.error('Error submitting signed transaction:', error);
      throw error;
    }
  }

  /**
   * Build transaction for user to sign (when backend initiates but user pays)
   */
  async buildTransactionForUser(
    userAddress: string,
    scriptAddress: string,
    amount: bigint,
    datum: any
  ): Promise<string> {
    await this.ensureLucid();

    if (!this.lucid) {
      throw new Error('Cardano wallet service not initialized');
    }

    try {
      const { Data } = await import('lucid-cardano');
      const datumData = Data.to(datum);

      // Build transaction but don't sign
      const tx = await this.lucid
        .newTx()
        .payToContract(scriptAddress, { inline: datumData }, { lovelace: amount })
        .complete();

      // Return unsigned transaction CBOR for user to sign
      const unsignedTxCbor = tx.toString();
      console.log('✅ Transaction built for user to sign');

      return unsignedTxCbor;
    } catch (error) {
      console.error('Error building transaction for user:', error);
      throw error;
    }
  }

  /**
   * Create a datum with backend's public key hash
   * This can be used to prove the backend authorized the transaction
   */
  createDatumWithBackendAuth(additionalData: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const backendPkh = await this.getBackendPublicKeyHash();

        // Create datum structure (adjust based on your smart contract)
        const datum = {
          backendPubKeyHash: backendPkh,
          timestamp: BigInt(Date.now()),
          data: additionalData
        };

        resolve(datum);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Wait for transaction confirmation
   */
  async awaitTransactionConfirmation(txHash: string, maxWaitTime: number = 180000): Promise<boolean> {
    await this.ensureLucid();

    if (!this.lucid) {
      throw new Error('Cardano wallet service not initialized');
    }

    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const confirmed = await this.lucid.awaitTx(txHash);
        if (confirmed) {
          console.log('✅ Transaction confirmed:', txHash);
          return true;
        }
      } catch (error) {
        console.log('Waiting for confirmation...', txHash);
      }

      // Wait 5 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log('⏰ Transaction confirmation timeout:', txHash);
    return false;
  }

  /**
   * Get transaction details
   */
  async getTransaction(txHash: string): Promise<any> {
    await this.ensureLucid();

    if (!this.lucid) {
      throw new Error('Cardano wallet service not initialized');
    }

    try {
      // Note: This requires provider support
      const tx = await this.lucid.provider.getUtxosByOutRef([{ txHash, outputIndex: 0 }]);
      return tx;
    } catch (error) {
      console.error('Error getting transaction:', error);
      throw error;
    }
  }
}

export const cardanoContractService = new CardanoContractService();

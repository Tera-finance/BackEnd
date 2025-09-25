import { create } from 'ipfs-http-client';
import { config } from '../utils/config';
import { EncryptionUtil } from '../utils/encryption';

export class IPFSService {
  private ipfs: any;

  constructor() {
    this.ipfs = create({ url: config.ipfs.apiUrl });
  }

  async uploadDocument(fileBuffer: Buffer, metadata: any): Promise<string> {
    try {
      const documentData = {
        file: fileBuffer.toString('base64'),
        metadata,
        timestamp: new Date().toISOString()
      };

      const encryptedData = EncryptionUtil.encrypt(JSON.stringify(documentData));
      
      const result = await this.ipfs.add(encryptedData);
      
      console.log('Document uploaded to IPFS:', result.path);
      return result.path;
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw new Error('Failed to upload document to IPFS');
    }
  }

  async retrieveDocument(ipfsHash: string): Promise<any> {
    try {
      const chunks = [];
      
      for await (const chunk of this.ipfs.cat(ipfsHash)) {
        chunks.push(chunk);
      }
      
      const encryptedData = Buffer.concat(chunks).toString();
      const decryptedData = EncryptionUtil.decrypt(encryptedData);
      
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('IPFS retrieval error:', error);
      throw new Error('Failed to retrieve document from IPFS');
    }
  }

  async verifyDocument(ipfsHash: string): Promise<boolean> {
    try {
      const data = await this.retrieveDocument(ipfsHash);
      return data && data.file && data.metadata;
    } catch (error) {
      return false;
    }
  }
}
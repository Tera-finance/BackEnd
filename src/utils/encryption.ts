import CryptoJS from 'crypto-js';
import { config } from './config';

export class EncryptionUtil {
  private static readonly secretKey = config.encryption.key;

  static encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, this.secretKey).toString();
  }

  static decrypt(encryptedText: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedText, this.secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  static hash(text: string): string {
    return CryptoJS.SHA256(text).toString();
  }

  static generateRandomKey(length: number = 32): string {
    return CryptoJS.lib.WordArray.random(length).toString();
  }
}
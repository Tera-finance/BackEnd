import CryptoJS from 'crypto-js';
import { config } from './config.js';
export class EncryptionUtil {
    static encrypt(text) {
        return CryptoJS.AES.encrypt(text, this.secretKey).toString();
    }
    static decrypt(encryptedText) {
        const bytes = CryptoJS.AES.decrypt(encryptedText, this.secretKey);
        return bytes.toString(CryptoJS.enc.Utf8);
    }
    static hash(text) {
        return CryptoJS.SHA256(text).toString();
    }
    static generateRandomKey(length = 32) {
        return CryptoJS.lib.WordArray.random(length).toString();
    }
}
EncryptionUtil.secretKey = config.encryption.key;

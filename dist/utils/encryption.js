"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionUtil = void 0;
const crypto_js_1 = __importDefault(require("crypto-js"));
const config_1 = require("./config");
class EncryptionUtil {
    static encrypt(text) {
        return crypto_js_1.default.AES.encrypt(text, this.secretKey).toString();
    }
    static decrypt(encryptedText) {
        const bytes = crypto_js_1.default.AES.decrypt(encryptedText, this.secretKey);
        return bytes.toString(crypto_js_1.default.enc.Utf8);
    }
    static hash(text) {
        return crypto_js_1.default.SHA256(text).toString();
    }
    static generateRandomKey(length = 32) {
        return crypto_js_1.default.lib.WordArray.random(length).toString();
    }
}
exports.EncryptionUtil = EncryptionUtil;
EncryptionUtil.secretKey = config_1.config.encryption.key;

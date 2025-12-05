import CryptoJS from "crypto-js";

/**
 * Encrypts data using AES encryption with the provided key.
 * @param data - The data to encrypt (object or string).
 * @param key - The encryption key (user password).
 * @returns The encrypted string.
 */
export const encryptData = (data: any, key: string): string => {
  const jsonString = JSON.stringify(data);
  return CryptoJS.AES.encrypt(jsonString, key).toString();
};

/**
 * Decrypts data using AES encryption with the provided key.
 * @param ciphertext - The encrypted string.
 * @param key - The encryption key (user password).
 * @returns The decrypted data or null if decryption fails.
 */
export const decryptData = <T>(ciphertext: string, key: string): T | null => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

    if (!decryptedString) {
      return null;
    }

    return JSON.parse(decryptedString) as T;
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
};

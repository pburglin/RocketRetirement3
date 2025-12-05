import { encryptData, decryptData } from "../utils/crypto";

export interface Dependent {
  id: string;
  name: string;
  age: number;
}

export interface UserProfile {
  username: string;
  createdAt: string;

  // Personal Details (No PII like Name/Email/Phone/Address)
  dob?: string; // YYYY-MM-DD
  maritalStatus?: string;
  employmentStatus?: string;
  state?: string;
  dependents?: Dependent[];

  // Financial Modules (Arrays)
  incomeSources?: any[];
  expenses?: any[];
  assets?: any[];
  liabilities?: any[];
  investmentAccounts?: any[];

  // Settings
  theme?: "light" | "dark";
}

const STORAGE_PREFIX = "rocketfi_user_";

export const StorageService = {
  /**
   * Saves the user profile to LocalStorage, encrypted.
   */
  saveUser: (user: UserProfile, key: string): void => {
    if (!user.username || !key) {
      console.error("Cannot save: Missing username or key");
      return;
    }
    try {
      const encrypted = encryptData(user, key);
      localStorage.setItem(`${STORAGE_PREFIX}${user.username}`, encrypted);
    } catch (e) {
      console.error("Encryption failed during save:", e);
    }
  },

  /**
   * Loads a user profile from LocalStorage, attempting to decrypt.
   */
  loadUser: (username: string, key: string): UserProfile | null => {
    const encrypted = localStorage.getItem(`${STORAGE_PREFIX}${username}`);
    if (!encrypted) return null;

    return decryptData<UserProfile>(encrypted, key);
  },

  /**
   * Checks if a username already exists in LocalStorage.
   */
  userExists: (username: string): boolean => {
    return !!localStorage.getItem(`${STORAGE_PREFIX}${username}`);
  },

  /**
   * Returns a list of all locally stored usernames.
   */
  getExistingUsers: (): string[] => {
    const users: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        users.push(key.replace(STORAGE_PREFIX, ""));
      }
    }
    return users;
  },

  /**
   * Deletes a user profile from LocalStorage.
   */
  deleteUser: (username: string): void => {
    localStorage.removeItem(`${STORAGE_PREFIX}${username}`);
  },
};

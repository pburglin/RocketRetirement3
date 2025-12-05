import { encryptData, decryptData } from "../utils/crypto";

export interface UserProfile {
  username: string;
  createdAt: string;
  // Personal Details
  dob?: string;
  maritalStatus?: string;
  employmentStatus?: string;
  state?: string;
  dependents?: any[]; // Defined more strictly later

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
    const encrypted = encryptData(user, key);
    localStorage.setItem(`${STORAGE_PREFIX}${user.username}`, encrypted);
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
};

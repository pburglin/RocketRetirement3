import { encryptData, decryptData } from "../utils/crypto";

export interface Dependent {
  id: string;
  name: string;
  age: number;
}

export interface IncomeSource {
  id: string;
  name: string;
  amount: number; // Monthly
  category: "Pre-Retirement" | "Post-Retirement" | "Pre and Post-Retirement";
}

export interface Expense {
  id: string;
  name: string;
  amount: number; // Monthly
  retirementCategory: "Required" | "Nice-to-have";
}

export interface Asset {
  id: string;
  name: string;
  value: number;
  depreciationRate: number; // Annual %
}

export interface Liability {
  id: string;
  name: string;
  balance: number;
  monthlyPayment: number;
  interestRate: number; // Annual %
}

export interface InvestmentAccount {
  id: string;
  name: string;
  balance: number;
  accountType:
    | "Checking"
    | "Savings"
    | "Investment (tax advantaged)"
    | "Investment (non-tax advantaged)";
  riskProfile: "Low" | "Medium" | "High";
  estimatedReturn: number; // Annual %
  accountNumberLast4: string;
}

export interface UserProfile {
  username: string;
  createdAt: string;

  // Personal Details
  dob?: string;
  maritalStatus?: string;
  employmentStatus?: string;
  state?: string;
  dependents?: Dependent[];

  // Financial Modules
  incomeSources?: IncomeSource[];
  expenses?: Expense[];
  assets?: Asset[];
  liabilities?: Liability[];
  investmentAccounts?: InvestmentAccount[];

  // Settings
  theme?: "light" | "dark";
}

const STORAGE_PREFIX = "rocketfi_user_";

export const StorageService = {
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

  loadUser: (username: string, key: string): UserProfile | null => {
    const encrypted = localStorage.getItem(`${STORAGE_PREFIX}${username}`);
    if (!encrypted) return null;

    return decryptData<UserProfile>(encrypted, key);
  },

  userExists: (username: string): boolean => {
    return !!localStorage.getItem(`${STORAGE_PREFIX}${username}`);
  },

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

  deleteUser: (username: string): void => {
    localStorage.removeItem(`${STORAGE_PREFIX}${username}`);
  },
};

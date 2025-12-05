import React, { createContext, useContext, useState, ReactNode } from "react";
import { StorageService, UserProfile } from "../services/storage";

interface AuthContextType {
  user: UserProfile | null;
  encryptionKey: string | null;
  login: (username: string, key: string) => boolean;
  signup: (username: string, key: string) => boolean;
  logout: () => void;
  saveData: (updatedProfile: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);

  const login = (username: string, key: string): boolean => {
    const loadedUser = StorageService.loadUser(username, key);
    if (loadedUser) {
      setUser(loadedUser);
      setEncryptionKey(key);
      return true;
    }
    return false;
  };

  const signup = (username: string, key: string): boolean => {
    if (StorageService.userExists(username)) {
      return false;
    }
    const newUser: UserProfile = {
      username,
      createdAt: new Date().toISOString(),
      incomeSources: [],
      expenses: [],
      assets: [],
      liabilities: [],
      investmentAccounts: [],
    };
    StorageService.saveUser(newUser, key);
    setUser(newUser);
    setEncryptionKey(key);
    return true;
  };

  const logout = () => {
    setUser(null);
    setEncryptionKey(null);
  };

  const saveData = (updatedProfile: Partial<UserProfile>) => {
    if (user && encryptionKey) {
      const newUser = { ...user, ...updatedProfile };
      setUser(newUser);
      StorageService.saveUser(newUser, encryptionKey);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, encryptionKey, login, signup, logout, saveData }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

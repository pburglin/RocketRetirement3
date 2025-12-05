import { useState, useEffect, useCallback } from "react";

export function useFormPersistence<T>(
  key: string,
  initialValue: T,
  isEnabled: boolean = true,
) {
  // Initialize state from sessionStorage or default
  const [value, setValue] = useState<T>(() => {
    if (!isEnabled) return initialValue;
    try {
      const saved = sessionStorage.getItem(key);
      return saved ? { ...initialValue, ...JSON.parse(saved) } : initialValue;
    } catch (e) {
      console.warn("Failed to load form state", e);
      return initialValue;
    }
  });

  // Save to sessionStorage whenever value changes
  useEffect(() => {
    if (!isEnabled) return;
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("Failed to save form state", e);
    }
  }, [key, value, isEnabled]);

  // Clear storage (e.g. on successful submit)
  const clear = useCallback(() => {
    try {
      sessionStorage.removeItem(key);
      setValue(initialValue);
    } catch (e) {
      console.warn("Failed to clear form state", e);
    }
  }, [key, initialValue]);

  return [value, setValue, clear] as const;
}

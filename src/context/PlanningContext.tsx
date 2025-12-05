import React, { createContext, useContext, useState, ReactNode } from "react";

export interface PlanningAssumptions {
  retirementAge: number;
  lifeExpectancy: number;
  inflationRate: number;
  annualRetirementSpending: number;
}

interface PlanningContextType {
  assumptions: PlanningAssumptions;
  updateAssumption: <K extends keyof PlanningAssumptions>(
    key: K,
    value: PlanningAssumptions[K],
  ) => void;
  updateAssumptions: (newAssumptions: Partial<PlanningAssumptions>) => void;
}

const PlanningContext = createContext<PlanningContextType | undefined>(undefined);

// Default assumptions
const DEFAULT_ASSUMPTIONS: PlanningAssumptions = {
  retirementAge: 65,
  lifeExpectancy: 90,
  inflationRate: 3,
  annualRetirementSpending: 60000,
};

export const PlanningProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Load from sessionStorage if available
  const [assumptions, setAssumptions] = useState<PlanningAssumptions>(() => {
    try {
      const saved = sessionStorage.getItem("planning-assumptions");
      if (saved) {
        return { ...DEFAULT_ASSUMPTIONS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn("Failed to load planning assumptions", e);
    }
    return DEFAULT_ASSUMPTIONS;
  });

  const updateAssumption = <K extends keyof PlanningAssumptions>(
    key: K,
    value: PlanningAssumptions[K],
  ) => {
    const newAssumptions = { ...assumptions, [key]: value };
    setAssumptions(newAssumptions);
    
    // Save to sessionStorage
    try {
      sessionStorage.setItem("planning-assumptions", JSON.stringify(newAssumptions));
    } catch (e) {
      console.warn("Failed to save planning assumptions", e);
    }
  };

  const updateAssumptions = (newAssumptions: Partial<PlanningAssumptions>) => {
    const updatedAssumptions = { ...assumptions, ...newAssumptions };
    setAssumptions(updatedAssumptions);
    
    // Save to sessionStorage
    try {
      sessionStorage.setItem("planning-assumptions", JSON.stringify(updatedAssumptions));
    } catch (e) {
      console.warn("Failed to save planning assumptions", e);
    }
  };

  return (
    <PlanningContext.Provider value={{ assumptions, updateAssumption, updateAssumptions }}>
      {children}
    </PlanningContext.Provider>
  );
};

export const usePlanning = () => {
  const context = useContext(PlanningContext);
  if (context === undefined) {
    throw new Error("usePlanning must be used within a PlanningProvider");
  }
  return context;
};
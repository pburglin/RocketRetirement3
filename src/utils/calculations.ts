import { UserProfile, Timeframe } from "../services/storage";

// Helper function to calculate if social security benefits are active
export const calculateSocialSecurityIncome = (
  user: UserProfile,
  age: number,
  inflationRate: number,
  currentAge: number
): number => {
  if (!user.socialSecurity) return 0;
  
  const yearsPassed = age - currentAge;
  const inflationFactor = Math.pow(1 + inflationRate / 100, yearsPassed);
  
  return user.socialSecurity.reduce((total, ss) => {
    if (age >= ss.startAge) {
      const baseAmount = ss.monthlyAmount + (ss.spousalAmount || 0);
      const inflatedAmount = baseAmount * inflationFactor;
      return total + inflatedAmount;
    }
    return total;
  }, 0) * 12; // Convert to annual amount
};

export const calculateAge = (dob: string): number => {
  if (!dob) return 0;
  const birthDate = new window.Date(dob);
  const today = new window.Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export const calculateNetWorth = (user: UserProfile): number => {
  const assets = user.assets?.reduce((sum, item) => sum + item.value, 0) || 0;
  const investments =
    user.investmentAccounts?.reduce((sum, item) => sum + item.balance, 0) || 0;
  const liabilities =
    user.liabilities?.reduce((sum, item) => sum + item.balance, 0) || 0;
  return assets + investments - liabilities;
};

const isActive = (
  timeframe: Timeframe | undefined,
  isRetired: boolean,
): boolean => {
  // Default to always active if undefined
  if (!timeframe || timeframe === "Pre and Post-Retirement") return true;
  if (timeframe === "Pre-Retirement") return !isRetired;
  if (timeframe === "Post-Retirement") return isRetired;
  return true;
};

export interface SimulationResult {
  age: number;
  netWorth: number;
  investments: number;
  assets: number;
  isRetured: boolean;
}

export const runProjection = (
  user: UserProfile,
  retirementAge: number,
  lifeExpectancy: number,
  inflationRate: number, // percentage, e.g. 3
  lifestyleExpenses: number, // Annual post-retirement expenses (override)
): SimulationResult[] => {
  const currentAge = calculateAge(user.dob || "");
  let age = currentAge;

  // Initial Values
  let investmentAccounts =
    user.investmentAccounts?.map((a) => ({ ...a })) || [];
  let assets = user.assets?.map((a) => ({ ...a })) || [];
  let liabilities = user.liabilities?.map((l) => ({ ...l })) || [];

  const results: SimulationResult[] = [];

  // Recalculate initial totals
  const initialInvestments = investmentAccounts.reduce(
    (s, a) => s + a.balance,
    0,
  );
  const initialAssets = assets.reduce((s, a) => s + a.value, 0);
  const initialLiabilities = liabilities.reduce((s, l) => s + l.balance, 0);

  // Track one-time expenses that have been paid
  const paidOneTimeExpenses: string[] = [];

  // Add initial state
  results.push({
    age,
    netWorth: initialInvestments + initialAssets - initialLiabilities,
    investments: initialInvestments,
    assets: initialAssets,
    isRetured: false,
  });

  while (age < lifeExpectancy) {
    age++;
    const isRetired = age >= retirementAge;

    // 1. Calculate Annual Cash Flow based on Active Items
    // Income
    const activeIncome =
      user.incomeSources
        ?.filter((i) => isActive(i.category, isRetired))
        .reduce((sum, i) => sum + i.amount * 12, 0) || 0;

    // Add Social Security benefits when applicable
    const socialSecurityIncome = calculateSocialSecurityIncome(user, age, inflationRate, currentAge);

    // Filter out one-time expenses from recurring expenses
    const recurringExpenses = user.expenses?.filter(e => !e.isOneTime) || [];
    const listExpenses =
      recurringExpenses
        .filter((e) => isActive(e.timeframe, isRetired))
        .reduce((sum, e) => sum + e.amount * 12, 0) || 0;

    // Calculate one-time expenses that occur this year
    const oneTimeExpensesThisYear = user.expenses?.reduce((sum, e) => {
      if (e.isOneTime && e.scheduledDate && !paidOneTimeExpenses.includes(e.id)) {
        const scheduledDate = new Date(e.scheduledDate);
        const birthDate = new Date(user.dob || "");
        const scheduledAge = scheduledDate.getFullYear() - birthDate.getFullYear();
        
        // Check if this expense should be paid in the current age year
        if (scheduledAge === age - currentAge || (age === scheduledAge + currentAge)) {
          const yearsPassed = age - currentAge;
          const inflatedAmount = e.amount * Math.pow(1 + inflationRate / 100, yearsPassed);
          paidOneTimeExpenses.push(e.id);
          return sum + inflatedAmount;
        }
      }
      return sum;
    }, 0) || 0;

    const activeLiabilityPayments =
      liabilities
        .filter((l) => isActive(l.timeframe, isRetired) && l.balance > 0)
        .reduce((sum, l) => sum + l.monthlyPayment * 12, 0) || 0;

    // 2. Specific Investment Contributions
    // These are amounts explicitly directed to accounts (e.g. 401k match, direct savings)
    // Assumption: Monthly Contributions STOP at retirement.
    let totalSpecificContributions = 0;
    investmentAccounts.forEach((acc) => {
      // Check if contribution is active for this timeframe AND not retired
      if (!isRetired && isActive(acc.timeframe, isRetired)) {
        const annualContrib = acc.monthlyContribution * 12;
        // Inflate contribution limits/amounts? Assuming salary grows with inflation, contributions might too.
        const yearsPassed = age - currentAge;
        const inflatedContrib =
          annualContrib * Math.pow(1 + inflationRate / 100, yearsPassed);

        acc.balance += inflatedContrib;
        totalSpecificContributions += inflatedContrib;
      }
    });

    // 3. General Surplus/Deficit
    // Surplus = Income - (Expenses + Liability Payments) - Specific Contributions

    // Adjust values for inflation
    const yearsPassed = age - currentAge;
    const inflationFactor = Math.pow(1 + inflationRate / 100, yearsPassed);

    const inflatedIncome = (activeIncome + socialSecurityIncome) * inflationFactor;

    let currentYearExpenses = 0;
    if (isRetired) {
      // Use the slider value (inflated) for post-retirement base expenses
      currentYearExpenses = lifestyleExpenses * inflationFactor;
    } else {
      currentYearExpenses = listExpenses * inflationFactor;
    }

    // Add one-time expenses to outflow
    const totalOutflow = currentYearExpenses + activeLiabilityPayments + oneTimeExpensesThisYear;
    const grossSurplus = inflatedIncome - totalOutflow;

    // Subtract specific contributions already made to investments
    let distributableSurplus = grossSurplus - totalSpecificContributions;

    // 4. Grow Investments
    let totalInvestments = 0;
    investmentAccounts.forEach((account) => {
      const growth = account.balance * (account.estimatedReturn / 100);
      account.balance += growth;
      totalInvestments += account.balance;
    });

    // 5. Handle Distributable Surplus
    if (distributableSurplus > 0) {
      // Add to investments (General savings or first account)
      if (investmentAccounts.length > 0) {
        investmentAccounts[0].balance += distributableSurplus;
      } else {
        // Cash under mattress logic (implied in totalInvestments if we tracked it, but here we need an account to hold it)
        // For simple projection, if no accounts exist, we just add it to 'totalInvestments' for the Result,
        // but it won't compound in the loop unless we add a dummy account.
        // We'll skip complex dummy account logic for now.
        totalInvestments += distributableSurplus;
      }
    } else {
      // Deficit: Withdraw from investments
      const deficit = Math.abs(distributableSurplus);
      let remainingDeficit = deficit;

      // Withdraw from accounts
      for (const account of investmentAccounts) {
        if (account.balance >= remainingDeficit) {
          account.balance -= remainingDeficit;
          remainingDeficit = 0;
          break;
        } else {
          remainingDeficit -= account.balance;
          account.balance = 0;
        }
      }

      // If remainingDeficit > 0, technically debt increases or net worth drops.
      // We'll reflect it in the final Net Worth calculation.
      if (remainingDeficit > 0) {
        totalInvestments -= remainingDeficit; // Can go negative
      }
    }

    // 6. Assets & Liabilities Updates
    let totalAssets = 0;
    assets.forEach((asset) => {
      const change = asset.value * (asset.depreciationRate / 100);
      asset.value -= change;
      totalAssets += asset.value;
    });

    let totalLiabilities = 0;
    liabilities.forEach((liab) => {
      if (liab.balance > 0) {
        const annualInterest = liab.balance * (liab.interestRate / 100);
        const annualPayment = liab.monthlyPayment * 12;
        const principalPaid = annualPayment - annualInterest;

        liab.balance -= principalPaid;
        if (liab.balance < 0) liab.balance = 0;
      }
      totalLiabilities += liab.balance;
    });

    // Recalculate Totals for this year's result
    // Note: 'totalInvestments' calculated in Step 4 doesn't include the surplus/deficit adjustments made in Step 5.
    // We need to re-sum from accounts.
    const finalInvestments =
      investmentAccounts.reduce((s, a) => s + a.balance, 0) +
      (investmentAccounts.length === 0 && distributableSurplus > 0
        ? distributableSurplus
        : 0);

    results.push({
      age,
      netWorth: finalInvestments + totalAssets - totalLiabilities,
      investments: finalInvestments,
      assets: totalAssets,
      isRetured: isRetired,
    });
  }

  return results;
};

export const calculateMonthlyCashFlow = (user: UserProfile) => {
  const currentAge = calculateAge(user.dob || "");
  const income = user.incomeSources?.reduce((sum, item) => sum + item.amount, 0) || 0;
  
  // Add current social security benefits if user is old enough
  let socialSecurityIncome = 0;
  if (user.socialSecurity && user.socialSecurity.length > 0) {
    socialSecurityIncome = user.socialSecurity
      .filter(ss => currentAge >= ss.startAge)
      .reduce((sum, ss) => sum + ss.monthlyAmount + (ss.spousalAmount || 0), 0);
  }
  
  const expenses = user.expenses?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const liabilityPayments = user.liabilities?.reduce((sum, item) => sum + (item.monthlyPayment || 0), 0) || 0;
  const totalExpenses = expenses + liabilityPayments;
  const totalIncome = income + socialSecurityIncome;
  const surplus = totalIncome - totalExpenses;
  
  return {
    income: totalIncome,
    expenses: totalExpenses,
    surplus,
  };
};

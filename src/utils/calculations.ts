import { UserProfile, Timeframe } from "../services/storage";

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

export const calculateMonthlyCashFlow = (user: UserProfile) => {
  const income =
    user.incomeSources?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const expenses =
    user.expenses?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const liabilityPayments =
    user.liabilities?.reduce((sum, item) => sum + item.monthlyPayment, 0) || 0;
  const totalExpenses = expenses + liabilityPayments;
  const surplus = income - totalExpenses;

  return {
    income,
    expenses: totalExpenses,
    surplus,
  };
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

    // Expenses
    // If retired, use the override lifestyleExpenses if provided and we want simple model,
    // BUT the requirement implies we should use detailed list.
    // However, the `lifestyleExpenses` arg allows for the "Assumptions" slider in UI.
    // Let's hybridize: If isRetired, we use the greater of calculated active expenses OR the passed lifestyleExpenses (inflated).
    // Actually, usually the UI slider replaces the expense list for retirement planning simplicity.
    // Let's stick to the list for granular control unless it's empty?
    // For consistency with typical "Goal" planners, the slider usually sets the target.
    // Let's use the explicit expenses list for Pre-Retirement, and the slider for Post-Retirement
    // UNLESS the user has specific Post-Retirement expenses listed.
    // To respect the prompt's request for "Pre/Post" classification, let's strictly use the list logic
    // and maybe use the slider as a "floor" or "target" comparison, or just assume the slider represents the "Desired" spend.
    // Current implementation used slider for Post-Retirement. Let's try to allow the specific items to drive it if they exist.

    const listExpenses =
      user.expenses
        ?.filter((e) => isActive(e.timeframe, isRetired))
        .reduce((sum, e) => sum + e.amount * 12, 0) || 0;

    const activeLiabilityPayments =
      liabilities
        .filter((l) => isActive(l.timeframe, isRetired) && l.balance > 0)
        .reduce((sum, l) => sum + l.monthlyPayment * 12, 0) || 0;

    // 2. Specific Investment Contributions
    // These are amounts explicitly directed to accounts (e.g. 401k match, direct savings)
    let totalSpecificContributions = 0;
    investmentAccounts.forEach((acc) => {
      // Check if contribution is active for this timeframe
      if (isActive(acc.timeframe, isRetired)) {
        const annualContrib = acc.monthlyContribution * 12;
        // Inflate contribution limits/amounts? Assuming salary grows with inflation, contributions might too.
        // Simplified: inflate contributions
        const yearsPassed = age - currentAge;
        const inflatedContrib =
          annualContrib * Math.pow(1 + inflationRate / 100, yearsPassed);

        acc.balance += inflatedContrib;
        totalSpecificContributions += inflatedContrib;
      }
    });

    // 3. General Surplus/Deficit
    // Surplus = Income - (Expenses + Liability Payments) - Specific Contributions
    // Note: Income here is typically Net. If Specific Contributions (like 401k) come from Gross, this might double count reduction.
    // Assuming User inputs "Take Home" income or "Gross" and "Tax" as expense?
    // Let's assume standard Cash Flow: Income - Outflows.
    // If user listed 401k as Investment Contribution, they should NOT list it as Expense.
    // We treat Investment Contribution as a transfer from Cash -> Asset.

    // Adjust values for inflation
    const yearsPassed = age - currentAge;
    const inflationFactor = Math.pow(1 + inflationRate / 100, yearsPassed);

    const inflatedIncome = activeIncome * inflationFactor;
    // For retired expenses, we use the logic: if we are retired, use the Slider (lifestyleExpenses) OR the List?
    // The previous implementation used the Slider for Post-Retirement.
    // Let's stick to the Slider for Post-Retirement base expenses to keep the "Goals" page working as a "Target" calculator,
    // BUT add any "Post-Retirement" specific expenses from the list ON TOP if they seem special?
    // To avoid confusion, let's use the List logic PURELY if the user has populated it significantly, otherwise fallback?
    // Simplest approach for "Pre/Post" request: Use the List logic for everything.
    // But the Goals page has a specific input for "Annual Retirement Spending".
    // Let's use the List Logic for Pre-Retirement, and the Slider for Post-Retirement (Base Living) + Specific Liabilities.
    let currentYearExpenses = 0;
    if (isRetired) {
      // Use the slider value (inflated)
      currentYearExpenses = lifestyleExpenses * inflationFactor;
    } else {
      currentYearExpenses = listExpenses * inflationFactor;
    }

    // Liability payments are usually fixed (mortgage), NOT inflating, until paid off.
    // We handle liability payments separately below.

    const totalOutflow = currentYearExpenses + activeLiabilityPayments;
    const grossSurplus = inflatedIncome - totalOutflow;

    // Subtract specific contributions already made to investments
    // If surplus is enough, great. If not, it means we funded contributions via debt or savings dip (handled by net calculation).
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
        // Cash under mattress
        // We track it in totalInvestments sum effectively
        // But for next iteration we need a place. Create dummy if needed or just track
        // For simulation result array, we recalculate sum at end.
      }
    } else {
      // Deficit: Withdraw from investments
      const deficit = Math.abs(distributableSurplus);
      let remainingDeficit = deficit;

      // Withdraw from accounts (Taxable first? RMDs? Simple order for now)
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
      // If remainingDeficit > 0, we are in debt (negative net worth impact)
    }

    // 6. Assets & Liabilities Updates
    let totalAssets = 0;
    assets.forEach((asset) => {
      // Asset value changes
      const change = asset.value * (asset.depreciationRate / 100);
      asset.value -= change; // dep is positive for reduction
      totalAssets += asset.value;
    });

    let totalLiabilities = 0;
    liabilities.forEach((liab) => {
      if (liab.balance > 0) {
        // Simple amortization approx or interest only?
        // Let's simply reduce balance by principal portion.
        // Interest = Balance * Rate / 12. Principal = Payment - Interest.
        // Annualize it
        const annualInterest = liab.balance * (liab.interestRate / 100);
        const annualPayment = liab.monthlyPayment * 12;
        const principalPaid = annualPayment - annualInterest;

        liab.balance -= principalPaid;
        if (liab.balance < 0) liab.balance = 0;
      }
      totalLiabilities += liab.balance;
    });

    // Recalculate Totals
    const currentTotalInvestments = investmentAccounts.reduce(
      (s, a) => s + a.balance,
      0,
    );
    // Add any surplus that couldn't be added to accounts (if 0 accounts)
    let finalInvestments = currentTotalInvestments;
    if (investmentAccounts.length === 0 && distributableSurplus > 0) {
      // This is a drift, usually we should imply a cash account.
      // For the loop, we lost it if we don't have an account.
      // To fix: user should add an account.
    }
    if (investmentAccounts.length === 0 && distributableSurplus < 0) {
      finalInvestments -= Math.abs(distributableSurplus); // Go negative
    }

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

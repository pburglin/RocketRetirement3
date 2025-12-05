import { UserProfile } from "../services/storage";

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
  const monthlyIncome =
    user.incomeSources?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const monthlyExpenses =
    user.expenses?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const liabilityPayments =
    user.liabilities?.reduce((sum, item) => sum + item.monthlyPayment, 0) || 0;

  return {
    income: monthlyIncome,
    expenses: monthlyExpenses + liabilityPayments,
    surplus: monthlyIncome - (monthlyExpenses + liabilityPayments),
  };
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
  lifestyleExpenses: number, // Annual post-retirement expenses
): SimulationResult[] => {
  const currentAge = calculateAge(user.dob || "");
  let age = currentAge;
  // let currentYear = new window.Date().getFullYear();

  // Initial Values
  let investments =
    user.investmentAccounts?.reduce((sum, i) => sum + i.balance, 0) || 0;

  // Clone accounts to track separate growth
  let investmentAccounts =
    user.investmentAccounts?.map((a) => ({ ...a })) || [];
  let assets = user.assets?.map((a) => ({ ...a })) || [];
  let liabilities = user.liabilities?.map((l) => ({ ...l })) || [];

  const { surplus: currentMonthlySurplus } = calculateMonthlyCashFlow(user);
  let annualSurplus = currentMonthlySurplus * 12;

  const results: SimulationResult[] = [];

  // Add initial state
  results.push({
    age,
    netWorth: calculateNetWorth(user),
    investments,
    assets: assets.reduce((s, a) => s + a.value, 0),
    isRetured: false,
  });

  while (age < lifeExpectancy) {
    age++;
    // currentYear++;
    const isRetired = age >= retirementAge;

    // 1. Grow Investments
    let totalInvestmentGrowth = 0;
    investmentAccounts.forEach((account) => {
      const growth = account.balance * (account.estimatedReturn / 100);
      account.balance += growth;
      totalInvestmentGrowth += growth;
    });

    // 2. Depreciate/Appreciate Assets
    assets.forEach((asset) => {
      // deprecationRate is positive number in storage, so we subtract
      const change = asset.value * (asset.depreciationRate / 100);
      asset.value -= change;
    });

    // 3. Cash Flow Impact
    if (!isRetired) {
      // Pre-Retirement: Add surplus to investments (assume added to a general bucket or spread)
      // For simplicity, add to the first account or a "Cash" bucket if none exists
      if (investmentAccounts.length > 0) {
        // Distribute surplus proportionally or just dump in first? Let's dump in first for MVP math
        investmentAccounts[0].balance += annualSurplus;
      } else {
        // If no accounts, effectively cash under mattress (0% return)
        investments += annualSurplus;
      }

      // Inflate surplus for next year (Salary increases with inflation, Expenses too)
      annualSurplus *= 1 + inflationRate / 100;
    } else {
      // Post-Retirement: Withdraw Lifestyle Expenses
      // Adjust expenses for inflation from start date
      const yearsSinceStart = age - currentAge;
      const inflatedExpenses =
        lifestyleExpenses * Math.pow(1 + inflationRate / 100, yearsSinceStart);

      // Deduct from investments
      let amountNeeded = inflatedExpenses;

      // First, use any post-retirement income (Social Security, etc)
      const postRetirementIncome =
        user.incomeSources
          ?.filter((i) => i.category.includes("Post-Retirement"))
          .reduce((sum, i) => sum + i.amount * 12, 0) || 0;

      // Inflate that income too? Usually SS has COLA. Let's assume yes.
      const inflatedIncome =
        postRetirementIncome *
        Math.pow(1 + inflationRate / 100, yearsSinceStart);

      amountNeeded -= inflatedIncome;

      if (amountNeeded > 0) {
        // Withdraw from investments
        // Simple logic: take from first available
        for (const account of investmentAccounts) {
          if (account.balance >= amountNeeded) {
            account.balance -= amountNeeded;
            amountNeeded = 0;
            break;
          } else {
            amountNeeded -= account.balance;
            account.balance = 0;
          }
        }
      } else {
        // Surplus in retirement? Add to investments
        if (investmentAccounts.length > 0) {
          investmentAccounts[0].balance += Math.abs(amountNeeded);
        }
      }
    }

    // Recalculate totals
    const totalInvestments = investmentAccounts.reduce(
      (s, a) => s + a.balance,
      0,
    );
    const totalAssets = assets.reduce((s, a) => s + a.value, 0);
    // Liabilities usually amortize, for MVP assume constant principal for now or simple subtraction
    // Better: We are not calculating detailed amortization schedules here yet to keep it light.
    const totalLiabilities =
      liabilities.reduce((s, l) => s + l.balance, 0) || 0;

    results.push({
      age,
      netWorth: totalInvestments + totalAssets - totalLiabilities,
      investments: totalInvestments,
      assets: totalAssets,
      isRetured: isRetired,
    });
  }

  return results;
};

import { UserProfile } from "../services/storage";

const OPENROUTER_API_KEY = (import.meta as any).env.VITE_OPENROUTER_API_KEY;
const SITE_URL = window.location.origin;
const SITE_NAME = "Rocket Fi";

export interface LLMResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  created: number;
}

export const fetchLLMAnalysis = async (
  user: UserProfile,
  model: string,
  userPromptAddendum: string = "",
): Promise<LLMResponse> => {
  if (!OPENROUTER_API_KEY) {
    throw new Error("API Key is missing. Please check your .env file.");
  }

  const systemPrompt = `You are an expert financial retirement planner AI. 
  Your goal is to analyze the user's financial snapshot and provide actionable, personalized strategies.
  
  The 3-bucket method for retirement balances liquidity, stability, and growth:
  Bucket 1 (Cash Reserve): Holds 1–2 years of expenses in liquid assets for immediate needs.
  Bucket 2 (Low-Risk Investments): Includes bonds, CDs, and treasuries for mid-term stability.
  Bucket 3 (Growth Investments): Focuses on stocks and ETFs to build long-term wealth.
  Rebalancing strategy: Sell from Bucket 3 in bull markets, moving profits to Bucket 2 for safety and Bucket 1 for liquidity as needed. This preserves gains and ensures financial security throughout retirement.
  
  Disclaimer: You are an AI, not a certified financial advisor. Always advise the user to consult a professional.
  `;

  // Construct a safe, anonymized context
  const financialContext = {
    age: calculateAge(user.dob || ""),
    maritalStatus: user.maritalStatus,
    state: user.state,
    dependentsCount: user.dependents?.length || 0,
    dependentsAges: user.dependents?.map((d) => d.age).join(", "),
    income: user.incomeSources,
    expenses: user.expenses,
    assets: user.assets,
    liabilities: user.liabilities,
    investments: user.investmentAccounts,
    totalNetWorth: calculateNetWorth(user), // Helper needed or re-calc here
    date: new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };

  const userMessage = `
  Here is my financial snapshot:
  ${JSON.stringify(financialContext, null, 2)}
  
  ${userPromptAddendum}
  
  Please provide a detailed retirement analysis, including:
  1. Assessment of current health based on the 3-bucket strategy.
  2. Specific recommendations to optimize tax efficiency (considering my location in ${user.state || "US"}).
  3. Risk analysis of my current portfolio.
  `;

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    },
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Failed to fetch AI response");
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    usage: data.usage,
    model: model,
    created: Date.now(),
  };
};

// Helper duplication to avoid circular deps if needed, or import from utils
const calculateAge = (dob: string): number => {
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

const calculateNetWorth = (user: UserProfile): number => {
  const assets = user.assets?.reduce((sum, item) => sum + item.value, 0) || 0;
  const investments =
    user.investmentAccounts?.reduce((sum, item) => sum + item.balance, 0) || 0;
  const liabilities =
    user.liabilities?.reduce((sum, item) => sum + item.balance, 0) || 0;
  return assets + investments - liabilities;
};

import { UserProfile } from "../services/storage";
import { calculateAge, calculateNetWorth } from "../utils/calculations";
import { PlanningAssumptions } from "../context/PlanningContext";

const OPENROUTER_API_KEY = (import.meta as any).env.VITE_OPENROUTER_API_KEY;
const SITE_URL = window.location.origin;
const SITE_NAME = "Rocket Fi";

// AI Prompt Configuration from environment variables
const SYSTEM_PROMPT = (import.meta as any).env.VITE_AI_SYSTEM_PROMPT || `You are an expert financial retirement planner AI for Rocket Fi.
Your goal is to analyze the user's financial snapshot and provide actionable, personalized strategies.

Methodologies to apply:

1. 3-Bucket Strategy:
      - Bucket 1 (Liquidity): 1-2 years of expenses (Cash/Savings).
      - Bucket 2 (Stability): 3-7 years (Bonds, Fixed Income).
      - Bucket 3 (Growth): 7+ years (Stocks, ETFs).
2. Tax Efficiency: Optimize asset location (Tax-Advantaged vs Taxable).
3. Risk Management: Assess if asset allocation matches the user's life stage.

Disclaimer: You are an AI, not a certified financial advisor. Provide educational insights, not binding financial advice.`;

const BENEFICIARY_PROMPT = (import.meta as any).env.VITE_AI_BENEFICIARY_PROMPT || `You are an expert estate planning advisor focused on beneficiary designations and account ownership.
Your goal is to help users identify potential gaps in their estate planning related to beneficiaries, titles, and account designations.

Focus Areas:
1. Account Beneficiaries: 401(k), IRA, life insurance, bank accounts
2. Property Titles: Real estate, vehicles, business ownership
3. Legal Documents: Wills, trusts, power of attorney
4. Tax Implications: Minimizing estate taxes and probate costs

Provide actionable recommendations for improving beneficiary clarity and estate planning efficiency.

Disclaimer: You are an AI, not a certified estate planning attorney. Provide educational insights, not legal advice.`;

const CHAT_PROMPT = (import.meta as any).env.VITE_AI_CHAT_PROMPT || `You are a knowledgeable financial planning assistant for Rocket Fi users.
Your goal is to provide helpful, educational financial guidance based on the user's current financial context.

Approach:
- Ask clarifying questions when information is needed
- Provide educational explanations of financial concepts
- Suggest specific areas to explore further
- Maintain focus on retirement and financial independence planning
- Reference the user's actual financial data when relevant

Disclaimer: You are an AI, not a certified financial advisor. Provide educational insights, not binding financial advice.`;

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

export const fetchAvailableModels = async (): Promise<string[]> => {
  if (!OPENROUTER_API_KEY) {
    console.warn("No API key available, falling back to default models");
    return FREE_MODELS;
  }

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/models",
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": SITE_URL,
          "X-Title": SITE_NAME,
        },
      },
    );

    if (!response.ok) {
      console.warn("Failed to fetch models, falling back to defaults");
      return FREE_MODELS;
    }

    const data = await response.json();
    
    // Filter for free models only
    const freeModels = data.data
      ?.filter((model: any) => 
        model.id.includes(":free") || 
        model.pricing?.prompt === "0" ||
        model.pricing?.completion === "0"
      )
      ?.map((model: any) => model.id)
      ?.filter((id: string) => id) || [];

    // Fallback to default models if no free models found
    return freeModels.length > 0 ? freeModels : FREE_MODELS;
  } catch (error) {
    console.error("Error fetching models:", error);
    return FREE_MODELS;
  }
};

export const FREE_MODELS = [
  "google/gemma-3-27b-it:free",
  "google/gemma-2-9b-it:free",
  "mistralai/mistral-7b-instruct:free",
  "meta-llama/llama-3-8b-instruct:free",
  "microsoft/phi-3-medium-128k-instruct:free",
];

// Helper to summarize list data to save tokens
const summarizeList = (
  items: any[] | undefined,
  valueKey: string,
  nameKey: string,
  limit: number = 10,
) => {
  if (!items || items.length === 0) return [];
  const sorted = [...items].sort((a, b) => b[valueKey] - a[valueKey]);
  const topItems = sorted.slice(0, limit);
  const remaining = sorted.slice(limit);

  const result = topItems.map((item) => ({
    name: item[nameKey],
    value: item[valueKey],
    ...(item.category ? { category: item.category } : {}),
    ...(item.type ? { type: item.type } : {}),
  }));

  if (remaining.length > 0) {
    const remainingValue = remaining.reduce(
      (sum, item) => sum + item[valueKey],
      0,
    );
    result.push({
      name: `Other (${remaining.length} items)`,
      value: remainingValue,
    });
  }
  return result;
};

export const constructPrompt = (
  user: UserProfile, 
  promptType: 'report' | 'beneficiary' | 'chat' = 'report',
  planningAssumptions?: PlanningAssumptions
) => {
  const age = calculateAge(user.dob || "");
  const netWorth = calculateNetWorth(user);

  // Select system prompt based on type
  const systemPrompt = promptType === 'beneficiary' ? BENEFICIARY_PROMPT :
                     promptType === 'chat' ? CHAT_PROMPT : SYSTEM_PROMPT;

  // Construct context
  const financialContext = {
    profile: {
      age,
      maritalStatus: user.maritalStatus,
      employment: user.employmentStatus,
      state: user.state,
      dependents: user.dependents?.map((d) => ({ age: d.age })),
    },
    planningAssumptions: planningAssumptions ? {
      targetRetirementAge: planningAssumptions.retirementAge,
      lifeExpectancy: planningAssumptions.lifeExpectancy,
      expectedInflationRate: planningAssumptions.inflationRate,
      annualRetirementSpending: planningAssumptions.annualRetirementSpending,
    } : undefined,
    summary: {
      netWorth,
      totalAssets: user.assets?.reduce((s, a) => s + a.value, 0) || 0,
      totalLiabilities:
        user.liabilities?.reduce((s, l) => s + l.balance, 0) || 0,
      totalInvestments:
        user.investmentAccounts?.reduce((s, i) => s + i.balance, 0) || 0,
    },
    details: {
      income: summarizeList(user.incomeSources, "amount", "name"),
      expenses: summarizeList(user.expenses, "amount", "name"),
      assets: summarizeList(user.assets, "value", "name"),
      liabilities: summarizeList(user.liabilities, "balance", "name"),
      investments: summarizeList(user.investmentAccounts, "balance", "name"),
    },
    date: new Date().toISOString().split("T")[0],
  };

  // Generate different user messages based on prompt type
  let userMessage = '';
  
  if (promptType === 'beneficiary') {
    userMessage = `Here is my financial data JSON: \`\`\`json
${JSON.stringify(financialContext, null, 2)}
\`\`\`

Please provide a **Beneficiary Audit Report** with the following sections (use proper Markdown formatting):

## 1. Account Beneficiary Review
- **Retirement Accounts**: 401(k), IRA, 403(b) beneficiary designations
- **Life Insurance Policies**: Current beneficiary designations
- **Bank Accounts**: Payable on Death (POD) or Transfer on Death (TOD) designations
- **Investment Accounts**: Brokerage and other accounts with beneficiary options

## 2. Property Title Analysis
- **Real Estate**: How properties are titled (joint tenancy, tenancy in common, etc.)
- **Vehicles**: Registration and title information
- **Business Interests**: Ownership structure and succession planning
- **Digital Assets**: Access and inheritance considerations

## 3. Legal Document Review
- **Will Status**: Current will and its beneficiary provisions
- **Trust Documents**: Any existing trusts and their beneficiary terms
- **Power of Attorney**: Financial and healthcare POA designations
- **Healthcare Directives**: Advanced directives and medical POA

## 4. Tax Optimization Opportunities
- **Estate Tax Planning**: Strategies to minimize estate taxes
- **Probate Avoidance**: Methods to reduce probate costs and time
- **Charitable Giving**: Tax-efficient charitable beneficiary strategies
- **State-Specific Issues**: ${user.state || "Unknown"} estate planning considerations

## 5. Action Items & Recommendations
- **Immediate Actions**: Items to address within 30 days
- **Follow-up Tasks**: Actions to complete within 3-6 months
- **Long-term Planning**: Estate planning review schedule

**Formatting Requirements**:
- Use **bold text** for section headers and important terms
- Use *italic text* for emphasis and legal terms
- Create **checklists** (- [ ]) for actionable items
- Use **bullet points** for recommendations
- Include appropriate spacing between sections

**Tone**: Professional, thorough, and educational. Focus on practical next steps.`;
  } else if (promptType === 'chat') {
    userMessage = `Here is my financial data JSON: \`\`\`json
${JSON.stringify(financialContext, null, 2)}
\`\`\`

Please help me with my financial planning questions. Feel free to:
- Ask follow-up questions about my situation
- Explain financial concepts in simple terms
- Suggest specific areas I should focus on
- Provide educational insights about retirement planning
- Reference my actual financial data when giving advice

What would you like to know about my financial situation?`;
  } else {
    // Default report prompt
    userMessage = `Here is my financial data JSON: \`\`\`json
${JSON.stringify(financialContext, null, 2)}
\`\`\`

Please provide a **professional financial analysis report** with the following sections (use proper Markdown formatting):

## 1. Executive Summary
- **Overall Financial Health**: Health check based on Net Worth and Age
- **Key Metrics Summary**: Present in a table format
- **Primary Concerns**: 2-3 bullet points

## 2. 3-Bucket Strategy Analysis
- **Current Allocation**: Table showing current vs recommended distribution
- **Gap Analysis**: Where improvements are needed
- **Specific Recommendations**: Bullet-pointed actionable advice

## 3. Tax Optimization & Location Strategy
- **State-Specific Considerations**: Based on ${user.state || "Unknown"} tax implications
- **Account Type Analysis**: Tax-advantaged vs taxable account optimization
- **Strategic Recommendations**: Numbered action items

## 4. Risk Assessment & Portfolio Health
- **Risk Tolerance Analysis**: Age-appropriate risk level assessment
- **Diversification Review**: Current diversification vs recommendations
- **Risk Factors**: Bullet points of potential concerns

## 5. Strategic Action Plan
- **Immediate Actions** (Next 30 days): 3 prioritized items
- **Short-term Goals** (3-6 months): 3 strategic initiatives
- **Long-term Planning** (6+ months): 3 roadmap items

**Formatting Requirements**:
- Use **bold text** for section headers and important terms
- Use *italic text* for emphasis and financial terms
- Create **tables** for numerical data and comparisons
- Use **bullet points** (- or •) for lists and recommendations
- Use **numbered lists** (1. 2. 3.) for step-by-step actions
- Include appropriate spacing between sections
- Use "$X,XXX" format for all monetary values
- Include percentage changes and ratios where relevant

**Tone**: Professional, consultative, and actionable. Focus on specific, measurable recommendations.`;
  }

  return { systemPrompt, userMessage };
};

export const fetchLLMAnalysis = async (
  user: UserProfile,
  model: string,
  promptType: 'report' | 'beneficiary' | 'chat' = 'report',
  customMessage?: string,
  planningAssumptions?: PlanningAssumptions,
): Promise<LLMResponse> => {
  if (!OPENROUTER_API_KEY) {
    throw new Error("API Key is missing. Please check your .env file.");
  }

  // Debug: Log the API key format (without exposing the full key)
  console.log("API Key Debug Info:", {
    exists: !!OPENROUTER_API_KEY,
    startsWithSkOrV1: OPENROUTER_API_KEY?.startsWith("sk-or-v1-"),
    length: OPENROUTER_API_KEY?.length,
    firstChars: OPENROUTER_API_KEY?.substring(0, 12) + "...",
    model: model,
    promptType: promptType,
  });

  const { systemPrompt, userMessage } = constructPrompt(user, promptType, planningAssumptions);
  
  // For chat mode, append the user's question to the financial context
  let finalUserMessage = userMessage;
  if (promptType === 'chat' && customMessage) {
    finalUserMessage = `${userMessage}\n\n---\n\n**User Question**: ${customMessage}\n\nPlease provide personalized advice based on the financial context above.`;
  }

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
          { role: "user", content: finalUserMessage },
        ],
      }),
    },
  );

  console.log(
    "OpenRouter Response Status:",
    response.status,
    response.statusText,
  );

  if (!response.ok) {
    const err = await response.json();
    console.error("OpenRouter API Error Details:", {
      status: response.status,
      statusText: response.statusText,
      error: err,
      headers: Object.fromEntries(response.headers.entries()),
    });
    throw new Error(
      err.error?.message ||
        `Failed to fetch AI response: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    usage: data.usage,
    model: model,
    created: Date.now(),
  };
};

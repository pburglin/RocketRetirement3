
import { UserProfile } from "../services/storage";
import { calculateAge, calculateNetWorth } from "../utils/calculations";

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

export const constructPrompt = (user: UserProfile) => {
const age = calculateAge(user.dob || "");
const netWorth = calculateNetWorth(user);

const systemPrompt = \`You are an expert financial retirement planner AI for Rocket Fi.
Your goal is to analyze the user's financial snapshot and provide actionable, personalized strategies.

Methodologies to apply:

1.  3-Bucket Strategy:
      - Bucket 1 (Liquidity): 1-2 years of expenses (Cash/Savings).
      - Bucket 2 (Stability): 3-7 years (Bonds, Fixed Income).
      - Bucket 3 (Growth): 7+ years (Stocks, ETFs).
2.  Tax Efficiency: Optimize asset location (Tax-Advantaged vs Taxable).
3.  Risk Management: Assess if asset allocation matches the user's life stage.

Disclaimer: You are an AI, not a certified financial advisor. Provide educational insights, not binding financial advice.\`;

// Construct context
const financialContext = {
profile: {
age,
maritalStatus: user.maritalStatus,
employment: user.employmentStatus,
state: user.state,
dependents: user.dependents?.map((d) => ({ age: d.age })),
},
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

const userMessage = `Here is my financial data JSON: \`\`\`json
${JSON.stringify(financialContext, null, 2)}
\`\`\`

Please provide a Report with the following sections (use Markdown headers):

1.  **Executive Summary**: Health check based on Net Worth and Age.
2.  **3-Bucket Analysis**: How well my current investments fit the liquidity/stability/growth model.
3.  **Tax & Location Optimization**: Specific advice based on my state (${user.state || "Unknown"}) and account types.
4.  **Risk Assessment**: Analysis of portfolio risk vs timeline.
5.  **Action Plan**: 3 bullet points of high-impact moves I should consider.\`;

return { systemPrompt, userMessage };
};

export const fetchLLMAnalysis = async (
user: UserProfile,
model: string,
): Promise<LLMResponse> => {
if (!OPENROUTER_API_KEY) {
throw new Error("API Key is missing. Please check your .env file.");
}

const { systemPrompt, userMessage } = constructPrompt(user);

const response = await fetch(
"[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)",
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


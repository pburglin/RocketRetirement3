
import React, { useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { ModulePageLayout } from "../components/ModulePageLayout";
import { InvestmentAccount, Timeframe } from "../services/storage";
import { useFormPersistence } from "../hooks/useFormPersistence";
import { ModuleStats } from "../components/ModuleStats";

const INVESTMENT_SUGGESTIONS: Partial<InvestmentAccount>[] = [
{
name: "Employer 401(k)",
balance: 150000,
monthlyContribution: 1500,
accountType: "Investment (tax advantaged)",
riskProfile: "High",
estimatedReturn: 8,
accountNumberLast4: "1234",
timeframe: "Pre and Post-Retirement",
},
{
name: "Roth IRA",
balance: 50000,
monthlyContribution: 500,
accountType: "Investment (tax advantaged)",
riskProfile: "High",
estimatedReturn: 8,
timeframe: "Pre and Post-Retirement",
},
{
name: "Brokerage Account",
balance: 50000,
monthlyContribution: 200,
accountType: "Investment (non-tax advantaged)",
riskProfile: "Medium",
estimatedReturn: 7,
timeframe: "Pre and Post-Retirement",
},
{
name: "High Yield Savings",
balance: 20000,
monthlyContribution: 100,
accountType: "Savings",
riskProfile: "Low",
estimatedReturn: 4,
timeframe: "Pre and Post-Retirement",
},
{
name: "Checking Account",
balance: 5000,
monthlyContribution: 0,
accountType: "Checking",
riskProfile: "Low",
estimatedReturn: 0,
timeframe: "Pre and Post-Retirement",
},
{
name: "HSA",
balance: 8000,
monthlyContribution: 300,
accountType: "Investment (tax advantaged)",
riskProfile: "Medium",
estimatedReturn: 6,
timeframe: "Pre and Post-Retirement",
},
{
name: "529 College Plan",
balance: 25000,
monthlyContribution: 200,
accountType: "Investment (tax advantaged)",
riskProfile: "Medium",
estimatedReturn: 7,
timeframe: "Pre-Retirement",
},
];

export const InvestmentsPage: React.FC = () => {
const { user, saveData } = useAuth();
const items = user?.investmentAccounts || [];

const handleAdd = (item: Omit<InvestmentAccount, "id">) => {
saveData({
investmentAccounts: [...items, { ...item, id: Date.now().toString() }],
});
};

const handleEdit = (updatedItem: InvestmentAccount) => {
saveData({
investmentAccounts: items.map((i) =>
i.id === updatedItem.id ? updatedItem : i,
),
});
};

const handleDelete = (id: string) => {
saveData({ investmentAccounts: items.filter((i) => i.id !== id) });
};

const chartData = useMemo(() => {
const grouped = items.reduce(
(acc, item) => {
const key = item.accountType;
acc[key] = (acc[key] || 0) + item.balance;
return acc;
},
{} as Record<string, number>,
);
return Object.entries(grouped).map(([name, value]) => ({ name, value }));
}, [items]);

return (
<ModulePageLayout<InvestmentAccount>
title="Investment Accounts"
singularTitle="Investment Account"
items={items}
suggestions={INVESTMENT_SUGGESTIONS}
stats={
<ModuleStats
data={chartData}
type="pie"
dataKey="value"
nameKey="name"
title="Allocation by Account Type"
totalLabel="Total Portfolio"
/>
}
onAdd={handleAdd}
onEdit={handleEdit}
onDelete={handleDelete}
sortFunction={(a, b) => b.balance - a.balance}
filterFunction={(item, term) =>
item.name.toLowerCase().includes(term.toLowerCase())
}
renderItem={(item) => (
<div>
<div className="flex items-center gap-2">
<h3 className="font-semibold text-gray-900">{item.name}</h3>
{item.accountNumberLast4 && (
<span className="text-xs text-gray-400 bg-gray-50 px-2 rounded border">
...{item.accountNumberLast4}
</span>
)}
</div>
<div className="text-sm text-gray-500 flex flex-wrap gap-3 mt-1">
<span className="font-medium text-blue-600">
${item.balance.toLocaleString()}
</span>
<span className="text-green-600">
+${item.monthlyContribution?.toLocaleString() || 0}/mo
</span>
<span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 text-xs">
{item.accountType}
</span>
<span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 text-xs">
Risk: {item.riskProfile}
</span>
<span className="px-2 py-0.5 rounded-full bg-green-50 text-green-800 text-xs">
Est. Return: {item.estimatedReturn}%
</span>
<span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs">
{item.timeframe}
</span>
{item.details && (
<span className="text-xs text-gray-400 truncate max-w-[150px]">
{item.details}
</span>
)}
</div>
</div>
)}
renderForm={(onSubmit, initialData, onCancel) => (
<InvestmentForm
onSubmit={onSubmit}
initialData={initialData as InvestmentAccount}
onCancel={onCancel}
/>
)}
/>
);
};

const InvestmentForm: React.FC<{
onSubmit: (data: any) => void;
initialData?: Partial<InvestmentAccount>;
onCancel?: () => void;
}> = ({ onSubmit, initialData, onCancel }) => {
const isEditMode = !!initialData?.id;
const initialFormState = {
name: "",
balance: "",
monthlyContribution: "0",
accountType: "Investment (tax advantaged)" as InvestmentAccount["accountType"],
riskProfile: "Medium" as InvestmentAccount["riskProfile"],
estimatedReturn: "7",
accountNumberLast4: "",
timeframe: "Pre and Post-Retirement" as Timeframe,
details: "",
};

const [formData, setFormData, clearFormData] = useFormPersistence(
`investment_form_draft`,
initialFormState,
!isEditMode,
);

useEffect(() => {
if (initialData) {
setFormData({
name: initialData.name || "",
balance: initialData.balance?.toString() || "",
monthlyContribution:
initialData.monthlyContribution?.toString() || "0",
accountType:
initialData.accountType || "Investment (tax advantaged)",
riskProfile: initialData.riskProfile || "Medium",
estimatedReturn: initialData.estimatedReturn?.toString() || "7",
accountNumberLast4: initialData.accountNumberLast4 || "",
timeframe: initialData.timeframe || "Pre and Post-Retirement",
details: initialData.details || "",
});
}
}, [initialData, setFormData]);

const handleSubmit = (e: React.FormEvent) => {
e.preventDefault();
onSubmit({
name: formData.name,
balance: parseFloat(formData.balance) || 0,
monthlyContribution: parseFloat(formData.monthlyContribution) || 0,
accountType: formData.accountType,
riskProfile: formData.riskProfile,
estimatedReturn: parseFloat(formData.estimatedReturn) || 0,
accountNumberLast4: formData.accountNumberLast4,
timeframe: formData.timeframe,
details: formData.details,
});
if (!isEditMode) clearFormData();
};

return (
<form onSubmit={handleSubmit} className="space-y-4">
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div>
<label className="block text-sm font-medium text-gray-700">
Account Name / Provider
</label>
<input
type="text"
required
value={formData.name}
onChange={(e) => setFormData({ ...formData, name: e.target.value })}
className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
/>
</div>
<div>
<label className="block text-sm font-medium text-gray-700">
Account Number (last 4)
</label>
<input
type="text"
maxLength={4}
value={formData.accountNumberLast4}
onChange={(e) =>
setFormData({
...formData,
accountNumberLast4: e.target.value.replace(/\\D/g, ""),
})
}
className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
placeholder="XXXX"
/>
</div>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div>
<label className="block text-sm font-medium text-gray-700">
Balance
</label>
<div className="relative mt-1 rounded-md shadow-sm">
<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
<span className="text-gray-500 sm:text-sm">$</span>

</div>
<input
type="number"
required
min="0"
value={formData.balance}
onChange={(e) =>
setFormData({ ...formData, balance: e.target.value })
}
className="block w-full rounded-md border-gray-300 pl-7 focus:border-blue-500 focus:ring-blue-500 border p-2"
/>
</div>
</div>
<div>
<label className="block text-sm font-medium text-gray-700">
Monthly Contribution *
</label>
<div className="relative mt-1 rounded-md shadow-sm">
<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
<span className="text-gray-500 sm:text-sm">$&lt;/span&gt;
&lt;/div&gt;
<input
type="number"
required
min="0"
value={formData.monthlyContribution}
onChange={(e) =>
setFormData({
...formData,
monthlyContribution: e.target.value,
})
}
className="block w-full rounded-md border-gray-300 pl-7 focus:border-blue-500 focus:ring-blue-500 border p-2"
/>
&lt;/div&gt;
&lt;p className=&quot;mt-1 text-xs text-gray-500&quot;&gt;
* Contributions assumed to stop at retirement age.
&lt;/p&gt;
&lt;/div&gt;
&lt;/div&gt;
&lt;div className=&quot;grid grid-cols-1 md:grid-cols-2 gap-4&quot;&gt;
&lt;div&gt;
&lt;label className=&quot;block text-sm font-medium text-gray-700&quot;&gt;
Account Type
&lt;/label&gt;
<select
value={formData.accountType}
onChange={(e) =>
setFormData({ ...formData, accountType: e.target.value as any })
}
className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 bg-white"
>
&lt;option value=&quot;Checking&quot;&gt;Checking&lt;/option&gt;
&lt;option value=&quot;Savings&quot;&gt;Savings&lt;/option&gt;
&lt;option value=&quot;Investment (tax advantaged)&quot;&gt;
Investment (tax advantaged)
&lt;/option&gt;
&lt;option value=&quot;Investment (non-tax advantaged)&quot;&gt;
Investment (non-tax advantaged)
&lt;/option&gt;
&lt;/select&gt;
&lt;/div&gt;
&lt;div&gt;
&lt;label className=&quot;block text-sm font-medium text-gray-700&quot;&gt;
Risk Profile
&lt;/label&gt;
<select
value={formData.riskProfile}
onChange={(e) =>
setFormData({ ...formData, riskProfile: e.target.value as any })
}
className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 bg-white"
>
&lt;option value=&quot;Low&quot;&gt;Low&lt;/option&gt;
&lt;option value=&quot;Medium&quot;&gt;Medium&lt;/option&gt;
&lt;option value=&quot;High&quot;&gt;High&lt;/option&gt;
&lt;/select&gt;
&lt;p className=&quot;mt-1 text-xs text-gray-500 leading-relaxed&quot;&gt;
Use &lt;strong&gt;Low&lt;/strong&gt; for Checking, Savings, CDs etc;{" "}
&lt;strong&gt;Medium&lt;/strong&gt; for S\&P 500 ETF and mutual funds;{" "}
&lt;strong&gt;High&lt;/strong&gt; for riskier leveraged investment instruments
like TQQQ
&lt;/p&gt;
&lt;/div&gt;
&lt;/div&gt;
&lt;div className=&quot;grid grid-cols-1 md:grid-cols-2 gap-4&quot;&gt;
&lt;div&gt;
&lt;label className=&quot;block text-sm font-medium text-gray-700&quot;&gt;
Estimated Annual Interest %
&lt;/label&gt;
<input
type="number"
required
step="0.1"
value={formData.estimatedReturn}
onChange={(e) =>
setFormData({ ...formData, estimatedReturn: e.target.value })
}
className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
/>
&lt;/div&gt;
&lt;div&gt;
&lt;label className=&quot;block text-sm font-medium text-gray-700&quot;&gt;
Timeframe
&lt;/label&gt;
<select
value={formData.timeframe}
onChange={(e) =>
setFormData({ ...formData, timeframe: e.target.value as any })
}
className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 bg-white"
>
&lt;option value=&quot;Pre and Post-Retirement&quot;&gt;
Pre and Post-Retirement
&lt;/option&gt;
&lt;option value=&quot;Pre-Retirement&quot;&gt;Pre-Retirement&lt;/option&gt;
&lt;option value=&quot;Post-Retirement&quot;&gt;Post-Retirement&lt;/option&gt;
&lt;/select&gt;
&lt;/div&gt;
&lt;/div&gt;
&lt;div&gt;
&lt;label className=&quot;block text-sm font-medium text-gray-700&quot;&gt;
Details (Optional)
&lt;/label&gt;
<textarea
rows={3}
value={formData.details}
onChange={(e) =>
setFormData({ ...formData, details: e.target.value })
}
className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
placeholder="Additional notes..."
/>
&lt;/div&gt;
&lt;div className=&quot;flex justify-end gap-2 pt-2&quot;&gt;
{onCancel && (
&lt;button
type=&quot;button&quot;
onClick={onCancel}
className=&quot;px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50&quot;
&gt;
Cancel
&lt;/button&gt;
)}
&lt;button
type=&quot;submit&quot;
className=&quot;px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700&quot;
&gt;
Save
&lt;/button&gt;
&lt;/div&gt;
&lt;/form&gt;
);
};


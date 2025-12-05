
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
              +${item.monthlyContribution?.toLocaleString() || 0}/mo*
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
                accountNumberLast4: e.target.value.replace(/\D/g, ""),
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
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
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
          </div>
          <p className="mt-1 text-xs text-gray-500">
            * Contributions assumed to stop at retirement age.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Account Type
          </label>
          <select
            value={formData.accountType}
            onChange={(e) =>
              setFormData({ ...formData, accountType: e.target.value as any })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 bg-white"
          >
            <option value="Checking">Checking</option>
            <option value="Savings">Savings</option>
            <option value="Investment (tax advantaged)">
              Investment (tax advantaged)
            </option>
            <option value="Investment (non-tax advantaged)">
              Investment (non-tax advantaged)
            </option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Risk Profile
          </label>
          <select
            value={formData.riskProfile}
            onChange={(e) =>
              setFormData({ ...formData, riskProfile: e.target.value as any })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 bg-white"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <p className="mt-1 text-xs text-gray-500 leading-relaxed">
            Use <strong>Low</strong> for Checking, Savings, CDs etc;{" "}
            <strong>Medium</strong> for S&P 500 ETF and mutual funds;{" "}
            <strong>High</strong> for riskier leveraged investment instruments
            like TQQQ
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Estimated Annual Interest %
          </label>
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
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Timeframe
          </label>
          <select
            value={formData.timeframe}
            onChange={(e) =>
              setFormData({ ...formData, timeframe: e.target.value as any })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 bg-white"
          >
            <option value="Pre and Post-Retirement">
              Pre and Post-Retirement
            </option>
            <option value="Pre-Retirement">Pre-Retirement</option>
            <option value="Post-Retirement">Post-Retirement</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Details (Optional)
        </label>
        <textarea
          rows={3}
          value={formData.details}
          onChange={(e) =>
            setFormData({ ...formData, details: e.target.value })
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
          placeholder="Additional notes..."
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </form>
  );
};
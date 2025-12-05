
import React, { useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { ModulePageLayout } from "../components/ModulePageLayout";
import { Liability, Timeframe } from "../services/storage";
import { useFormPersistence } from "../hooks/useFormPersistence";
import { ModuleStats } from "../components/ModuleStats";

const LIABILITY_SUGGESTIONS: Partial<Liability>[] = [
  {
    name: "Primary Mortgage",
    balance: 350000,
    monthlyPayment: 2400,
    interestRate: 6.5,
    timeframe: "Pre and Post-Retirement",
  },
  {
    name: "Auto Loan",
    balance: 20000,
    monthlyPayment: 450,
    interestRate: 7,
    timeframe: "Pre-Retirement",
  },
  {
    name: "Credit Card Debt",
    balance: 5000,
    monthlyPayment: 150,
    interestRate: 20,
    timeframe: "Pre-Retirement",
  },
  {
    name: "Student Loan",
    balance: 25000,
    monthlyPayment: 300,
    interestRate: 5,
    timeframe: "Pre-Retirement",
  },
  {
    name: "HELOC",
    balance: 15000,
    monthlyPayment: 200,
    interestRate: 8,
    timeframe: "Pre and Post-Retirement",
  },
  {
    name: "Child's Wedding",
    balance: 30000,
    monthlyPayment: 0,
    interestRate: 0,
    timeframe: "Pre-Retirement",
    details: "Future liability, currently saving for it or estimated cost.",
  },
];

export const LiabilitiesPage: React.FC = () => {
  const { user, saveData } = useAuth();
  const items = user?.liabilities || [];

  const handleAdd = (item: Omit<Liability, "id">) => {
    saveData({
      liabilities: [...items, { ...item, id: Date.now().toString() }],
    });
  };

  const handleEdit = (updatedItem: Liability) => {
    saveData({
      liabilities: items.map((i) =>
        i.id === updatedItem.id ? updatedItem : i,
      ),
    });
  };

  const handleDelete = (id: string) => {
    saveData({ liabilities: items.filter((i) => i.id !== id) });
  };

  const chartData = useMemo(() => {
    // Top 5 largest liabilities
    const sorted = [...items].sort((a, b) => b.balance - a.balance);
    const top5 = sorted.slice(0, 5);
    const other = sorted.slice(5).reduce((sum, i) => sum + i.balance, 0);
    const result = top5.map((i) => ({ name: i.name, value: i.balance }));
    if (other > 0) result.push({ name: "Other", value: other });
    return result;
  }, [items]);

  return (
    <ModulePageLayout<Liability>
      title="Liabilities"
      singularTitle="Liability"
      items={items}
      suggestions={LIABILITY_SUGGESTIONS}
      infoText="Liabilities are debts or loans with an outstanding balance that you owe."
      stats={
        <ModuleStats
          data={chartData}
          type="pie"
          dataKey="value"
          nameKey="name"
          title="Debt Distribution"
          totalLabel="Total Debt"
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
          <h3 className="font-semibold text-gray-900">{item.name}</h3>
          <div className="text-sm text-gray-500 flex flex-wrap gap-2 mt-1">
            <span className="font-medium text-red-600">
              Balance: ${item.balance.toLocaleString()}
            </span>
            {item.monthlyPayment > 0 && (
              <span>Payment: ${item.monthlyPayment.toLocaleString()}/mo</span>
            )}
            {item.interestRate > 0 && (
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                {item.interestRate}% APR
              </span>
            )}
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
        <LiabilityForm
          onSubmit={onSubmit}
          initialData={initialData as Liability}
          onCancel={onCancel}
        />
      )}
    />
  );
};

const LiabilityForm: React.FC<{
  onSubmit: (data: any) => void;
  initialData?: Partial<Liability>;
  onCancel?: () => void;
}> = ({ onSubmit, initialData, onCancel }) => {
  const isEditMode = !!initialData?.id;
  const initialFormState = {
    name: "",
    balance: "",
    monthlyPayment: "",
    interestRate: "",
    timeframe: "Pre and Post-Retirement" as Timeframe,
    details: "",
  };

  const [formData, setFormData, clearFormData] = useFormPersistence(
    `liability_form_draft`,
    initialFormState,
    !isEditMode,
  );

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        balance: initialData.balance?.toString() || "",
        monthlyPayment: initialData.monthlyPayment?.toString() || "",
        interestRate: initialData.interestRate?.toString() || "",
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
      monthlyPayment: parseFloat(formData.monthlyPayment) || 0,
      interestRate: parseFloat(formData.interestRate) || 0,
      timeframe: formData.timeframe,
      details: formData.details,
    });
    if (!isEditMode) clearFormData();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Balance <span className="text-red-500">*</span>
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
            Monthly Payment (Optional)
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              min="0"
              value={formData.monthlyPayment}
              onChange={(e) =>
                setFormData({ ...formData, monthlyPayment: e.target.value })
              }
              className="block w-full rounded-md border-gray-300 pl-7 focus:border-blue-500 focus:ring-blue-500 border p-2"
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Interest Rate (APR %) (Optional)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.interestRate}
            onChange={(e) =>
              setFormData({ ...formData, interestRate: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Timeframe (Optional)
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
          placeholder="Additional notes (e.g. Estimated date of payoff)..."
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
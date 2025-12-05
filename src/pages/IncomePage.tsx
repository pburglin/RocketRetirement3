import React, { useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { ModulePageLayout } from "../components/ModulePageLayout";
import { IncomeSource, Timeframe } from "../services/storage";
import { useFormPersistence } from "../hooks/useFormPersistence";
import { ModuleStats } from "../components/ModuleStats";

const INCOME_SUGGESTIONS: Partial<IncomeSource>[] = [
  {
    name: "Primary Salary",
    amount: 6500,
    category: "Pre-Retirement",
  },
  {
    name: "Spouse Salary",
    amount: 4500,
    category: "Pre-Retirement",
  },
  {
    name: "Annual Bonus (Avg)",
    amount: 500,
    category: "Pre-Retirement",
  },
  {
    name: "Rental Income",
    amount: 500,
    category: "Pre and Post-Retirement",
  },
  {
    name: "Stock Dividends",
    amount: 150,
    category: "Pre and Post-Retirement",
  },
];

export const IncomePage: React.FC = () => {
  const { user, saveData } = useAuth();
  const items = user?.incomeSources || [];

  const handleAdd = (item: Omit<IncomeSource, "id">) => {
    saveData({
      incomeSources: [...items, { ...item, id: Date.now().toString() }],
    });
  };

  const handleEdit = (updatedItem: IncomeSource) => {
    saveData({
      incomeSources: items.map((i) =>
        i.id === updatedItem.id ? updatedItem : i,
      ),
    });
  };

  const handleDelete = (id: string) => {
    saveData({ incomeSources: items.filter((i) => i.id !== id) });
  };

  const chartData = useMemo(() => {
    // Group by income source name for visualization
    const grouped = items.reduce(
      (acc, item) => {
        const key = item.name || "Unnamed";
        acc[key] = (acc[key] || 0) + item.amount;
        return acc;
      },
      {} as Record<string, number>,
    );
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [items]);

  return (
    <ModulePageLayout<IncomeSource>
      title="Income Sources"
      items={items}
      suggestions={INCOME_SUGGESTIONS}
      stats={
        <ModuleStats
          data={chartData}
          type="pie"
          dataKey="value"
          nameKey="name"
          title="Income by Timeframe"
          totalLabel="Total Monthly Income"
        />
      }
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
      sortFunction={(a, b) => b.amount - a.amount}
      filterFunction={(item, term) =>
        item.name.toLowerCase().includes(term.toLowerCase())
      }
      renderItem={(item) => (
        <div>
          <h3 className="font-semibold text-gray-900">{item.name}</h3>
          <div className="text-sm text-gray-500 flex flex-wrap gap-2 mt-1">
            <span className="font-medium text-green-600">
              ${item.amount.toLocaleString()}/mo
            </span>
            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs">
              {item.category}
            </span>
            {item.details && (
              <span className="text-xs text-gray-400 truncate max-w-[200px]">
                {item.details}
              </span>
            )}
          </div>
        </div>
      )}
      renderForm={(onSubmit, initialData, onCancel) => (
        <IncomeForm
          onSubmit={onSubmit}
          initialData={initialData as IncomeSource}
          onCancel={onCancel}
        />
      )}
    />
  );
};

const IncomeForm: React.FC<{
  onSubmit: (data: any) => void;
  initialData?: Partial<IncomeSource>;
  onCancel?: () => void;
}> = ({ onSubmit, initialData, onCancel }) => {
  const isEditMode = !!initialData?.id;
  const initialFormState = {
    name: "",
    amount: "",
    category: "Pre-Retirement" as Timeframe,
    details: "",
  };

  const [formData, setFormData, clearFormData] = useFormPersistence(
    `income_form_draft`,
    initialFormState,
    !isEditMode, // Only persist if NOT editing
  );

  // Load initial data if editing or if prefill is provided
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        amount: initialData.amount?.toString() || "",
        category: initialData.category || "Pre-Retirement",
        details: initialData.details || "",
      });
    }
  }, [initialData, setFormData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      amount: parseFloat(formData.amount) || 0,
      category: formData.category,
      details: formData.details,
    });
    if (!isEditMode) clearFormData();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
        />
        <p className="mt-1 text-xs text-gray-500">
          Use generic names like Salary, Spouse Bonus
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Monthly Amount
        </label>
        <div className="relative mt-1 rounded-md shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            className="block w-full rounded-md border-gray-300 pl-7 focus:border-blue-500 focus:ring-blue-500 border p-2"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Income Category (Timeframe)
        </label>
        <select
          value={formData.category}
          onChange={(e) =>
            setFormData({ ...formData, category: e.target.value as any })
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 bg-white"
        >
          <option value="Pre-Retirement">Pre-Retirement</option>
          <option value="Post-Retirement">Post-Retirement</option>
          <option value="Pre and Post-Retirement">
            Pre and Post-Retirement
          </option>
        </select>
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

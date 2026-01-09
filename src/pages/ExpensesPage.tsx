import React, { useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { ModulePageLayout } from "../components/ModulePageLayout";
import { Expense, Timeframe } from "../services/storage";
import { useFormPersistence } from "../hooks/useFormPersistence";
import { ModuleStats } from "../components/ModuleStats";

const EXPENSE_SUGGESTIONS: Partial<Expense>[] = [
  {
    name: "Housing (Mortgage/Rent)",
    amount: 2600,
    retirementCategory: "Required",
    timeframe: "Pre and Post-Retirement",
    isOneTime: false,
  },
  {
    name: "Groceries",
    amount: 1500,
    retirementCategory: "Required",
    timeframe: "Pre and Post-Retirement",
    isOneTime: false,
  },
  {
    name: "Utilities",
    amount: 700,
    retirementCategory: "Required",
    timeframe: "Pre and Post-Retirement",
    isOneTime: false,
  },
  {
    name: "Car Insurance",
    amount: 150,
    retirementCategory: "Required",
    timeframe: "Pre and Post-Retirement",
    isOneTime: false,
  },
  {
    name: "Health Insurance",
    amount: 400,
    retirementCategory: "Required",
    timeframe: "Pre and Post-Retirement",
    isOneTime: false,
  },
  {
    name: "Dining Out",
    amount: 300,
    retirementCategory: "Nice-to-have",
    timeframe: "Pre and Post-Retirement",
    isOneTime: false,
  },
  {
    name: "Travel",
    amount: 500,
    retirementCategory: "Nice-to-have",
    timeframe: "Pre and Post-Retirement",
    isOneTime: false,
  },
  // One-time expense suggestions
  {
    name: "New Roof",
    amount: 15000,
    retirementCategory: "Required",
    timeframe: "Pre-Retirement",
    isOneTime: true,
    scheduledDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
  {
    name: "New Car",
    amount: 35000,
    retirementCategory: "Nice-to-have",
    timeframe: "Pre-Retirement",
    isOneTime: true,
    scheduledDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
  {
    name: "Child's Wedding",
    amount: 25000,
    retirementCategory: "Nice-to-have",
    timeframe: "Pre-Retirement",
    isOneTime: true,
    scheduledDate: new Date(Date.now() + 1095 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
  {
    name: "Family Trip",
    amount: 8000,
    retirementCategory: "Nice-to-have",
    timeframe: "Pre and Post-Retirement",
    isOneTime: true,
    scheduledDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
];

export const ExpensesPage: React.FC = () => {
  const { user, saveData } = useAuth();
  const items = user?.expenses || [];

  const handleAdd = (item: Omit<Expense, "id">) => {
    saveData({ expenses: [...items, { ...item, id: Date.now().toString() }] });
  };

  const handleEdit = (updatedItem: Expense) => {
    saveData({
      expenses: items.map((i) => (i.id === updatedItem.id ? updatedItem : i)),
    });
  };

  const handleDelete = (id: string) => {
    saveData({ expenses: items.filter((i) => i.id !== id) });
  };

  const chartData = useMemo(() => {
    const grouped = items.reduce(
      (acc, item) => {
        const key = item.retirementCategory;
        acc[key] = (acc[key] || 0) + item.amount;
        return acc;
      },
      {} as Record<string, number>,
    );
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [items]);

  return (
    <ModulePageLayout<Expense>
      title="Expenses"
      items={items}
      suggestions={EXPENSE_SUGGESTIONS}
      infoText={
        <span>
          <strong>Expenses vs. Liabilities:</strong> Use "Expenses" for
          recurring costs like groceries, utilities, and insurance. Use
          "Liabilities" for debts with a total balance, like loans or mortgages.
        </span>
      }
      stats={
        <ModuleStats
          data={chartData}
          type="pie"
          dataKey="value"
          nameKey="name"
          title="Expense Priority"
          totalLabel="Total Monthly Expenses"
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
            <span className="font-medium text-red-600">
              {item.isOneTime 
                ? `$${item.amount.toLocaleString()}`
                : `$${item.amount.toLocaleString()}/mo`}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${item.retirementCategory === "Required" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}`}
            >
              {item.retirementCategory}
            </span>
            {item.isOneTime ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs">
                One-time • {item.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString() : 'No date set'}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs">
                {item.timeframe}
              </span>
            )}
            {item.isCompleted && (
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs">
                ✓ Completed
              </span>
            )}
            {item.details && (
              <span className="text-xs text-gray-400 truncate max-w-[150px]">
                {item.details}
              </span>
            )}
          </div>
        </div>
      )}
      renderForm={(onSubmit, initialData, onCancel) => (
        <ExpenseForm
          onSubmit={onSubmit}
          initialData={initialData as Expense}
          onCancel={onCancel}
        />
      )}
    />
  );
};

const ExpenseForm: React.FC<{
  onSubmit: (data: any) => void;
  initialData?: Partial<Expense>;
  onCancel?: () => void;
}> = ({ onSubmit, initialData, onCancel }) => {
  const isEditMode = !!initialData?.id;
  const initialFormState = {
    name: "",
    amount: "",
    retirementCategory: "Required" as Expense["retirementCategory"],
    timeframe: "Pre and Post-Retirement" as Timeframe,
    details: "",
    isOneTime: false,
    scheduledDate: "",
    isCompleted: false,
  };

  const [formData, setFormData, clearFormData] = useFormPersistence(
    `expense_form_draft`,
    initialFormState,
    !isEditMode,
  );

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        amount: initialData.amount?.toString() || "",
        retirementCategory: initialData.retirementCategory || "Required",
        timeframe: initialData.timeframe || "Pre and Post-Retirement",
        details: initialData.details || "",
        isOneTime: initialData.isOneTime || false,
        scheduledDate: initialData.scheduledDate || "",
        isCompleted: initialData.isCompleted || false,
      });
    }
  }, [initialData, setFormData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      amount: parseFloat(formData.amount) || 0,
      retirementCategory: formData.retirementCategory,
      timeframe: formData.timeframe,
      details: formData.details,
      isOneTime: formData.isOneTime,
      scheduledDate: formData.isOneTime ? formData.scheduledDate : undefined,
      isCompleted: formData.isOneTime ? formData.isCompleted : undefined,
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
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          {formData.isOneTime ? "One-time Amount" : "Monthly Amount"}
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
      
      {/* One-time expense toggle */}
      <div className="border-t pt-4 mt-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isOneTime}
            onChange={(e) => setFormData({ ...formData, isOneTime: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            This is a one-time future expense
          </span>
        </label>
        <p className="mt-1 text-xs text-gray-500 ml-6">
          For items like a new roof, car, wedding, or big trip
        </p>
      </div>

      {/* One-time expense specific fields */}
      {formData.isOneTime && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Scheduled Date
            </label>
            <input
              type="date"
              value={formData.scheduledDate}
              onChange={(e) =>
                setFormData({ ...formData, scheduledDate: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            />
            <p className="mt-1 text-xs text-gray-500">
              When do you expect to pay for this expense?
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isCompleted}
              onChange={(e) => setFormData({ ...formData, isCompleted: e.target.checked })}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Already completed / paid
            </span>
          </label>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Priority
          </label>
          <select
            value={formData.retirementCategory}
            onChange={(e) =>
              setFormData({
                ...formData,
                retirementCategory: e.target.value as any,
              })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 bg-white"
          >
            <option value="Required">Required</option>
            <option value="Nice-to-have">Nice-to-have</option>
          </select>
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
          Details (Optional but Recommended)
        </label>
        <textarea
          rows={3}
          value={formData.details}
          onChange={(e) =>
            setFormData({ ...formData, details: e.target.value })
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
          placeholder="More details = better budgeting insights! Include specific services, providers, coverage details, etc."
        />
        <p className="mt-1 text-xs text-gray-500">
          💡 Detailed expense information helps Rocket Fi provide better retirement lifestyle recommendations.
        </p>
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

import React from "react";
import { useAuth } from "../context/AuthContext";
import { ModulePageLayout } from "../components/ModulePageLayout";
import { Expense } from "../services/storage";

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

  return (
    <ModulePageLayout<Expense>
      title="Expenses"
      items={items}
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
          <div className="text-sm text-gray-500 flex gap-4 mt-1">
            <span className="font-medium text-red-600">
              ${item.amount.toLocaleString()}/mo
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${item.retirementCategory === "Required" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}`}
            >
              {item.retirementCategory}
            </span>
          </div>
        </div>
      )}
      renderForm={(onSubmit, initialData, onCancel) => (
        <ExpenseForm
          onSubmit={onSubmit}
          initialData={initialData}
          onCancel={onCancel}
        />
      )}
    />
  );
};

const ExpenseForm: React.FC<{
  onSubmit: (data: any) => void;
  initialData?: Expense;
  onCancel?: () => void;
}> = ({ onSubmit, initialData, onCancel }) => {
  const [name, setName] = React.useState(initialData?.name || "");
  const [amount, setAmount] = React.useState(
    initialData?.amount?.toString() || "",
  );
  const [retirementCategory, setRetirementCategory] = React.useState<
    Expense["retirementCategory"]
  >(initialData?.retirementCategory || "Required");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, amount: parseFloat(amount) || 0, retirementCategory });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
        />
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
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="block w-full rounded-md border-gray-300 pl-7 focus:border-blue-500 focus:ring-blue-500 border p-2"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Retirement Category
        </label>
        <select
          value={retirementCategory}
          onChange={(e) => setRetirementCategory(e.target.value as any)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 bg-white"
        >
          <option value="Required">Required</option>
          <option value="Nice-to-have">Nice-to-have</option>
        </select>
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

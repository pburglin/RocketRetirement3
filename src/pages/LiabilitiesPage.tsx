import React from "react";
import { useAuth } from "../context/AuthContext";
import { ModulePageLayout } from "../components/ModulePageLayout";
import { Liability } from "../services/storage";

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

  return (
    <ModulePageLayout<Liability>
      title="Liabilities"
      items={items}
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
          <div className="text-sm text-gray-500 flex gap-4 mt-1">
            <span className="font-medium text-red-600">
              Balance: ${item.balance.toLocaleString()}
            </span>
            <span>Payment: ${item.monthlyPayment.toLocaleString()}/mo</span>
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
              {item.interestRate}% APR
            </span>
          </div>
        </div>
      )}
      renderForm={(onSubmit, initialData, onCancel) => (
        <LiabilityForm
          onSubmit={onSubmit}
          initialData={initialData}
          onCancel={onCancel}
        />
      )}
    />
  );
};

const LiabilityForm: React.FC<{
  onSubmit: (data: any) => void;
  initialData?: Liability;
  onCancel?: () => void;
}> = ({ onSubmit, initialData, onCancel }) => {
  const [name, setName] = React.useState(initialData?.name || "");
  const [balance, setBalance] = React.useState(
    initialData?.balance?.toString() || "",
  );
  const [monthlyPayment, setMonthlyPayment] = React.useState(
    initialData?.monthlyPayment?.toString() || "",
  );
  const [interestRate, setInterestRate] = React.useState(
    initialData?.interestRate?.toString() || "",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      balance: parseFloat(balance) || 0,
      monthlyPayment: parseFloat(monthlyPayment) || 0,
      interestRate: parseFloat(interestRate) || 0,
    });
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
      <div className="grid grid-cols-2 gap-4">
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
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="block w-full rounded-md border-gray-300 pl-7 focus:border-blue-500 focus:ring-blue-500 border p-2"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Monthly Payment
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              required
              min="0"
              value={monthlyPayment}
              onChange={(e) => setMonthlyPayment(e.target.value)}
              className="block w-full rounded-md border-gray-300 pl-7 focus:border-blue-500 focus:ring-blue-500 border p-2"
            />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Interest Rate (APR %)
        </label>
        <input
          type="number"
          required
          min="0"
          step="0.01"
          value={interestRate}
          onChange={(e) => setInterestRate(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
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

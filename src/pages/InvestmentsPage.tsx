import React from "react";
import { useAuth } from "../context/AuthContext";
import { ModulePageLayout } from "../components/ModulePageLayout";
import { InvestmentAccount } from "../services/storage";

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

  return (
    <ModulePageLayout<InvestmentAccount>
      title="Investment Accounts"
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
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{item.name}</h3>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 rounded border">
              ...{item.accountNumberLast4}
            </span>
          </div>
          <div className="text-sm text-gray-500 flex flex-wrap gap-3 mt-1">
            <span className="font-medium text-blue-600">
              ${item.balance.toLocaleString()}
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
          </div>
        </div>
      )}
      renderForm={(onSubmit, initialData, onCancel) => (
        <InvestmentForm
          onSubmit={onSubmit}
          initialData={initialData}
          onCancel={onCancel}
        />
      )}
    />
  );
};

const InvestmentForm: React.FC<{
  onSubmit: (data: any) => void;
  initialData?: InvestmentAccount;
  onCancel?: () => void;
}> = ({ onSubmit, initialData, onCancel }) => {
  const [name, setName] = React.useState(initialData?.name || "");
  const [balance, setBalance] = React.useState(
    initialData?.balance?.toString() || "",
  );
  const [accountType, setAccountType] = React.useState<
    InvestmentAccount["accountType"]
  >(initialData?.accountType || "Investment (tax advantaged)");
  const [riskProfile, setRiskProfile] = React.useState<
    InvestmentAccount["riskProfile"]
  >(initialData?.riskProfile || "Medium");
  const [estimatedReturn, setEstimatedReturn] = React.useState(
    initialData?.estimatedReturn?.toString() || "7",
  );
  const [accountNumberLast4, setAccountNumberLast4] = React.useState(
    initialData?.accountNumberLast4 || "",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      balance: parseFloat(balance) || 0,
      accountType,
      riskProfile,
      estimatedReturn: parseFloat(estimatedReturn) || 0,
      accountNumberLast4,
    });
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
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            value={accountNumberLast4}
            onChange={(e) =>
              setAccountNumberLast4(e.target.value.replace(/\D/g, ""))
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            placeholder="XXXX"
          />
        </div>
      </div>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Account Type
          </label>
          <select
            value={accountType}
            onChange={(e) => setAccountType(e.target.value as any)}
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
            value={riskProfile}
            onChange={(e) => setRiskProfile(e.target.value as any)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 bg-white"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Estimated Annual Interest %
        </label>
        <input
          type="number"
          required
          step="0.1"
          value={estimatedReturn}
          onChange={(e) => setEstimatedReturn(e.target.value)}
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

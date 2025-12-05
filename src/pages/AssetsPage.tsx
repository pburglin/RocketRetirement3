import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { ModulePageLayout } from "../components/ModulePageLayout";
import { Asset } from "../services/storage";

const ASSET_SUGGESTIONS: Partial<Asset>[] = [
  {
    name: "Primary Residence",
    value: 450000,
    depreciationRate: -3, // Appreciation
  },
  {
    name: "Family Vehicle",
    value: 35000,
    depreciationRate: 15,
  },
  {
    name: "Secondary Vehicle",
    value: 20000,
    depreciationRate: 15,
  },
  {
    name: "Jewelry & Art",
    value: 10000,
    depreciationRate: 0,
  },
  {
    name: "Rental Property",
    value: 300000,
    depreciationRate: -2,
  },
];

export const AssetsPage: React.FC = () => {
  const { user, saveData } = useAuth();
  const items = user?.assets || [];

  const handleAdd = (item: Omit<Asset, "id">) => {
    saveData({ assets: [...items, { ...item, id: Date.now().toString() }] });
  };

  const handleEdit = (updatedItem: Asset) => {
    saveData({
      assets: items.map((i) => (i.id === updatedItem.id ? updatedItem : i)),
    });
  };

  const handleDelete = (id: string) => {
    saveData({ assets: items.filter((i) => i.id !== id) });
  };

  return (
    <ModulePageLayout<Asset>
      title="Assets"
      items={items}
      suggestions={ASSET_SUGGESTIONS}
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
      sortFunction={(a, b) => b.value - a.value}
      filterFunction={(item, term) =>
        item.name.toLowerCase().includes(term.toLowerCase())
      }
      renderItem={(item) => (
        <div>
          <h3 className="font-semibold text-gray-900">{item.name}</h3>
          <div className="text-sm text-gray-500 flex gap-4 mt-1">
            <span className="font-medium text-gray-900">
              ${item.value.toLocaleString()}
            </span>
            <span className="text-xs text-gray-400">
              {item.depreciationRate < 0
                ? `Appreciation: ${Math.abs(item.depreciationRate)}% / yr`
                : `Depreciation: ${item.depreciationRate}% / yr`}
            </span>
          </div>
        </div>
      )}
      renderForm={(onSubmit, initialData, onCancel) => (
        <AssetForm
          onSubmit={onSubmit}
          initialData={initialData as Asset}
          onCancel={onCancel}
        />
      )}
    />
  );
};

const AssetForm: React.FC<{
  onSubmit: (data: any) => void;
  initialData?: Partial<Asset>;
  onCancel?: () => void;
}> = ({ onSubmit, initialData, onCancel }) => {
  const [name, setName] = React.useState(initialData?.name || "");
  const [value, setValue] = React.useState(
    initialData?.value?.toString() || "",
  );
  const [depreciationRate, setDepreciationRate] = React.useState(
    initialData?.depreciationRate?.toString() || "0",
  );

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setValue(initialData.value?.toString() || "");
      setDepreciationRate(initialData.depreciationRate?.toString() || "0");
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      value: parseFloat(value) || 0,
      depreciationRate: parseFloat(depreciationRate) || 0,
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
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Asset Value
        </label>
        <div className="relative mt-1 rounded-md shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            required
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="block w-full rounded-md border-gray-300 pl-7 focus:border-blue-500 focus:ring-blue-500 border p-2"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Estimated Annual Depreciation %
        </label>
        <input
          type="number"
          required
          step="0.1"
          value={depreciationRate}
          onChange={(e) => setDepreciationRate(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
        />
        <p className="mt-1 text-xs text-gray-500">
          Use negative numbers for appreciation (e.g. -3 for 3% growth).
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

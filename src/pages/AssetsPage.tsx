import React, { useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { ModulePageLayout } from "../components/ModulePageLayout";
import { Asset, Timeframe } from "../services/storage";
import { useFormPersistence } from "../hooks/useFormPersistence";
import { ModuleStats } from "../components/ModuleStats";

const ASSET_SUGGESTIONS: Partial<Asset>[] = [
  {
    name: "Primary Residence",
    value: 450000,
    depreciationRate: -3, // Appreciation
    timeframe: "Pre and Post-Retirement",
  },
  {
    name: "Family Vehicle",
    value: 35000,
    depreciationRate: 15,
    timeframe: "Pre and Post-Retirement",
  },
  {
    name: "Secondary Vehicle",
    value: 20000,
    depreciationRate: 15,
    timeframe: "Pre and Post-Retirement",
  },
  {
    name: "Jewelry & Art",
    value: 10000,
    depreciationRate: 0,
    timeframe: "Pre and Post-Retirement",
  },
  {
    name: "Rental Property",
    value: 300000,
    depreciationRate: -2,
    timeframe: "Pre and Post-Retirement",
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

  const chartData = useMemo(() => {
    const sorted = [...items].sort((a, b) => b.value - a.value);
    const top5 = sorted.slice(0, 5);
    const other = sorted.slice(5).reduce((sum, i) => sum + i.value, 0);
    const result = top5.map((i) => ({ name: i.name, value: i.value }));
    if (other > 0) result.push({ name: "Other", value: other });
    return result;
  }, [items]);

  return (
    <ModulePageLayout<Asset>
      title="Assets"
      items={items}
      suggestions={ASSET_SUGGESTIONS}
      stats={
        <ModuleStats
          data={chartData}
          type="pie"
          dataKey="value"
          nameKey="name"
          title="Top Assets"
          totalLabel="Total Assets Value"
        />
      }
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
          <div className="text-sm text-gray-500 flex flex-wrap gap-2 mt-1">
            <span className="font-medium text-gray-900">
              ${item.value.toLocaleString()}
            </span>
            <span className="text-xs text-gray-400">
              {item.depreciationRate < 0
                ? `Appreciation: ${Math.abs(item.depreciationRate)}% / yr`
                : `Depreciation: ${item.depreciationRate}% / yr`}
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
  const isEditMode = !!initialData?.id;
  const initialFormState = {
    name: "",
    value: "",
    depreciationRate: "0",
    timeframe: "Pre and Post-Retirement" as Timeframe,
    details: "",
  };

  const [formData, setFormData, clearFormData] = useFormPersistence(
    `asset_form_draft`,
    initialFormState,
    !isEditMode,
  );

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        value: initialData.value?.toString() || "",
        depreciationRate: initialData.depreciationRate?.toString() || "0",
        timeframe: initialData.timeframe || "Pre and Post-Retirement",
        details: initialData.details || "",
      });
    }
  }, [initialData, setFormData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      value: parseFloat(formData.value) || 0,
      depreciationRate: parseFloat(formData.depreciationRate) || 0,
      timeframe: formData.timeframe,
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
            value={formData.value}
            onChange={(e) =>
              setFormData({ ...formData, value: e.target.value })
            }
            className="block w-full rounded-md border-gray-300 pl-7 focus:border-blue-500 focus:ring-blue-500 border p-2"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Estimated Annual Depreciation %
          </label>
          <input
            type="number"
            required
            step="0.1"
            value={formData.depreciationRate}
            onChange={(e) =>
              setFormData({ ...formData, depreciationRate: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
          />
          <p className="mt-1 text-xs text-gray-500">
            Use negative numbers for appreciation (e.g. -3 for 3% growth).
          </p>
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

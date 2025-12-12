import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { ModulePageLayout } from "../components/ModulePageLayout";
import { SocialSecurity } from "../services/storage";
import { useFormPersistence } from "../hooks/useFormPersistence";

export const SocialSecurityPage: React.FC = () => {
  const { user, saveData } = useAuth();
  const items = user?.socialSecurity || [];

  const handleAdd = (item: Omit<SocialSecurity, "id">) => {
    const itemWithId = { 
      ...item, 
      id: Date.now().toString(),
      name: item.person === "self" ? "My Social Security" : "Spouse Social Security"
    };
    saveData({
      socialSecurity: [...items, itemWithId],
    });
  };

  const handleEdit = (updatedItem: SocialSecurity) => {
    const updatedItemWithName = {
      ...updatedItem,
      name: updatedItem.person === "self" ? "My Social Security" : "Spouse Social Security"
    };
    saveData({
      socialSecurity: items.map((i) =>
        i.id === updatedItem.id ? updatedItemWithName : i,
      ),
    });
  };

  const handleDelete = (id: string) => {
    saveData({ socialSecurity: items.filter((i) => i.id !== id) });
  };

  return (
    <ModulePageLayout<SocialSecurity>
      title="Social Security Planning"
      items={items}
      suggestions={[]}
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
      sortFunction={(a, b) => (b.monthlyAmount + (b.spousalAmount || 0)) - (a.monthlyAmount + (a.spousalAmount || 0))}
      filterFunction={(item, term) => {
        const searchTerm = term.toLowerCase();
        return item.person.toLowerCase().includes(searchTerm) ||
               (item.notes?.toLowerCase().includes(searchTerm) ?? false);
      }}
      renderItem={(item) => (
        <div>
          <h3 className="font-semibold text-gray-900 capitalize">
            {item.person === "self" ? "Your Benefits" : "Spouse Benefits"}
            {item.hasSpouse && item.person === "self" && item.spousalAmount && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">
                + Spousal
              </span>
            )}
          </h3>
          <div className="text-sm text-gray-500 flex flex-wrap gap-2 mt-1">
            <span className="font-medium text-green-600">
              Start: Age {item.startAge}
            </span>
            <span className="font-medium text-green-600">
              ${item.monthlyAmount.toLocaleString()}/mo
            </span>
            {item.spousalAmount && (
              <span className="font-medium text-green-600">
                +${item.spousalAmount.toLocaleString()}/mo spousal
              </span>
            )}
          </div>
          {item.notes && (
            <div className="mt-2 text-xs text-gray-400 max-w-[300px]">
              {item.notes}
            </div>
          )}
        </div>
      )}
      renderForm={(onSubmit, initialData, onCancel) => (
        <SocialSecurityForm
          onSubmit={onSubmit}
          initialData={initialData as SocialSecurity}
          onCancel={onCancel}
        />
      )}
    />
  );
};

const SocialSecurityForm: React.FC<{
  onSubmit: (data: SocialSecurity) => void;
  initialData?: Partial<SocialSecurity>;
  onCancel?: () => void;
}> = ({ onSubmit, initialData, onCancel }) => {
  const isEditMode = !!initialData?.id;
  const initialFormState = {
    person: "self" as "self" | "spouse",
    hasSpouse: true,
    startAge: "67",
    monthlyAmount: "",
    spousalBenefits: false,
    spousalAmount: "",
    notes: "",
  };

  const [formData, setFormData, clearFormData] = useFormPersistence(
    `social_security_form_draft`,
    initialFormState,
    !isEditMode, // Only persist if NOT editing
  );

  // Load initial data if editing or if prefill is provided
  useEffect(() => {
    if (initialData) {
      setFormData({
        person: initialData.person || "self",
        hasSpouse: initialData.hasSpouse ?? true,
        startAge: initialData.startAge?.toString() || "67",
        monthlyAmount: initialData.monthlyAmount?.toString() || "",
        spousalBenefits: initialData.spousalBenefits ?? false,
        spousalAmount: initialData.spousalAmount?.toString() || "",
        notes: initialData.notes || "",
      });
    }
  }, [initialData, setFormData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit: SocialSecurity = {
      person: formData.person,
      hasSpouse: formData.hasSpouse,
      startAge: parseInt(formData.startAge) || 67,
      monthlyAmount: parseFloat(formData.monthlyAmount) || 0,
      spousalBenefits: formData.spousalBenefits,
      spousalAmount: formData.spousalAmount ? parseFloat(formData.spousalAmount) : undefined,
      notes: formData.notes,
      id: (initialData?.id as string) || Date.now().toString(),
      name: formData.person === "self" ? "My Social Security" : "Spouse Social Security"
    };
    
    onSubmit(dataToSubmit);
    if (!isEditMode) clearFormData();
  };

  // Auto-update spousal benefits when person changes
  useEffect(() => {
    if (formData.person === "spouse") {
      setFormData({ ...formData, spousalBenefits: false });
    }
  }, [formData.person]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Person
        </label>
        <select
          value={formData.person}
          onChange={(e) =>
            setFormData({ ...formData, person: e.target.value as "self" | "spouse" })
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 bg-white"
        >
          <option value="self">Myself</option>
          <option value="spouse">Spouse</option>
        </select>
      </div>

      <div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="hasSpouse"
            checked={formData.hasSpouse}
            onChange={(e) =>
              setFormData({ ...formData, hasSpouse: e.target.checked })
            }
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="hasSpouse" className="ml-2 block text-sm text-gray-700">
            I have a spouse/partner
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Start Age
        </label>
        <input
          type="number"
          required
          min="62"
          max="70"
          value={formData.startAge}
          onChange={(e) =>
            setFormData({ ...formData, startAge: e.target.value })
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
        />
        <p className="mt-1 text-xs text-gray-500">
          You can start collecting as early as 62, but waiting until 70 maximizes your benefits.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Expected Monthly Amount
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
            value={formData.monthlyAmount}
            onChange={(e) =>
              setFormData({ ...formData, monthlyAmount: e.target.value })
            }
            className="block w-full rounded-md border-gray-300 pl-7 focus:border-blue-500 focus:ring-blue-500 border p-2"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          💡 Use your Social Security statement or estimate at ssa.gov for accurate amounts.
        </p>
      </div>

      {formData.person === "self" && formData.hasSpouse && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center mb-3">
            <input
              type="checkbox"
              id="spousalBenefits"
              checked={formData.spousalBenefits}
              onChange={(e) =>
                setFormData({ ...formData, spousalBenefits: e.target.checked })
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="spousalBenefits" className="ml-2 block text-sm text-gray-700">
              Include spousal benefits (up to 50% of your benefit)
            </label>
          </div>

          {formData.spousalBenefits && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Expected Spousal Monthly Amount
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.spousalAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, spousalAmount: e.target.value })
                  }
                  className="block w-full rounded-md border-gray-300 pl-7 focus:border-blue-500 focus:ring-blue-500 border p-2"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Notes (Optional)
        </label>
        <textarea
          rows={3}
          value={formData.notes}
          onChange={(e) =>
            setFormData({ ...formData, notes: e.target.value })
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
          placeholder="Include any special circumstances, survivor benefits, or other relevant details..."
        />
        <p className="mt-1 text-xs text-gray-500">
          💡 Detailed information helps Rocket Fi provide better retirement planning recommendations.
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
          {isEditMode ? "Update" : "Add"} Social Security Plan
        </button>
      </div>
    </form>
  );
};
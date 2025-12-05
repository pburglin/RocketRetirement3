import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  Search,
  Edit2,
  Trash2,
  Sparkles,
} from "lucide-react";

interface ModulePageLayoutProps<T extends { name: string }> {
  title: string;
  singularTitle?: string;
  items: T[];
  suggestions?: Partial<T>[];
  stats?: React.ReactNode;
  infoText?: React.ReactNode;
  onAdd: (item: Omit<T, "id">) => void;
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
  renderForm: (
    onSubmit: (data: any) => void,
    initialData?: Partial<T>, // Allow Partial for prefill
    onCancel?: () => void,
  ) => React.ReactNode;
  renderItem: (item: T) => React.ReactNode;
  sortFunction: (a: T, b: T) => number;
  filterFunction: (item: T, searchTerm: string) => boolean;
}

export function ModulePageLayout<T extends { id: string; name: string }>({
  title,
  singularTitle,
  items,
  suggestions = [],
  stats,
  infoText,
  onAdd,
  onEdit,
  onDelete,
  renderForm,
  renderItem,
  sortFunction,
  filterFunction,
}: ModulePageLayoutProps<T>) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [prefillItem, setPrefillItem] = useState<Partial<T> | null>(null);

  const sortedItems = [...items].sort(sortFunction);
  const filteredItems = sortedItems.filter((item) =>
    filterFunction(item, searchTerm),
  );

  const handleFormSubmit = (data: any) => {
    if (editingItem) {
      onEdit({ ...editingItem, ...data });
      setEditingItem(null);
    } else {
      onAdd(data);
    }
    setIsAdding(false);
    setPrefillItem(null);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startEdit = (item: T) => {
    setEditingItem(item);
    setPrefillItem(null);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startAdd = () => {
    if (isAdding && !editingItem && !prefillItem) {
      setIsAdding(false);
    } else {
      setEditingItem(null);
      setPrefillItem(null);
      setIsAdding(true);
    }
  };

  const applySuggestion = (suggestion: Partial<T>) => {
    setPrefillItem(suggestion);
    setEditingItem(null);
    setIsAdding(true);
  };

  // Determine the label for the Add button
  const addItemLabel = singularTitle || title.slice(0, -1);

  // Filter suggestions: exclude if an item with a similar name exists
  const availableSuggestions = suggestions.filter((suggestion) => {
    if (!suggestion.name) return false;
    // Simple fuzzy check: string inclusion
    return !items.some((item) =>
      item.name.toLowerCase().includes(suggestion.name!.toLowerCase()),
    );
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Back to Dashboard - Aligned Top */}
      <div className="flex items-center mb-6">
        <Link
          to="/dashboard"
          className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Dashboard
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <div className="text-sm text-gray-500 mt-1">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {infoText && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-md">
          <div className="flex">
            <div className="ml-3">
              <div className="text-sm text-blue-700">{infoText}</div>
            </div>
          </div>
        </div>
      )}

      {stats && <div className="animate-fadeIn">{stats}</div>}

      {/* Collapsible Add/Edit Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <button
          onClick={startAdd}
          className="w-full px-6 py-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <span className="font-medium text-gray-900 flex items-center">
            {editingItem ? (
              <Edit2 className="w-4 h-4 mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            {editingItem ? "Edit Item" : `Add New ${addItemLabel}`}
          </span>
          {isAdding ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {isAdding && (
          <div className="p-6 border-t border-gray-200 animate-fadeIn">
            {/* Suggestions Chips */}
            {!editingItem && availableSuggestions.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-yellow-500" />
                  Quick Add Suggestions
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableSuggestions.slice(0, 5).map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applySuggestion(s)}
                      className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-100 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Form */}
            {renderForm(
              handleFormSubmit,
              editingItem || prefillItem || undefined,
              () => {
                setIsAdding(false);
                setEditingItem(null);
                setPrefillItem(null);
              },
            )}
          </div>
        )}
      </div>

      {/* Filter */}
      {items.length > 0 && (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Filter items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500">No items found.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center hover:shadow-md transition-shadow"
            >
              <div className="flex-grow">{renderItem(item)}</div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => startEdit(item)}
                  className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

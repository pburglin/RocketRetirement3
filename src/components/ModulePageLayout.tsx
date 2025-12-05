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
} from "lucide-react";

interface ModulePageLayoutProps<T> {
  title: string;
  items: T[];
  onAdd: (item: Omit<T, "id">) => void;
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
  renderForm: (
    onSubmit: (data: any) => void,
    initialData?: T,
    onCancel?: () => void,
  ) => React.ReactNode;
  renderItem: (item: T) => React.ReactNode;
  sortFunction: (a: T, b: T) => number;
  filterFunction: (item: T, searchTerm: string) => boolean;
}

export function ModulePageLayout<T extends { id: string }>({
  title,
  items,
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
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startEdit = (item: T) => {
    setEditingItem(item);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <div className="text-sm text-gray-500">{items.length} items</div>
      </div>

      {/* Collapsible Add/Edit Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <button
          onClick={() => {
            if (isAdding && !editingItem) setIsAdding(false);
            else {
              setEditingItem(null);
              setIsAdding(true);
            }
          }}
          className="w-full px-6 py-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <span className="font-medium text-gray-900 flex items-center">
            {editingItem ? (
              <Edit2 className="w-4 h-4 mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            {editingItem ? "Edit Item" : `Add New ${title.slice(0, -1)}`}
          </span>
          {isAdding ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {isAdding && (
          <div className="p-6 border-t border-gray-200 animate-fadeIn">
            {renderForm(handleFormSubmit, editingItem || undefined, () => {
              setIsAdding(false);
              setEditingItem(null);
            })}
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

import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { StorageService, UserProfile, Dependent } from "../services/storage";
import { decryptData, encryptData } from "../utils/crypto";
import {
  Save,
  User,
  Download,
  Upload,
  Trash2,
  Plus,
  AlertTriangle,
  Lock,
} from "lucide-react";

const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
  "DC",
  "Other",
];

export const UserProfilePage: React.FC = () => {
  const { user, saveData, encryptionKey, login } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  // Form State
  const [username, setUsername] = useState(user?.username || "");
  const [dob, setDob] = useState(user?.dob || "");
  const [maritalStatus, setMaritalStatus] = useState(
    user?.maritalStatus || "Single",
  );
  const [employmentStatus, setEmploymentStatus] = useState(
    user?.employmentStatus || "Employed",
  );
  const [state, setState] = useState(user?.state || "");
  const [dependents, setDependents] = useState<Dependent[]>(
    user?.dependents || [],
  );

  // Feedback
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showExportModal, setShowExportModal] = useState(false);

  // Check for redirect messages (e.g. "Set DOB first")
  useEffect(() => {
    if (location.state && location.state.message) {
      setMessage({
        text: location.state.message,
        type: location.state.type || "info",
      });
      // Clear history state to prevent message reappearing on simple reload
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSave = () => {
    // Check username change
    if (user && username !== user.username) {
      if (StorageService.userExists(username)) {
        setMessage({
          text: "Username already taken. Reverting.",
          type: "error",
        });
        setUsername(user.username);
        return;
      }
      // If username changes, we need to delete old key and save new key
      // But encryption key remains the same.
      StorageService.deleteUser(user.username);
    }

    saveData({
      username,
      dob,
      maritalStatus,
      employmentStatus,
      state,
      dependents,
    });

    setMessage({ text: "Profile updated successfully!", type: "success" });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const addDependent = () => {
    setDependents([
      ...dependents,
      { id: Date.now().toString(), name: "", age: 0 },
    ]);
  };

  const removeDependent = (id: string) => {
    setDependents(dependents.filter((d) => d.id !== id));
  };

  const updateDependent = (
    id: string,
    field: "name" | "age",
    value: string | number,
  ) => {
    setDependents(
      dependents.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
    );
  };

  const handleExport = (encrypt: boolean) => {
    if (!user || !encryptionKey) return;

    let dataToExport: string;

    if (encrypt) {
      dataToExport = JSON.stringify(encryptData(user, encryptionKey));
    } else {
      dataToExport = JSON.stringify(user, null, 2);
    }

    const blob = new Blob([dataToExport], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rocketfi_export_${user.username}_${encrypt ? "encrypted" : "cleartext"}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !encryptionKey) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        // Try parsing as JSON first
        let importedData: any = JSON.parse(content);

        // If it looks like an encrypted string (string, not object) or has specific structure
        // Actually, our export "encrypted" wraps the ciphertext in double quotes as it is JSON.stringify'd output of string
        // Let's assume content is the JSON string.

        let userProfile: UserProfile | null = null;

        // Heuristic: If it's a string, it might be encrypted ciphertext in JSON quotes
        // or if it's an object, it's clear text.

        if (typeof importedData === "string") {
          // It's likely encrypted
          userProfile = decryptData<UserProfile>(importedData, encryptionKey);
          if (!userProfile)
            throw new Error("Decryption failed. Wrong key or corrupted file.");
        } else {
          // It's likely clear text
          userProfile = importedData as UserProfile;
        }

        if (!userProfile || !userProfile.username)
          throw new Error("Invalid profile data.");

        // Confirm overwrite
        if (
          window.confirm(
            "This will overwrite your current profile data. Are you sure?",
          )
        ) {
          StorageService.saveUser(userProfile, encryptionKey);
          // Reload session
          login(userProfile.username, encryptionKey);
          // Update local state
          setUsername(userProfile.username);
          setDob(userProfile.dob || "");
          setMaritalStatus(userProfile.maritalStatus || "Single");
          setEmploymentStatus(userProfile.employmentStatus || "Employed");
          setState(userProfile.state || "");
          setDependents(userProfile.dependents || []);

          setMessage({
            text: "Data imported successfully!",
            type: "success",
          });
        }
      } catch (err) {
        console.error(err);
        setMessage({
          text: "Import failed: " + (err as Error).message,
          type: "error",
        });
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = "";
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            <Download size={16} /> Export
          </button>
          <button
            onClick={handleImportClick}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            <Upload size={16} /> Import
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".json"
            onChange={handleImportFile}
          />
        </div>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-md ${message.type === "error" ? "bg-red-50 text-red-700" : message.type === "warning" ? "bg-yellow-50 text-yellow-800" : "bg-green-50 text-green-700"}`}
        >
          {message.type === "warning" && (
            <AlertTriangle className="inline-block w-5 h-5 mr-2 -mt-1" />
          )}
          {message.text}
        </div>
      )}

      {/* Main Form */}
      <div className="bg-white shadow rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Username */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Username (Unique)
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                <User size={16} />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          {/* DOB */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
              className={`mt-1 block w-full py-2 px-3 border bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${!dob ? "border-red-300 ring-1 ring-red-100" : "border-gray-300"}`}
            />
            {!dob && (
              <p className="mt-1 text-xs text-red-500">
                Required for calculations
              </p>
            )}
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              State / Territory
            </label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select State</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Marital Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Marital Status
            </label>
            <select
              value={maritalStatus}
              onChange={(e) => setMaritalStatus(e.target.value)}
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
              <option value="Domestic Partnership">Domestic Partnership</option>
            </select>
          </div>

          {/* Employment Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Employment Status
            </label>
            <select
              value={employmentStatus}
              onChange={(e) => setEmploymentStatus(e.target.value)}
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="Employed">Employed</option>
              <option value="Self-Employed">Self-Employed</option>
              <option value="Unemployed">Unemployed</option>
              <option value="Retired">Retired</option>
              <option value="Student">Student</option>
            </select>
          </div>
        </div>

        {/* Dependents Section */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Dependents
            </h3>
            <button
              type="button"
              onClick={addDependent}
              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none"
            >
              <Plus size={14} className="mr-1" /> Add Dependent
            </button>
          </div>

          {dependents.length === 0 ? (
            <p className="text-gray-500 italic">No dependents.</p>
          ) : (
            <div className="space-y-3">
              {dependents.map((dep) => (
                <div
                  key={dep.id}
                  className="flex gap-4 items-center bg-gray-50 p-3 rounded-md"
                >
                  <input
                    type="text"
                    placeholder="Name / Identifier (e.g. Child 1)"
                    value={dep.name}
                    onChange={(e) =>
                      updateDependent(dep.id, "name", e.target.value)
                    }
                    className="flex-1 min-w-0 block w-full px-3 py-1 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Age"
                    value={dep.age}
                    onChange={(e) =>
                      updateDependent(
                        dep.id,
                        "age",
                        parseInt(e.target.value) || 0,
                      )
                    }
                    className="w-20 block px-3 py-1 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <button
                    onClick={() => removeDependent(dep.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="border-t border-gray-200 pt-6">
          <button
            onClick={handleSave}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Save size={18} className="mr-2" /> Save Profile
          </button>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">Export Data</h3>
            <p className="text-sm text-gray-600 mb-6">
              Choose how you want to export your data.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleExport(true)}
                className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100"
              >
                <span>Encrypted (Recommended)</span>
                <Lock size={16} />
              </button>
              <button
                onClick={() => handleExport(false)}
                className="w-full flex items-center justify-between px-4 py-3 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200 hover:bg-yellow-100"
              >
                <div className="text-left">
                  <div>Clear Text</div>
                  <div className="text-xs opacity-75">Not Secure</div>
                </div>
                <AlertTriangle size={16} />
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="w-full py-2 text-gray-500 hover:text-gray-700 mt-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

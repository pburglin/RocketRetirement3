import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchLLMAnalysis, LLMResponse } from "../lib/llm";
import {
  Brain,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
} from "lucide-react";

const FREE_MODELS = [
  "google/gemma-2-9b-it:free",
  "mistralai/mistral-7b-instruct:free",
  "meta-llama/llama-3-8b-instruct:free",
  "microsoft/phi-3-medium-128k-instruct:free",
];

export const ReportsInsightsPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedModel, setSelectedModel] = useState(FREE_MODELS[0]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<LLMResponse | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [error, setError] = useState("");

  // Load persisted report on mount
  useEffect(() => {
    const saved = localStorage.getItem("rocketfi_last_report");
    if (saved) {
      try {
        setReport(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved report", e);
      }
    }
  }, []);

  const handleGenerate = async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetchLLMAnalysis(user, selectedModel);
      setReport(response);
      localStorage.setItem("rocketfi_last_report", JSON.stringify(response));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getSystemPromptPreview = () => {
    // Reconstruct the prompt locally for preview (keep in sync with lib/llm.ts logic roughly or allow passing it)
    // For simplicity/security, just showing what we would send based on user data
    if (!user) return "";

    return JSON.stringify(
      {
        age: "Derived from DOB",
        state: user.state,
        assets: user.assets,
        liabilities: user.liabilities,
        investments: user.investmentAccounts,
        income: user.incomeSources,
        expenses: user.expenses,
      },
      null,
      2,
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3">
        <Brain className="w-8 h-8 text-purple-600" />
        <h1 className="text-3xl font-bold text-gray-900">
          AI Insights & Reports
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Configuration</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AI Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2 text-sm"
                >
                  {FREE_MODELS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 p-3 rounded-md text-xs text-blue-800">
                <p className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Privacy Note:</strong> Clicking "Start AI Analysis"
                    will send anonymized financial aggregates to OpenRouter.ai.
                    No name or exact street address is sent.
                  </span>
                </p>
              </div>

              <button
                onClick={() => setShowPrompt(!showPrompt)}
                className="w-full text-left text-sm text-gray-600 hover:text-gray-900 flex justify-between items-center py-2"
              >
                <span>Review AI Prompt Payload</span>
                {showPrompt ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>

              {showPrompt && (
                <div className="bg-gray-50 p-2 rounded text-xs font-mono overflow-x-auto max-h-40 border border-gray-200">
                  {getSystemPromptPreview()}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  <Brain className="h-4 w-4" />
                )}
                Start AI Analysis
              </button>

              {loading && (
                <p className="text-xs text-center text-gray-500 animate-pulse">
                  Crunching the numbers...
                </p>
              )}

              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">
                  Error: {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="lg:col-span-3">
          {report ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-2">
                  <FileText className="text-purple-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Personalized Recommendations
                  </h2>
                </div>
                <span className="text-xs text-gray-500">
                  Generated by {report.model} on{" "}
                  {new Date(report.created).toLocaleString()}
                </span>
              </div>

              <div className="p-8 prose max-w-none text-gray-700">
                <div className="whitespace-pre-wrap">{report.content}</div>
              </div>

              {report.usage && (
                <div className="bg-gray-50 p-3 text-center text-xs text-gray-400 border-t border-gray-100">
                  Tokens Used: {report.usage.total_tokens} (Prompt:{" "}
                  {report.usage.prompt_tokens}, Completion:{" "}
                  {report.usage.completion_tokens})
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 bg-white rounded-lg border-2 border-dashed border-gray-300 text-gray-400">
              <Brain className="w-16 h-16 mb-4 opacity-20" />
              <p>No report generated yet.</p>
              <p className="text-sm">
                Configure the model and click "Start AI Analysis" to begin.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "../context/AuthContext";
import {
  fetchLLMAnalysis,
  LLMResponse,
  constructPrompt,
  FREE_MODELS,
} from "../lib/llm";
import {
  Brain,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  RefreshCw,
  Printer,
} from "lucide-react";

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

  const handlePrint = () => {
    window.print();
  };

  const getPromptPreview = () => {
    if (!user) return "";
    const { systemPrompt, userMessage } = constructPrompt(user);
    return `### SYSTEM:\n${systemPrompt}\n\n### USER:\n${userMessage}`;
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
        {/* Controls - Hide on Print */}
        <div className="lg:col-span-1 space-y-6 no-print">
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
                <div className="bg-gray-50 p-2 rounded text-xs font-mono overflow-x-auto max-h-60 border border-gray-200 whitespace-pre-wrap">
                  {getPromptPreview()}
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
                {loading ? "Analyzing..." : "Start AI Analysis"}
              </button>

              {loading && (
                <p className="text-xs text-center text-gray-500 animate-pulse">
                  Crunching the numbers...
                </p>
              )}

              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md break-words">
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
              <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50">
                <div className="flex items-center gap-2">
                  <FileText className="text-purple-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Personalized Recommendations
                  </h2>
                </div>
                <div className="flex items-center gap-4 no-print">
                  <span className="text-xs text-gray-500">
                    Generated by {report.model} on{" "}
                    {new Date(report.created).toLocaleString()}
                  </span>
                  <button
                    onClick={handlePrint}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    title="Print Report"
                  >
                    <Printer size={18} />
                  </button>
                  <button
                    onClick={handleGenerate}
                    className="text-gray-400 hover:text-purple-600 transition-colors"
                    title="Regenerate Report"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              <div className="p-8 prose prose-purple max-w-none text-gray-700">
                <ReactMarkdown>{report.content}</ReactMarkdown>
              </div>

              {report.usage && (
                <div className="bg-gray-50 p-3 text-center text-xs text-gray-400 border-t border-gray-100 no-print">
                  Tokens Used: {report.usage.total_tokens} (Prompt:{" "}
                  {report.usage.prompt_tokens}, Completion:{" "}
                  {report.usage.completion_tokens})
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 bg-white rounded-lg border-2 border-dashed border-gray-300 text-gray-400 min-h-[400px]">
              <Brain className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">No report generated yet.</p>
              <p className="text-sm mt-2">
                Configure the model and click "Start AI Analysis" to begin.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

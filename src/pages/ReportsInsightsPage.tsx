import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "../context/AuthContext";
import {
  fetchLLMAnalysis,
  LLMResponse,
  constructPrompt,
  fetchAvailableModels,
  FREE_MODELS,
} from "../lib/llm";
import AIAssistant from "../components/AIAssistant";
import {
  Brain,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  RefreshCw,
  Printer,
  HelpCircle,
  Users,
  MessageCircle,
  Plus,
  X,
} from "lucide-react";

export const ReportsInsightsPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedModel, setSelectedModel] = useState(FREE_MODELS[0]);
  const [availableModels, setAvailableModels] = useState<string[]>(FREE_MODELS);
  const [loading, setLoading] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [report, setReport] = useState<LLMResponse | null>(null);
  const [reportHistory, setReportHistory] = useState<LLMResponse[]>([]);
  const [showPrompt, setShowPrompt] = useState(false);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [showBeneficiaryAssistant, setShowBeneficiaryAssistant] = useState(false);
  const [showChatAssistant, setShowChatAssistant] = useState(false);
  const [error, setError] = useState("");

  // Load persisted report and available models on mount
  useEffect(() => {
    const loadData = async () => {
      // Load saved report and history
      const saved = localStorage.getItem("rocketfi_last_report");
      const savedHistory = localStorage.getItem("rocketfi_report_history");
      
      if (saved) {
        try {
          const currentReport = JSON.parse(saved);
          setReport(currentReport);
        } catch (e) {
          console.error("Failed to load saved report", e);
        }
      }

      if (savedHistory) {
        try {
          const history = JSON.parse(savedHistory);
          setReportHistory(Array.isArray(history) ? history : []);
        } catch (e) {
          console.error("Failed to load report history", e);
        }
      }

      // Load available models
      try {
        const models = await fetchAvailableModels();
        setAvailableModels(models);
        // Set default to first available model
        setSelectedModel(models[0]);
      } catch (e) {
        console.error("Failed to load available models", e);
        // Keep default models
      } finally {
        setLoadingModels(false);
      }
    };

    loadData();
  }, []);

  const handleGenerate = async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetchLLMAnalysis(user, selectedModel);
      
      // Update current report
      setReport(response);
      localStorage.setItem("rocketfi_last_report", JSON.stringify(response));
      
      // Update history
      const newHistory = [response, ...reportHistory.filter(r => r.created !== response.created)].slice(0, 10); // Keep last 10 reports
      setReportHistory(newHistory);
      localStorage.setItem("rocketfi_report_history", JSON.stringify(newHistory));
      
      // Expand the new report by default
      setExpandedReport(response.created.toString());
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
                <div className="flex items-center gap-2 mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    AI Model
                  </label>
                  <div className="group relative">
                    <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                      Try different models to get diverse financial perspectives and "second opinions"
                    </div>
                  </div>
                </div>
                {loadingModels ? (
                  <div className="w-full rounded-md border-gray-300 shadow-sm border p-2 text-sm text-gray-500">
                    Loading available models...
                  </div>
                ) : (
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2 text-sm"
                  >
                    {availableModels.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="bg-blue-50 p-3 rounded-md text-xs text-blue-800">
                <p className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Privacy Note:</strong> Clicking "Start AI Analysis"
                    will send anonymized financial aggregates to OpenRouter.ai.
                    No name or exact street address is sent. You can expand the
                    AI Prompt section below to see exactly what data is being
                    shared with the model before generation.
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
        <div className="lg:col-span-3 space-y-6">
          {/* Current Report - Always Expanded */}
          {report ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50">
                <div className="flex items-center gap-2">
                  <FileText className="text-purple-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Latest Report
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
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-6">
                        <table className="w-full border-collapse bg-white border border-gray-200 rounded-lg shadow-sm">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                        {children}
                      </thead>
                    ),
                    th: ({ children }) => (
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide border-b-2 border-purple-800">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100">
                        {children}
                      </td>
                    ),
                    tbody: ({ children }) => (
                      <tbody className="divide-y divide-gray-100">
                        {children}
                      </tbody>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-3 border-purple-600">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4 pb-2 border-b-2 border-purple-400">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3 pl-4 border-l-4 border-purple-500">
                        {children}
                      </h3>
                    ),
                    h4: ({ children }) => (
                      <h4 className="text-lg font-semibold text-gray-900 mt-5 mb-2">
                        {children}
                      </h4>
                    ),
                    p: ({ children }) => (
                      <p className="mb-4 leading-7 text-gray-700">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-4 list-disc list-inside space-y-1">
                        {children}
                      </ul>
                    ),
                    li: ({ children }) => (
                      <li className="text-gray-700 leading-6">
                        {children}
                      </li>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-purple-500 pl-6 py-2 bg-gray-50 rounded-r-lg italic text-gray-600 my-6">
                        {children}
                      </blockquote>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-gray-900">
                        {children}
                      </strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic text-gray-600">
                        {children}
                      </em>
                    ),
                    code: ({ children }) => (
                      <code className="bg-gray-100 text-red-600 px-2 py-1 rounded text-sm font-mono">
                        {children}
                      </code>
                    ),
                  }}
                >
                  {report.content}
                </ReactMarkdown>
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

          {/* Report History - Accordion Style */}
          {reportHistory.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Previous Reports</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {reportHistory.length} previous report{reportHistory.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="divide-y divide-gray-100">
                {reportHistory.map((historyReport, index) => {
                  const isExpanded = expandedReport === historyReport.created.toString();
                  return (
                    <div key={historyReport.created}>
                      <button
                        onClick={() => setExpandedReport(
                          isExpanded ? null : historyReport.created.toString()
                        )}
                        className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-gray-900">
                                {index + 1}.
                              </span>
                              <span className="text-xs text-gray-500">
                                {historyReport.model}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(historyReport.created).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              {historyReport.usage?.total_tokens || 0} tokens
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </button>
                      
                      {isExpanded && (
                        <div className="px-4 pb-4">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="prose prose-purple max-w-none text-sm text-gray-700">
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  table: ({ children }) => (
                                    <div className="overflow-x-auto my-4">
                                      <table className="w-full border-collapse bg-white border border-gray-200 rounded-lg shadow-sm">
                                        {children}
                                      </table>
                                    </div>
                                  ),
                                  thead: ({ children }) => (
                                    <thead className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                                      {children}
                                    </thead>
                                  ),
                                  th: ({ children }) => (
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide border-b-2 border-purple-800">
                                      {children}
                                    </th>
                                  ),
                                  td: ({ children }) => (
                                    <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100">
                                      {children}
                                    </td>
                                  ),
                                  tbody: ({ children }) => (
                                    <tbody className="divide-y divide-gray-100">
                                      {children}
                                    </tbody>
                                  ),
                                  h1: ({ children }) => (
                                    <h1 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-purple-600">
                                      {children}
                                    </h1>
                                  ),
                                  h2: ({ children }) => (
                                    <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3 pb-1 border-b border-purple-400">
                                      {children}
                                    </h2>
                                  ),
                                  h3: ({ children }) => (
                                    <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2 pl-3 border-l-3 border-purple-500">
                                      {children}
                                    </h3>
                                  ),
                                  h4: ({ children }) => (
                                    <h4 className="text-base font-semibold text-gray-900 mt-3 mb-2">
                                      {children}
                                    </h4>
                                  ),
                                  p: ({ children }) => (
                                    <p className="mb-3 leading-6 text-gray-700">
                                      {children}
                                    </p>
                                  ),
                                  ul: ({ children }) => (
                                    <ul className="mb-3 list-disc list-inside space-y-1">
                                      {children}
                                    </ul>
                                  ),
                                  li: ({ children }) => (
                                    <li className="text-gray-700 leading-5 text-sm">
                                      {children}
                                    </li>
                                  ),
                                  blockquote: ({ children }) => (
                                    <blockquote className="border-l-3 border-purple-500 pl-4 py-2 bg-gray-50 rounded-r-lg italic text-gray-600 my-4">
                                      {children}
                                    </blockquote>
                                  ),
                                  strong: ({ children }) => (
                                    <strong className="font-semibold text-gray-900">
                                      {children}
                                    </strong>
                                  ),
                                  em: ({ children }) => (
                                    <em className="italic text-gray-600">
                                      {children}
                                    </em>
                                  ),
                                  code: ({ children }) => (
                                    <code className="bg-gray-100 text-red-600 px-1 py-0.5 rounded text-xs font-mono">
                                      {children}
                                    </code>
                                  ),
                                }}
                              >
                                {historyReport.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Assistants Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional AI Tools</h3>
              <p className="text-sm text-gray-600 mb-6">
                Access specialized AI assistants for estate planning and general financial guidance.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Beneficiary Audit Assistant */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Beneficiary Audit</h4>
                      <p className="text-sm text-gray-600">Estate planning & beneficiary review</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowBeneficiaryAssistant(!showBeneficiaryAssistant)}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    {showBeneficiaryAssistant ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {showBeneficiaryAssistant ? 'Hide' : 'Generate'} Beneficiary Audit
                  </button>
                </div>

                {/* Ask the Planner Chat */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Ask the Planner</h4>
                      <p className="text-sm text-gray-600">Free-form financial questions</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowChatAssistant(!showChatAssistant)}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    {showChatAssistant ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {showChatAssistant ? 'Hide' : 'Start'} Chat
                  </button>
                </div>
              </div>
            </div>

            {/* AI Assistant Components */}
            {showBeneficiaryAssistant && (
              <AIAssistant
                mode="beneficiary"
                onClose={() => setShowBeneficiaryAssistant(false)}
              />
            )}

            {showChatAssistant && (
              <AIAssistant
                mode="chat"
                onClose={() => setShowChatAssistant(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

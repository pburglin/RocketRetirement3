import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Download,
} from "lucide-react";

export const ReportsInsightsPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedModel, setSelectedModel] = useState(FREE_MODELS[0]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<LLMResponse | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [error, setError] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);

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

  const getPromptPreview = () => {
    if (!user) return "";
    const { systemPrompt, userMessage } = constructPrompt(user);
    return `### SYSTEM:\n${systemPrompt}\n\n### USER:\n${userMessage}`;
  };

  const handleExportPDF = async () => {
    if (!report) return;

    setExporting(true);
    try {
      const element = document.getElementById("report-content");
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        allowTaint: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      // PDF page dimensions (A4)
      const pdfWidth = 210;
      const pdfHeight = 295;

      // Margins (20mm on each side)
      const margin = 20;
      const imgWidth = pdfWidth - margin * 2; // Content width with margins
      const pageHeight = pdfHeight - margin * 2; // Content height with margins

      // Calculate scaled image dimensions
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = margin; // Start with top margin

      // Add first page with image
      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const timestamp = new Date().toISOString().split("T")[0];
      pdf.save(`rocketfi_report_${timestamp}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setExporting(false);
      setShowExportModal(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            AI Insights & Reports
          </h1>
        </div>
        {report && (
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            <Download size={16} /> Export
          </button>
        )}
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
              <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-purple-50 to-blue-50">
                <div className="flex items-center gap-2">
                  <FileText className="text-purple-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Professional Financial Analysis Report
                  </h2>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-500">
                    Generated by {report.model} on{" "}
                    {new Date(report.created).toLocaleString()}
                  </span>
                  <button
                    onClick={handleGenerate}
                    className="text-gray-400 hover:text-purple-600 transition-colors"
                    title="Regenerate Report"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              <div className="p-8">
                <div
                  id="report-content"
                  className="report-content prose prose-slate max-w-none"
                >
                  <style>{`
                    .report-content {
                      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                      line-height: 1.7;
                      color: #374151;
                    }
                    
                    .report-content h1 {
                      font-size: 2.25rem;
                      font-weight: 700;
                      color: #111827;
                      margin: 0 0 2rem 0;
                      padding-bottom: 1rem;
                      border-bottom: 3px solid #7c3aed;
                    }
                    
                    .report-content h2 {
                      font-size: 1.875rem;
                      font-weight: 600;
                      color: #1f2937;
                      margin: 3rem 0 1.5rem 0;
                      padding-bottom: 0.5rem;
                      border-bottom: 2px solid #e5e7eb;
                    }
                    
                    .report-content h3 {
                      font-size: 1.5rem;
                      font-weight: 600;
                      color: #374151;
                      margin: 2.5rem 0 1rem 0;
                    }
                    
                    .report-content p {
                      margin-bottom: 1.25rem;
                      font-size: 1rem;
                      text-align: justify;
                    }
                    
                    .report-content strong {
                      font-weight: 600;
                      color: #111827;
                    }
                    
                    .report-content em {
                      font-style: italic;
                      color: #4b5563;
                    }
                    
                    .report-content ul {
                      margin: 1.5rem 0;
                      padding-left: 0;
                    }
                    
                    .report-content ul li {
                      margin-bottom: 0.75rem;
                      padding-left: 1.5rem;
                      position: relative;
                      list-style: none;
                    }
                    
                    .report-content ul li::before {
                      content: "•";
                      color: #7c3aed;
                      font-weight: bold;
                      position: absolute;
                      left: 0;
                    }
                    
                    .report-content ol {
                      margin: 1.5rem 0;
                      padding-left: 0;
                    }
                    
                    .report-content ol li {
                      margin-bottom: 0.75rem;
                      padding-left: 1.5rem;
                      list-style: none;
                      counter-increment: item;
                      position: relative;
                    }
                    
                    .report-content ol li::before {
                      content: counter(item) ".";
                      color: #7c3aed;
                      font-weight: 600;
                      position: absolute;
                      left: 0;
                    }
                    
                    .report-content table {
                      width: 100%;
                      border-collapse: collapse;
                      margin: 2rem 0;
                      font-size: 0.9rem;
                      background: #f9fafb;
                      border-radius: 8px;
                      overflow: hidden;
                      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    }
                    
                    .report-content th {
                      background: #7c3aed;
                      color: white;
                      padding: 1rem;
                      text-align: left;
                      font-weight: 600;
                      font-size: 0.9rem;
                    }
                    
                    .report-content td {
                      padding: 0.875rem 1rem;
                      border-bottom: 1px solid #e5e7eb;
                      vertical-align: top;
                    }
                    
                    .report-content tr:last-child td {
                      border-bottom: none;
                    }
                    
                    .report-content tr:nth-child(even) {
                      background: #f3f4f6;
                    }
                  `}</style>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ node, ...props }) => (
                        <h1
                          className="text-3xl font-bold text-gray-900 mb-8 pb-4 border-b-3 border-purple-600"
                          {...props}
                        />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2
                          className="text-2xl font-semibold text-gray-800 mt-8 mb-4 pb-2 border-b-2 border-gray-300"
                          {...props}
                        />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3
                          className="text-xl font-semibold text-gray-700 mt-6 mb-3"
                          {...props}
                        />
                      ),
                      p: ({ node, ...props }) => (
                        <p
                          className="mb-4 text-gray-700 leading-relaxed"
                          {...props}
                        />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong
                          className="font-semibold text-gray-900"
                          {...props}
                        />
                      ),
                      em: ({ node, ...props }) => (
                        <em className="italic text-gray-600" {...props} />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul className="mb-6 space-y-2" {...props} />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol className="mb-6 space-y-2" {...props} />
                      ),
                      li: ({ node, ...props }) => (
                        <li
                          className="text-gray-700 leading-relaxed"
                          {...props}
                        />
                      ),
                      table: ({ node, ...props }) => (
                        <div className="overflow-x-auto mb-6">
                          <table
                            className="min-w-full border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                            {...props}
                          />
                        </div>
                      ),
                      thead: ({ node, ...props }) => (
                        <thead
                          className="bg-purple-600 text-white"
                          {...props}
                        />
                      ),
                      th: ({ node, ...props }) => (
                        <th
                          className="px-4 py-3 text-left font-semibold text-sm"
                          {...props}
                        />
                      ),
                      td: ({ node, ...props }) => (
                        <td
                          className="px-4 py-3 text-sm border-b border-gray-100"
                          {...props}
                        />
                      ),
                      tr: ({ node, ...props }) => (
                        <tr
                          className="hover:bg-gray-50 transition-colors"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {report.content}
                  </ReactMarkdown>
                </div>
              </div>

              {report.usage && (
                <div className="bg-gray-50 p-3 text-center text-xs text-gray-400 border-t border-gray-100">
                  <div className="flex items-center justify-center gap-4">
                    <span>Tokens Used: {report.usage.total_tokens}</span>
                    <span>Prompt: {report.usage.prompt_tokens}</span>
                    <span>Completion: {report.usage.completion_tokens}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 bg-white rounded-lg border-2 border-dashed border-gray-300 text-gray-400 min-h-[400px]">
              <Brain className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">No report generated yet.</p>
              <p className="text-sm mt-2 text-center">
                Configure the model and click "Start AI Analysis" to begin.
              </p>
              <div className="mt-6 flex items-center gap-8 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Professional Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Actionable Insights</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Expert Recommendations</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">Export Report</h3>
            <p className="text-sm text-gray-600 mb-6">
              Export your financial analysis report as a PDF document.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 disabled:opacity-50"
              >
                {exporting ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span>Export as PDF</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                disabled={exporting}
                className="w-full py-2 text-gray-500 hover:text-gray-700 mt-2 disabled:opacity-50"
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

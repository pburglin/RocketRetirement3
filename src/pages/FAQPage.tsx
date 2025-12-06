import React from "react";
import { HelpCircle } from "lucide-react";

export const FAQPage: React.FC = () => {

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <HelpCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900">
            Frequently Asked Questions
          </h1>
        </div>

        <div className="space-y-8">
          {/* Monetization */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              How do you monetize this app?
            </h3>
            <p className="text-gray-600">
              Clarification: Rocket Fi does not sell your user information to
              3rd parties. We do not store user data; the data is stored in
              encrypted form in your local browser. The app is not yet
              monetized, but if web traffic demonstrates enough interest and
              demand, we may consider a subscription model to help maintain and
              improve the service.
            </p>
          </div>

          {/* How does it work? */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              How does it work securely?
            </h3>
            <p className="text-gray-600 mb-4">
              Your data never leaves your device unencrypted (except when you
              explicitly send anonymized data to the AI agent). The diagram
              below illustrates the local-first architecture:
            </p>
            <div className="flex justify-center bg-gray-50 p-4 rounded border border-gray-200 overflow-x-auto">
              <img 
                src="/rocketfi-local-encryption-zero-knowledge.png" 
                alt="RocketFi Local Encryption Zero Knowledge Architecture"
                className="max-w-full h-auto rounded"
              />
            </div>
          </div>

          {/* AI Integration */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              How does the AI Analysis work?
            </h3>
            <p className="text-gray-600 mb-4">
              We integrate with OpenRouter.ai to access powerful LLMs. When you
              request an analysis, we strip all PII (names, specific IDs) and
              send only the financial aggregate numbers and anonymized context.
            </p>
            <div className="mermaid flex justify-center bg-gray-50 p-4 rounded border border-gray-200 overflow-x-auto">
              {`
                sequenceDiagram
                  participant B as Browser (Rocket Fi)
                  participant O as OpenRouter.ai
                  participant L as LLM (e.g., Gemma/Llama)
                  
                  B->>B: Anonymize Financial Data
                  B->>O: Send Prompt (HTTPS)
                  O->>L: Forward Request
                  L-->>O: Generate Recommendations
                  O-->>B: Return Analysis
                  B->>B: Display to User
              `}
            </div>
          </div>

          {/* Accuracy Disclaimer */}
          <div className="bg-white shadow rounded-lg p-6 border-l-4 border-blue-500">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Is the calculation 100% accurate?
            </h3>
            <p className="text-gray-600">
              Though we try to make it as good as we can, we cannot guarantee
              that the calculations are perfectly accurate. Users should use
              this service as a helpful tool to try different what-if scenarios
              and strategies, but it does not replace professional financial and
              retirement planners.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

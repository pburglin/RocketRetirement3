import React from "react";
import { Lock, ServerOff, Database, EyeOff } from "lucide-react";

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Privacy Policy
        </h1>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-8 space-y-8">
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Database className="text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  1. No Central Database
                </h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Rocket Fi does not have a database or server-side storage to
                keep any of your user data. We cannot see, access, or sell your
                financial information because we simply do not have it.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Lock className="text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  2. Local Encrypted Storage
                </h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Your data is stored locally in your browser's LocalStorage and
                is encrypted using AES encryption with a key that is derived
                from your password. Only you hold the key to decrypt your data.
                If you lose your password, your data is irretrievable.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <ServerOff className="text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  3. Anonymous Metrics
                </h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Rocket Fi may use cookies and collect anonymous usage
                information to service the user and track service usage metrics
                (e.g., page views, error rates). No personally identifiable
                financial data is included in these metrics.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <EyeOff className="text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  4. Minimization of Sensitive Data
                </h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                The app was designed to minimize or avoid the request of
                sensitive data such as any personally identifiable information
                (PII).
              </p>
              <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p className="text-sm text-yellow-700">
                  <strong>Recommendation:</strong> Even with all these controls,
                  users are strongly encouraged to not include specific
                  sensitive data. For example, enter nicknames like "My Bank"
                  instead of the actual bank's name, and use "1111" instead of
                  real account numbers.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

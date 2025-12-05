import React from "react";
import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Header } from "./components/Header";
import { LandingPage } from "./pages/LandingPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { FAQPage } from "./pages/FAQPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { UserProfilePage } from "./pages/UserProfilePage";
import { IncomePage } from "./pages/IncomePage";
import { ExpensesPage } from "./pages/ExpensesPage";
import { AssetsPage } from "./pages/AssetsPage";
import { LiabilitiesPage } from "./pages/LiabilitiesPage";
import { InvestmentsPage } from "./pages/InvestmentsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { RetirementGoalsPage } from "./pages/RetirementGoalsPage";
import { SimulationDashboard } from "./pages/SimulationDashboard";
import { ReportsInsightsPage } from "./pages/ReportsInsightsPage";
import { useAuth } from "./context/AuthContext";

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({
  children,
}) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Header />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route
                path="/how-it-works"
                element={<Navigate to="/#how-it-works" replace />}
              />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/faq" element={<FAQPage />} />

              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <UserProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Financial Modules */}
              <Route
                path="/income"
                element={
                  <ProtectedRoute>
                    <IncomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/expenses"
                element={
                  <ProtectedRoute>
                    <ExpensesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assets"
                element={
                  <ProtectedRoute>
                    <AssetsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/liabilities"
                element={
                  <ProtectedRoute>
                    <LiabilitiesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/investments"
                element={
                  <ProtectedRoute>
                    <InvestmentsPage />
                  </ProtectedRoute>
                }
              />

              {/* Planning & Simulation */}
              <Route
                path="/goals"
                element={
                  <ProtectedRoute>
                    <RetirementGoalsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/simulations"
                element={
                  <ProtectedRoute>
                    <SimulationDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <ReportsInsightsPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Simple Footer */}
          <footer className="bg-white border-t border-gray-200 py-8">
            <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
              <p>
                &copy; {new Date().getFullYear()} Rocket Fi. All rights
                reserved.
              </p>
              <div className="mt-2 space-x-4">
                <a href="/privacy" className="hover:text-gray-900">
                  Privacy Policy
                </a>
                <a href="/faq" className="hover:text-gray-900">
                  FAQ
                </a>
              </div>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

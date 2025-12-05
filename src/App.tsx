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
import { useAuth } from "./context/AuthContext";
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  DollarSign,
  CreditCard,
  Landmark,
} from "lucide-react";

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

// Updated Dashboard to link to new modules
const Dashboard = () => (
  <div className="max-w-7xl mx-auto p-8">
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
      <a
        href="/profile"
        className="text-blue-600 hover:text-blue-800 font-medium"
      >
        Manage Profile
      </a>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <DashboardCard
        title="Income"
        path="/income"
        icon={<DollarSign className="text-green-600" />}
      />
      <DashboardCard
        title="Expenses"
        path="/expenses"
        icon={<CreditCard className="text-red-600" />}
      />
      <DashboardCard
        title="Assets"
        path="/assets"
        icon={<Landmark className="text-blue-600" />}
      />
      <DashboardCard
        title="Liabilities"
        path="/liabilities"
        icon={<TrendingUp className="text-orange-600" />}
      />
      <DashboardCard
        title="Investments"
        path="/investments"
        icon={<Wallet className="text-purple-600" />}
      />
    </div>
  </div>
);

const DashboardCard = ({
  title,
  path,
  icon,
}: {
  title: string;
  path: string;
  icon: React.ReactNode;
}) => (
  <a
    href={path}
    className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 group"
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      <div className="p-2 bg-gray-50 rounded-full group-hover:bg-gray-100 transition-colors">
        {icon}
      </div>
    </div>
    <p className="text-gray-500 text-sm">Manage your {title.toLowerCase()}</p>
  </a>
);

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
                    <Dashboard />
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

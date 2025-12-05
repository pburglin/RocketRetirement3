import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Header } from "./components/Header";
import { LandingPage } from "./pages/LandingPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { FAQPage } from "./pages/FAQPage";

// Placeholder components for future implementation
const Dashboard = () => (
  <div className="max-w-7xl mx-auto p-8">
    <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
    <p>Coming soon...</p>
  </div>
);

const Login = () => (
  <div className="max-w-md mx-auto mt-20 p-8 bg-white shadow rounded">
    <h1 className="text-2xl font-bold mb-4">Login</h1>
    <p className="text-gray-600">Login form placeholder</p>
  </div>
);

const Signup = () => (
  <div className="max-w-md mx-auto mt-20 p-8 bg-white shadow rounded">
    <h1 className="text-2xl font-bold mb-4">Sign Up</h1>
    <p className="text-gray-600">Sign up form placeholder</p>
  </div>
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
                element={<Navigate to="/\#how-it-works" replace />}
              />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/faq" element={<FAQPage />} />

              {/* Auth Routes (Placeholders) */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={<Dashboard />} />

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

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut } from "lucide-react";

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <img 
                src="/logo-img.png" 
                alt="Rocket Fi Logo" 
                className="h-14 w-14 object-contain"
              />
              <span className="text-xl font-bold text-gray-900">Rocket Fi</span>
            </Link>
            <nav className="hidden md:ml-8 md:flex md:space-x-8">
              <Link
                to="/how-it-works"
                className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                How It Works
              </Link>
              {user && (
                <>
                  <Link
                    to="/dashboard"
                    className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/goals"
                    className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                  >
                    Goals
                  </Link>
                  <Link
                    to="/simulations"
                    className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                  >
                    Simulations
                  </Link>
                  <Link
                    to="/reports"
                    className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                  >
                    Insights
                  </Link>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
                >
                  Sign Up Free
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

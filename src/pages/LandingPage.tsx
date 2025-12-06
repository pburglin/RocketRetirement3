import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Shield,
  Cpu,
  LineChart,
  TrendingUp,
} from "lucide-react";
import { WebGLBackground } from "../components/WebGLBackground";

const SCREENSHOTS = [
  "/financial-dashboard.png",
  "/goals.png",
  "/simulations.png",
  "/ai-reports.png",
];

export const LandingPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const openModal = (index: number) => {
    setCurrentImageIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const nextImage = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % SCREENSHOTS.length);
  }, []);

  const prevImage = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex(
      (prev) => (prev - 1 + SCREENSHOTS.length) % SCREENSHOTS.length,
    );
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, closeModal, nextImage, prevImage]);

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 text-white">
        {/* WebGL Background Effects */}
        <WebGLBackground />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Secure, AI-Powered <br className="hidden md:block" />
            <span className="text-blue-400">Retirement Planning</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-10">
            Plan your financial future with privacy-first tools. Your data stays
            in your browser, encrypted and secure.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/signup"
              className="px-8 py-4 bg-blue-600 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors"
            >
              Start Planning for Free
            </Link>
            <Link
              to="/how-it-works"
              className="px-8 py-4 bg-slate-800 rounded-lg font-bold text-lg hover:bg-slate-700 transition-colors"
            >
              Learn How It Works
            </Link>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">
              How Rocket Fi Works
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Simple, secure, and intelligent financial planning.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center p-6 bg-white rounded-xl shadow-sm">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4">1. Create Your Profile</h3>
              <p className="text-gray-600">
                Enter your financial details. All data is stored locally in your
                browser and encrypted with your key. No database, no tracking.
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-xl shadow-sm">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Cpu className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4">2. Gain New Insights</h3>
              <p className="text-gray-600">
                Use our AI agents to analyze your portfolio and define your
                strategy. Get personalized recommendations for tax optimization
                and asset allocation.
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-xl shadow-sm">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4">3. Simulate & Grow</h3>
              <p className="text-gray-600">
                Run Monte Carlo simulations to stress-test your retirement plan
                against market volatility and inflation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* System in Action Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">
              System in Action
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Click on any screenshot to explore the interface.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SCREENSHOTS.map((src, index) => (
              <div
                key={index}
                className="cursor-pointer group relative overflow-hidden rounded-lg shadow-md border border-gray-200 aspect-[4/3]"
                onClick={() => openModal(index)}
              >
                <img
                  src={src}
                  alt={`Screenshot ${index + 1}`}
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 bg-white px-3 py-1 rounded-full text-xs font-bold text-gray-900 shadow">
                    View
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison / Value Section */}
      <section className="py-20 bg-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">
            Professional Grade Planning, Accessible to Everyone
          </h2>
          <div className="bg-blue-800 rounded-2xl p-8 shadow-xl border border-blue-700">
            <LineChart className="w-12 h-12 mx-auto mb-4 text-blue-300" />
            <p className="text-xl md:text-2xl font-medium mb-6">
              "Financial advisors may cost thousands of dollars, typically $3K
              to $5K. Rocket Fi cannot replace one, but it will give you
              actionable advice for a fraction of that."
            </p>
            <p className="text-blue-200">
              Get strategies on how to gradually move from current investment
              allocation towards one with a more optimized tax allocation and
              improved risk reward balance.
            </p>
          </div>
        </div>
      </section>

      {/* Image Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-[90vw] max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={SCREENSHOTS[currentImageIndex]}
              alt={`Screenshot ${currentImageIndex + 1}`}
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl"
            />

            {/* Close Button */}
            <button
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              onClick={closeModal}
            >
              <X size={32} />
            </button>

            {/* Navigation Buttons */}
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-gray-800 bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all"
              onClick={prevImage}
            >
              <ChevronLeft size={32} />
            </button>
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-800 bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all"
              onClick={nextImage}
            >
              <ChevronRight size={32} />
            </button>

            <div className="mt-4 text-white font-medium">
              {currentImageIndex + 1} / {SCREENSHOTS.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

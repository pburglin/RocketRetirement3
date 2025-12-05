import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Placeholder components
const LandingPage = () => (
  <div className="p-8 text-center text-2xl font-bold">
    Rocket Fi - Landing Page (TODO)
  </div>
);
const Dashboard = () => (
  <div className="p-8 text-center text-2xl font-bold">
    Rocket Fi - Dashboard (TODO)
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* We will implement proper Protected Routes later.
For now, just mapping the basic structure.
*/}
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

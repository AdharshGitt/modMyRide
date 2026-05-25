import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import TuningPage from "./pages/TuningPage.jsx";
import AIAdvisor from "./pages/AIAdvisorPage.jsx";
import SavedProfilesPage from "./pages/SavedProfilesPage.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/tuning" element={<TuningPage />} />
        <Route path="/ai-advisor" element={<AIAdvisor />} />
        <Route path="/builds" element={<SavedProfilesPage />} />
        <Route path="/profiles" element={<Navigate to="/builds" replace />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

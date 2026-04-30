import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SessionActivityGuard } from "./components/SessionActivityGuard";
import { useAuth } from "./auth/AuthProvider";
import { AboutPage } from "./pages/AboutPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { NotesPage } from "./pages/NotesPage";
import { QuizPage } from "./pages/QuizPage";
import { QuizSessionPage } from "./pages/QuizSessionPage";
import { SimulationPage } from "./pages/SimulationPage";
import { SignupPage } from "./pages/SignupPage";

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-[1200px] items-center justify-center px-4 py-10 text-center sm:px-6 lg:max-w-[1400px] lg:px-8 2xl:max-w-[1600px]">
        <p className="text-sm text-ds-secondary">Loading...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Navbar />
      <SessionActivityGuard />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<Navigate to="/simulation" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/simulation" element={<ProtectedRoute><SimulationPage /></ProtectedRoute>} />
        <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
        <Route path="/test" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
        <Route path="/test/session" element={<ProtectedRoute><QuizSessionPage /></ProtectedRoute>} />
        <Route path="/about" element={<ProtectedRoute><AboutPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

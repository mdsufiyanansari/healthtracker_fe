
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import FitnessAssessment from "./pages/FitnessAssessment.jsx";
import RunningRoutes from "./pages/RunningRoutes.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ActivityTracker from "./pages/ActivityTracker.jsx";
import AICoach from "./pages/AICoach.jsx";

function Placeholder({ title }) {
  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-gray-600">
        This module will be connected in the next development phase.
      </p>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/assessment" element={<FitnessAssessment />} />
          <Route path="/activity" element={<ActivityTracker />} />
          <Route
            path="/routes"
            element={<Placeholder title="Running Routes" />}
          />
          <Route path="/running-routes" element={<RunningRoutes />} />
          <Route path="/coach" element={<AICoach />} />
        </Route>

        {/* 404 route */}
        <Route
          path="*"
          element={<Placeholder title="Page not found" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

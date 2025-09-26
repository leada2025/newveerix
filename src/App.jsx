import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./Pages/Login";
import SignupPage from "./Pages/SignupPage";
import CustomerRoutes from "./Routes/CustomerRoutes";
import AdminRoutes from "./Routes/AdminRoutes";
import AppLayout from "./Components/AppLayout"; // customer layout

// 🔹 ProtectedRoute Component
const ProtectedRoute = ({ children, role }) => {
  const authToken = localStorage.getItem("authToken");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!authToken) return <Navigate to="/" replace />;
  if (role && user?.role !== role) return <Navigate to="/" replace />;

  return children;
};

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Customer protected routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute role="customer">
            <AppLayout>
              <CustomerRoutes />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin protected routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute role="admin">
            <AdminRoutes />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

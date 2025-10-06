import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./Pages/Login";
import SignupPage from "./Pages/SignupPage";
import CustomerRoutes from "./Routes/CustomerRoutes";
import AdminRoutes from "./Routes/AdminRoutes";
import AppLayout from "./Components/AppLayout";
import WelcomePage from "./Pages/Welcome";

// 🔹 Dynamic ProtectedRoute
const ProtectedRoute = ({ children, allowCustomer = false }) => {
  const authToken = localStorage.getItem("authToken");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Not logged in → redirect to login
  if (!authToken) return <Navigate to="/login" replace />;

  const role = user.role?.toLowerCase?.();

  // Customer allowed?
  if (allowCustomer && role === "customer") return children;

  // All other staff/admin roles allowed (admin, manager, designer, etc.)
  if (!allowCustomer && role !== "customer") return children;

  // If role doesn’t match the route type → redirect safely
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Customer welcome page */}
      <Route
        path="/welcome"
        element={
          <ProtectedRoute allowCustomer>
            <WelcomePage />
          </ProtectedRoute>
        }
      />

      {/* Customer protected routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute allowCustomer>
            <AppLayout>
              <CustomerRoutes />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin/staff protected routes (admin, manager, designer, etc.) */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
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

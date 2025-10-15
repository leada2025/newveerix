// App.jsx
import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./Pages/Login";
import SignupPage from "./Pages/SignupPage";
import CustomerRoutes from "./Routes/CustomerRoutes";
import AdminRoutes from "./Routes/AdminRoutes";
import AppLayout from "./Components/AppLayout";
import WelcomePage from "./Pages/Welcome";
import { connectSocket, disconnectSocket } from "./Components/Socket"; // ✅ import this
import VeerixOrdersLanding from "./Pages/VeerixLandingpage";

const ProtectedRoute = ({ children, allowCustomer = false }) => {
  const authToken = localStorage.getItem("authToken");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!authToken) return <Navigate to="/login" replace />;

  const role = user.role?.toLowerCase?.();

  if (allowCustomer && role === "customer") return children;
  if (!allowCustomer && role !== "customer") return children;

  return <Navigate to="/login" replace />;
};

function App() {
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (user?._id) {
      console.log("🔌 Connecting socket for:", user.role, user._id);
      connectSocket(user); // ✅ connect once when app loads
    }

    return () => {
      disconnectSocket(); // cleanup on logout / unmount
    };
  }, []);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<VeerixOrdersLanding />} />
      <Route path="/signup" element={<SignupPage />} />
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

      {/* Admin protected routes */}
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

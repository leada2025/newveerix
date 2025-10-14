import React from "react";
import { Routes, Route } from "react-router-dom";
import CustomerBrandRequests from "../Pages/NewOrder";
import Dashboard from "../Pages/Dashboard";
import ContactSupport from "../Components/ContactSupport";


const CustomerRoutes = () => {
  // Get user directly from localStorage
  const getUserFromStorage = () => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  };

  const user = getUserFromStorage();

  return (
    <>
      <Routes>
        <Route path="orders" element={<CustomerBrandRequests />} />
        <Route path="dashboard" element={<Dashboard />} />
      </Routes>
      {user && user._id && <ContactSupport customerId={user._id} />}
    </>
  );
};

export default CustomerRoutes;
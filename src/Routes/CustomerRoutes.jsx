import React from "react";
import { Routes, Route } from "react-router-dom";
 // customer dashboard
import CustomerBrandRequests from "../Pages/NewOrder";
import Dashboard from "../Pages/Dashboard";
const CustomerRoutes = () => {
  return (
    <Routes>
      <Route path="orders" element={<CustomerBrandRequests />} />
      <Route path="dashboard" element={<Dashboard />} />
      {/* Add more customer routes here */}
    </Routes>
  );
};

export default CustomerRoutes;

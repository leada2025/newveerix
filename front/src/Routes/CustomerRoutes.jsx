import React from "react";
import { Routes, Route } from "react-router-dom";
 // customer dashboard
import CustomerBrandRequests from "../Pages/NewOrder";
import Dashboard from "../Pages/Dashboard";
import ContactSupport from "../Components/ContactSupport";
const CustomerRoutes = () => {
  return (
    <>
    <Routes>
      <Route path="orders" element={<CustomerBrandRequests />} />
      <Route path="dashboard" element={<Dashboard />} />
      {/* Add more customer routes here */}
    </Routes>
    <ContactSupport/>
    </>
  );
};

export default CustomerRoutes;

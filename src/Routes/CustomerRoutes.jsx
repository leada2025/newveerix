import React from "react";
import { Routes, Route } from "react-router-dom";
 // customer dashboard
import CustomerBrandRequests from "../Pages/NewOrder";

const CustomerRoutes = () => {
  return (
    <Routes>
      <Route
        path="/orders"
        element={<CustomerBrandRequests />}
      />
      
      {/* Add more customer routes here */}
    </Routes>
  );
};

export default CustomerRoutes;

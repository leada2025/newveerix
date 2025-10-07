import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "../admin/Componenets/AdminLayout";
import AdminMoleculePanel from "../admin/Pages/AdminMoleculePanel";
import AdminQuoteModal from "../admin/Componenets/Adminquote";
import AdminDashboard from "../admin/Pages/Dashboard";
import RoleManager from "../admin/Pages/RoleManagement";
import UserAccess from "../admin/Pages/UserAccess";
import CustomerManagement from "../admin/Pages/CustomerManagement";



const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        {/* Nested admin pages */}
     
<Route path="/molecule" element={<AdminMoleculePanel />}></Route>
<Route path="/quote" element={<AdminQuoteModal />}></Route>
<Route path="/dashboard" element={<AdminDashboard />}></Route>
  <Route path="/role" element={<RoleManager />}></Route> 
   <Route path="/useraccess" element={<UserAccess />}></Route> 
   <Route path="/customer" element={<CustomerManagement />}></Route>         
      </Route>
    </Routes>
  );
};

export default AdminRoutes;

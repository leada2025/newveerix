import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "../admin/Componenets/AdminLayout";
import AdminMoleculePanel from "../admin/Pages/AdminMoleculePanel";
import AdminQuoteModal from "../admin/Componenets/Adminquote";



const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        {/* Nested admin pages */}
     
<Route path="/molecule" element={<AdminMoleculePanel />}></Route>
<Route path="/quote" element={<AdminQuoteModal />}></Route>
       
      </Route>
    </Routes>
  );
};

export default AdminRoutes;

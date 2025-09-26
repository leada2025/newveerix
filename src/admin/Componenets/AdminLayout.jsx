// src/layouts/AdminLayout.jsx
import React from "react";
import Sidebar from "./AdminSidebar";
import Navbar from "./AdminNavbar";
import { Outlet } from "react-router-dom";

const AdminLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1">
        {/* Top Navbar */}
        <Navbar />

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4">
          <Outlet /> {/* This renders nested admin routes */}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

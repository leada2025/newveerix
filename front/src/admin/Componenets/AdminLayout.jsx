// src/layouts/AdminLayout.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "./AdminSidebar";
import Navbar from "./AdminNavbar";
import { Outlet } from "react-router-dom";

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Auto-close sidebars on mobile
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
        setIsSubmenuOpen(false);
      } else {
        setIsSidebarOpen(true);
        setIsSubmenuOpen(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleToggleSubmenu = () => {
    setIsSubmenuOpen(!isSubmenuOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar with controlled state */}
      <div className={`
        ${isSidebarOpen ? 'block' : 'hidden'} 
        lg:block transition-all duration-300
      `}>
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0"> {/* min-w-0 prevents overflow */}
        {/* Top Navbar with controls */}
        <Navbar 
          onToggleSidebar={handleToggleSidebar}
          onToggleSubmenu={handleToggleSubmenu}
          isSidebarOpen={isSidebarOpen}
          isSubmenuOpen={isSubmenuOpen}
        />

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 bg-gray-50">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {(isSidebarOpen || isSubmenuOpen) && isMobile && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={() => {
            setIsSidebarOpen(false);
            setIsSubmenuOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default AdminLayout;
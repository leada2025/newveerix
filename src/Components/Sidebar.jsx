import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Gauge,
  ShoppingCart,
  FileText,
  PackageCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import veerixLogo from "../assets/v_logo.png"; 

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  // Veerix theme
  const sidebarBg = "bg-white";
  const sidebarText = "text-gray-700";

  // Example nav items
  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: <Gauge size={20} /> },
    { label: "New Order", path: "/orders", icon: <ShoppingCart size={20} /> },
    // { label: "Trademark", path: "/trademark", icon: <FileText size={20} /> },
    // { label: "Packing Status", path: "/packing/status", icon: <PackageCheck size={20} /> },
    // { label: "Settings", path: "/settings", icon: <Settings size={20} /> },
  ];

  return (
    <aside
      className={`${sidebarBg} h-screen border-r border-gray-200 transition-all duration-300 ease-in-out ${
        collapsed ? "w-16" : "w-64"
      } shadow-lg flex flex-col`}
    >
      {/* Logo + Collapse Button */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-300">
        <img
          src={veerixLogo}
          alt="Veerix Logo"
          className={`transition-all duration-300 ${
            collapsed ? "h-5 w-7" : "h-12 w-auto"
          }`}
        />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-[#d1383a] transition ml-2"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="mt-4 flex flex-col gap-2 relative flex-1 overflow-auto">
        {navItems.map(({ label, path, icon }) => (
          <NavLink
            key={label}
            to={path}
            title={collapsed ? label : ""}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
              ${isActive ? "bg-[#d1383a] text-white" : sidebarText + " hover:bg-gray-100"}`
            }
          >
            <div className="flex items-center justify-center">{icon}</div>
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="mt-auto px-4 py-6 text-sm text-gray-400 border-t border-gray-300">
          © {new Date().getFullYear()} Veerix
        </div>
      )}
    </aside>
  );
};

export default Sidebar;

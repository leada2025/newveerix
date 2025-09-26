import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiSettings, FiLogOut } from "react-icons/fi";
 // Optional if you want a logo

export default function AdminNavbar() {
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const [role, setRole] = useState(null);
  const settingsRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Static role (optional: can read from localStorage if needed)
  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      setRole(storedUser?.role?.toLowerCase() || "admin"); // default to admin
    } catch (e) {
      setRole("admin");
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setSettingsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Map pathname to title (static)
  const getCurrentPageTitle = () => {
    const pathname = location.pathname.toLowerCase();
    const pageMap = [
      { path: "/admin/packingtrack", label: "Packing Status" },
      { path: "/admin/designs", label: "Packing Designs" },
      { path: "/admin/packing", label: "Packing Approval" },
      { path: "/admin/customer", label: "Customers" },
      { path: "/admin/orders", label: "Order Management" },
      { path: "/admin/molecule", label: "Brand Requests" },
      { path: "/admin/addmolecule", label: "Add Molecule" },
      { path: "/admin/pricing/history", label: "Pricing History" },
      { path: "/admin/users", label: "User Access" },
    ];

    for (const page of pageMap) {
      if (pathname.startsWith(page.path)) return page.label;
    }
    return "Dashboard";
  };

  // Logout (static Veerix)
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("source");
    navigate("/"); // Veerix landing page
  };

  return (
    <header className="h-[80px] border-b flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm bg-[#d1383a] border-[#1C2E4A] text-white">
      {/* Page Title */}
      <h1 className="text-xl font-semibold">{getCurrentPageTitle()}</h1>

      {/* Right Controls */}
      <div className="flex items-center gap-6 relative" ref={settingsRef}>
        {/* Admin Settings Dropdown */}
        {role === "admin" && (
          <>
            <button
              onClick={() => setSettingsDropdownOpen(!settingsDropdownOpen)}
              className="hover:text-yellow-300 transition"
              title="Settings"
            >
              <FiSettings className="w-5 h-5" />
            </button>

            {settingsDropdownOpen && (
              <div className="absolute right-0 top-12 w-56 bg-white border border-gray-200 rounded-md shadow-md z-50">
                <ul className="text-sm text-[#10223E] py-2 font-medium">
                  <li>
                    <button
                      onClick={() => {
                        navigate("/admin/users");
                        setSettingsDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      User Access
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-sm hover:text-red-400 transition"
          title="Logout"
        >
          <FiLogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </header>
  );
}

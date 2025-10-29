import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import veerixLogo from "../../assets/veerixlogo.png";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Home,
  ShoppingCart,
  ChevronLeft,
} from "lucide-react";

const veerixSidebarLinks = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  {
    name: "Customers",
    icon: Users,
    submenu: [{ label: "Customer Details", path: "/admin/customer" }],
  },
  {
    name: "Quote Requests",
    icon: Home,
    submenu: [
      { label: "Quotes", path: "/admin/quote" },
      { label: "Molecules", path: "/admin/molecule" },
    ],
  },
];

export default function AdminSidebar() {
  const [activeMain, setActiveMain] = useState("Dashboard");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSubmenu, setShowSubmenu] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Load state from localStorage on component mount
  useEffect(() => {
    const savedActiveMain = localStorage.getItem("adminActiveMain");
    const savedShowSubmenu = localStorage.getItem("adminShowSubmenu");
    
    if (savedActiveMain) {
      setActiveMain(savedActiveMain);
    }
    
    if (savedShowSubmenu !== null) {
      setShowSubmenu(JSON.parse(savedShowSubmenu));
    }
  }, []);

  // ✅ Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("adminActiveMain", activeMain);
  }, [activeMain]);

  useEffect(() => {
    localStorage.setItem("adminShowSubmenu", JSON.stringify(showSubmenu));
  }, [showSubmenu]);

  // ✅ Automatically set active main menu based on current route
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Find which main menu item corresponds to the current route
    const activeItem = veerixSidebarLinks.find(item => {
      if (item.path === currentPath) return true;
      if (item.submenu) {
        return item.submenu.some(sub => sub.path === currentPath);
      }
      return false;
    });

    if (activeItem) {
      setActiveMain(activeItem.name);
    }
  }, [location.pathname]);

  const selectedItem = veerixSidebarLinks.find(
    (item) => item.name === activeMain
  );

  const handleMainMenuClick = (item) => {
    setActiveMain(item.name);
    
    if (item.path) {
      navigate(item.path);
      setShowSubmenu(false);
    } else if (item.submenu?.length > 0) {
      navigate(item.submenu[0].path);
      setShowSubmenu(true);
    }
    
    // Auto-expand sidebar when clicking a menu item if it's collapsed
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  const handleSubmenuClick = (path) => {
    navigate(path);
    setShowSubmenu(true);
  };

  const toggleSubmenu = () => {
    setShowSubmenu(!showSubmenu);
  };

  return (
    <div className="flex h-screen font-sans">
      {/* Sidebar */}
      <aside
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        className={`bg-[#d1383a] text-white transition-all duration-300 ${
          isExpanded ? "w-54" : "w-20"
        } flex flex-col py-6 shadow-md`}
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img 
            src={veerixLogo} 
            alt="Logo" 
            className={`transition-all duration-300 ${
              isExpanded ? "w-40 px-2" : "w-12"
            }`} 
          />
        </div>

        {/* Menu Items */}
        <nav className="flex flex-col space-y-1 px-2">
          {veerixSidebarLinks.map((item) => {
            const Icon = item.icon;
            const isActive = activeMain === item.name;

            return (
              <button
                key={item.name}
                onClick={() => handleMainMenuClick(item)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all ${
                  isActive ? "bg-white text-[#d1383a]" : "hover:bg-white/10"
                }`}
                title={!isExpanded ? item.name : ""}
              >
                <Icon
                  size={20}
                  className={isActive ? "text-[#d1383a]" : "text-white"}
                />
                {isExpanded && <span className="whitespace-nowrap">{item.name}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Submenu */}
      {selectedItem?.submenu?.length > 0 && showSubmenu && (
        <aside className="w-54 bg-[#F8FAFC] p-6 border-l border-gray-200 relative">
          {/* Close Button */}
          <button
            onClick={toggleSubmenu}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-200 transition-colors"
            title="Close submenu"
          >
            <ChevronLeft size={16} className="text-gray-600" />
          </button>

          <h2 className="text-lg font-semibold text-[#10223E] mb-4 pr-8">
            {selectedItem.name}
          </h2>
          <div className="space-y-2">
            {selectedItem.submenu.map((sub, index) => {
              const isSubActive = location.pathname === sub.path;

              return (
                <button
                  key={index}
                  onClick={() => handleSubmenuClick(sub.path)}
                  className={`block w-full text-left text-sm px-4 py-2 rounded transition-colors ${
                    isSubActive
                      ? "bg-[#d1383a] text-white"
                      : "hover:bg-[#E2F9F7] text-[#10223E]"
                  }`}
                >
                  {sub.label}
                </button>
              );
            })}
          </div>
        </aside>
      )}
    </div>
  );
}
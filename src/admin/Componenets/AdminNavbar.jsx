import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiSettings, FiLogOut } from "react-icons/fi";
import { Bell } from "lucide-react";
import socket from "../../Components/Socket";

export default function AdminNavbar() {
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [role, setRole] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const settingsRef = useRef(null);
  const notifRef = useRef(null);
  const notifListRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Load role
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setRole(storedUser?.role?.toLowerCase() || "admin");
  }, []);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("admin_notifications")) || [];
    setNotifications(saved);
  }, []);

  // Socket connection for admin notifications
  // Socket connection for admin notifications
// Socket connection for admin notifications
useEffect(() => {
  if (role !== "admin") return;
  if (!socket.connected) socket.connect();

  const joinAdminRoom = () => {
    console.log("Socket connected (admin):", socket.id);
    socket.emit("join_admin");
  };

  if (socket.connected) joinAdminRoom();
  else socket.once("connect", joinAdminRoom);

  // Handle quote updates
  const handleQuoteUpdate = ({ quote, change }) => {
    const customerName = quote.customerId?.name || "Customer";
    const message = change?.message
      ? `${change.message} (Brand: ${quote.brandName}, Customer: ${customerName})`
      : `Quote for ${quote.brandName} (Customer: ${customerName}) updated: ${quote.status}${
          change?.stepLabel ? ` → Step: ${change.stepLabel}` : ""
        }`;

    setNotifications((prev) => {
      // ✅ Prevent duplicate messages
      if (prev.some((n) => n.message === message)) return prev;

      const updated = [
        {
          id: Date.now(),
          message,
          time: new Date().toLocaleTimeString(),
          type: "quote",
        },
        ...prev,
      ];
      localStorage.setItem("admin_notifications", JSON.stringify(updated));
      return updated;
    });
  };

  // Handle chat messages
  // Handle chat messages (only show messages from customers)
const handleChatMessage = (msg) => {
  // ✅ Ignore messages sent by admin themselves
  if (msg.sender === "admin") return;

  // ✅ Only show messages that are targeted to admin
  if (msg.target !== "admin") return;

  const customerName = msg.customerName || "Customer";
  const message = `[Chat] ${msg.brandName} (Customer: ${customerName}): ${msg.message}`;

  setNotifications((prev) => {
    // Prevent duplicates
    if (prev.some((n) => n.message === message)) return prev;

    const updated = [
      {
        id: Date.now(),
        message,
        time: new Date().toLocaleTimeString(),
        type: "chat",
      },
      ...prev,
    ];

    localStorage.setItem("admin_notifications", JSON.stringify(updated));
    return updated;
  });
};


  socket.on("quote_updated", handleQuoteUpdate);
  socket.on("chat_message", handleChatMessage);

  return () => {
    socket.off("quote_updated", handleQuoteUpdate);
    socket.off("chat_message", handleChatMessage);
  };
}, [role]);


  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target))
        setSettingsDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target))
        setNotifDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    const page = pageMap.find((p) => pathname.startsWith(p.path));
    return page?.label || "Dashboard";
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("source");
    localStorage.removeItem("admin_notifications");
    navigate("/");
  };

  return (
    <header className="h-[80px] border-b flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm bg-[#d1383a] border-[#1C2E4A] text-white">
      <h1 className="text-xl font-semibold">{getCurrentPageTitle()}</h1>

      <div className="flex items-center gap-6 relative" ref={settingsRef}>
        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
            className="hover:text-yellow-300 transition relative"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-[#10223E] text-xs font-bold rounded-full px-1">
                {notifications.length}
              </span>
            )}
          </button>

          {notifDropdownOpen && (
            <div className="absolute right-0 top-12 w-72 bg-white border border-gray-200 rounded-md shadow-md z-50 max-h-80 overflow-y-auto">
              <ul
                ref={notifListRef}
                className="text-sm text-[#10223E] font-medium divide-y"
              >
                {notifications.length === 0 ? (
                  <li className="px-4 py-3 text-gray-500">No notifications</li>
                ) : (
                  notifications.map((n) => (
                    <li key={n.id} className="px-4 py-3 hover:bg-gray-100">
                      <p>{n.message}</p>
                      <span className="text-xs text-gray-400">{n.time}</span>
                    </li>
                  ))
                )}
              </ul>

              {notifications.length > 0 && (
                <div className="flex justify-end p-2 border-t">
                  <button
                    onClick={() => {
                      setNotifications([]);
                      localStorage.removeItem("admin_notifications");
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Settings Dropdown */}
    
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
                        navigate("/admin/role");
                        setSettingsDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Role Management
                    </button>
                    <button
                      onClick={() => {
                        navigate("/admin/useraccess");
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
  

        {/* Logout */}
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

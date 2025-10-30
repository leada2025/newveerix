import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiSettings, FiLogOut } from "react-icons/fi";
import { Bell } from "lucide-react";
import socket from "../../Components/Socket";
import axios from "../../api/Axios";
const getDisplayName = (quote) => {
  if (quote.brandName && !quote.brandName.startsWith("__temp_")) {
    return quote.brandName;
  }
  return quote.moleculeName || quote.customMolecule || "Unnamed Product";
};

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

  // 🔹 Load role
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setRole(storedUser?.role?.toLowerCase() || "admin");
  }, []);

  // 🔹 Fetch notifications from DB on mount
  useEffect(() => {
    const fetchNotifications = async () => {
   const token = localStorage.getItem("authToken");

      if (!token) return;
      try {
        const res = await axios.get("/api/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(res.data || []);
      } catch (err) {
        console.error("❌ Error fetching notifications:", err);
      }
    };
    fetchNotifications();
  }, []);

  // 🔹 Socket connection for admin
  useEffect(() => {
    if (role !== "admin") return;
    if (!socket.connected) socket.connect();

    const joinAdminRoom = () => {
      console.log("✅ Admin socket connected:", socket.id);
      socket.emit("join_admin");
    };

    if (socket.connected) joinAdminRoom();
    else socket.once("connect", joinAdminRoom);

    // 📦 Quote update handler
    const handleQuoteUpdate = async ({ quote, change }) => {
      const customerName = quote.customerId?.name || "Customer";
      const displayName = getDisplayName(quote);

  const message = change?.message
    ? `${change.message} (Product: ${displayName}, Customer: ${customerName})`
    : `Quote for ${displayName} (Customer: ${customerName}) updated: ${quote.status}${
        change?.stepLabel ? ` → Step: ${change.stepLabel}` : ""
      }`;

      const newNotif = {
        title: "Quote Update",
        message,
        type: "quote",
        relatedId: quote._id,
      };

      // Save to DB
      try {
        const token = localStorage.getItem("authToken");

        await axios.post("/api/notifications", newNotif, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("❌ Error saving notification:", err);
      }

      // Update UI instantly
      setNotifications((prev) => [
        { id: Date.now(), message, time: new Date().toLocaleTimeString() },
        ...prev,
      ]);
    };

    // 💬 Chat message handler (from customers only)
    const handleChatMessage = async (msg) => {
      if (msg.sender === "admin" || msg.target !== "admin") return;

      const customerName = msg.customerName || "Customer";
      const message = `[Chat] ${msg.brandName} (Customer: ${customerName}): ${msg.message}`;

      // Save to DB
      try {
        const token = localStorage.getItem("authToken");

        await axios.post(
          "/api/notifications",
          { title: "New Chat Message", message, type: "chat" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error("❌ Error saving chat notification:", err);
      }

      // Update UI
      setNotifications((prev) => [
        { id: Date.now(), message, time: new Date().toLocaleTimeString() },
        ...prev,
      ]);
    };

    socket.on("quote_updated", handleQuoteUpdate);
    socket.on("chat_message", handleChatMessage);

    return () => {
      socket.off("quote_updated", handleQuoteUpdate);
      socket.off("chat_message", handleChatMessage);
    };
  }, [role]);

  // 🔹 Close dropdowns on outside click
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

  // 🔹 Mark notifications seen when dropdown opened
  const handleNotifToggle = async () => {
    const newState = !notifDropdownOpen;
    setNotifDropdownOpen(newState);

    if (newState) {
      try {
        const token = localStorage.getItem("authToken");

        await axios.patch(
          "/api/notifications/seen",
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setNotifications((prev) => prev.map((n) => ({ ...n, seen: true })));
      } catch (err) {
        console.error("❌ Error marking notifications as seen:", err);
      }
    }
  };

  // 🔹 Get current page title
  const getCurrentPageTitle = () => {
    const pathname = location.pathname.toLowerCase();
    const pageMap = [
      { path: "/admin/packingtrack", label: "Packing Status" },
      { path: "/admin/designs", label: "Packing Designs" },
      { path: "/admin/packing", label: "Packing Approval" },
      { path: "/admin/customer", label: "Customers" },
      { path: "/admin/quote", label: "Quote Requests" },
      { path: "/admin/molecule", label: "Add Molecule" },
      { path: "/admin/addmolecule", label: "Add Molecule" },
      { path: "/admin/pricing/history", label: "Pricing History" },
      { path: "/admin/users", label: "User Access" },
    ];
    const page = pageMap.find((p) => pathname.startsWith(p.path));
    return page?.label || "Dashboard";
  };

  // 🔹 Logout
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <header className="h-[80px] border-b flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm bg-[#d1383a] text-white">
      <h1 className="text-xl font-semibold">{getCurrentPageTitle()}</h1>

      <div className="flex items-center gap-6 relative" ref={settingsRef}>
        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={handleNotifToggle}
            className="hover:text-yellow-300 transition relative"
          >
            <Bell className="w-5 h-5" />
            {notifications.some((n) => !n.seen) && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-[#10223E] text-xs font-bold rounded-full px-1">
                {notifications.filter((n) => !n.seen).length}
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
                    <li key={n._id || n.id} className="px-4 py-3 hover:bg-gray-100">
                      <p>{n.message}</p>
                      <span className="text-xs text-gray-400">{n.time}</span>
                    </li>
                  ))
                )}
              </ul>

              {notifications.length > 0 && (
                <div className="flex justify-end p-2 border-t">
                  <button
                    onClick={async () => {
                      try {
                       const token = localStorage.getItem("authToken");

                        await axios.delete("/api/notifications/clear", {
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        setNotifications((prev) =>
                          prev.filter((n) => !n.seen)
                        );
                      } catch (err) {
                        console.error("Error clearing notifications:", err);
                      }
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear Seen
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Settings */}
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

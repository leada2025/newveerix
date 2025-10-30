import React, { useState, useEffect ,useRef} from "react";
import { Bell, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import socket from "../Components/Socket";
import axios from "../api/Axios";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [gst, setGst] = useState("");
  const [company, setCompany] = useState("");

  const navbarBg = "bg-[#d1383a]";
  const brandName = "Manufacturing Tracker";
  const navigate = useNavigate();
const dropdownRef = useRef(null); // 👈 ref for notification dropdown
const bellRef = useRef(null); 
 
const getDisplayName = (quote) => {
  if (quote.brandName && !quote.brandName.startsWith("__temp_")) {
    return quote.brandName;
  }
  return quote.moleculeName || quote.customMolecule || "Unnamed Product";
};
// 🔥 Socket setup and listeners
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?._id) return;

    if (!socket.connected) socket.connect();
    socket.emit("join_customer", user._id);

    const quoteListener = ({ quote, change }) => {
      const quoteCustomerId = quote.customerId?._id || quote.customerId;
      if (quoteCustomerId.toString() !== user._id.toString()) return;

      let message;
      if (change?.message) {
        message = `${change.message} (Brand: ${quote.brandName})`;
      } else {
       const statusText = {
  Pending: `Your request for ${getDisplayName(quote)} has been submitted.`,
  "Quote Sent": `A new quote for ${getDisplayName(quote)} has been sent by the admin.`,
  "Approved Quote": `Your quote for ${getDisplayName(quote)} has been approved!`,
  "Payment Requested": `Payment has been requested for ${getDisplayName(quote)}.`,
  Paid: `Your payment for ${getDisplayName(quote)} has been confirmed.`,
  Rejected: `Your quote for ${getDisplayName(quote)} has been rejected.`,
};

        message =
          statusText[quote.status] ||
          `Quote update for ${quote.brandName}: ${quote.status}`;
      }

      setNotifications((prev) => {
        if (prev.some((n) => n.message === message)) return prev;
        return [
          { id: `${Date.now()}-${Math.random()}`, message, type: "quote" },
          ...prev,
        ];
      });
    };

    const messageListener = async (msg) => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) return;

      if (
        msg.customerId.toString() !== user._id.toString() ||
        msg.target !== "customer" ||
        msg.sender !== "admin"
      )
        return;

      const messageText = `[${msg.brandName}] Admin: ${msg.message}`;

      setNotifications((prev) => [
        { id: `${Date.now()}-${Math.random()}`, message: messageText, type: "message" },
        ...prev,
      ]);

      try {
        const token = localStorage.getItem("authToken");
        await axios.post(
          "/api/notifications",
          {
            title: "New Chat Message",
            message: messageText,
            type: "message",
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error("Error saving notification:", err);
      }
    };

    socket.on("quote_updated", quoteListener);
    socket.on("chat_message", messageListener);

    return () => {
      socket.off("quote_updated", quoteListener);
      socket.off("chat_message", messageListener);
    };
  }, []);

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
        console.error("Error fetching notifications:", err);
      }
    };

    fetchNotifications();
  }, []);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("notifications")) || [];
    setNotifications(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

  // 👤 Load profile info
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setCity(user.city || "");
      setGst(user.gst || "");
      setCompany(user.company || "");
    }
  }, []);
const fetchProfile = async () => {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const res = await axios.get("/api/users/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const userData = res.data;
    setName(userData.name);
    setEmail(userData.email);
    setCity(userData.city || "");
    setCompany(userData.companyName || "");
    setGst(userData.GSTno || "");
  } catch (err) {
    console.error("Error fetching profile:", err);
  }
};
useEffect(() => {
  if (profileOpen) {
    fetchProfile();
  }
}, [profileOpen]);

  // 🧩 Save profile changes
 const handleSaveProfile = async () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    const res = await axios.put("/api/users/profile", {
      id: user._id,
      name,
      email,
      password,
      city,
      companyName: company,
      GSTno: gst,
    });

    localStorage.setItem("user", JSON.stringify(res.data));
    setProfileOpen(false);
    alert("Profile updated successfully!");
  } catch (err) {
    console.error(err);
    alert("Error updating profile");
  }
};

  // 🚪 Logout handler
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleOpenNotifications = async () => {
    setOpen(!open);
    if (!open) return;

    const token = localStorage.getItem("authToken");
    try {
      await axios.patch(
        "/api/notifications/seen",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Error marking notifications seen:", err);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, seen: true })));
  };
useEffect(() => {
  function handleClickOutside(event) {
    // If clicking outside both the dropdown and the bell
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target) &&
      bellRef.current &&
      !bellRef.current.contains(event.target)
    ) {
      setOpen(false);
    }
  }

  if (open) {
    document.addEventListener("mousedown", handleClickOutside);
  } else {
    document.removeEventListener("mousedown", handleClickOutside);
  }

  return () => document.removeEventListener("mousedown", handleClickOutside);
}, [open]);

  return (
    <header
      className={`${navbarBg} text-white h-[60px] flex items-center justify-between px-6 shadow-lg sticky top-0 z-50`}
    >
      <span className="text-xl font-bold tracking-wide">{brandName}</span>

      <div className="flex items-center gap-4 relative">
        {/* Notification Bell */}
        <button
         ref={bellRef}
          onClick={handleOpenNotifications}
          className="relative p-2 rounded-full hover:bg-white/20 transition"
        >
          <Bell size={22} />
          {notifications.some((n) => !n.seen) && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-xs text-white rounded-full px-1">
              {notifications.filter((n) => !n.seen).length}
            </span>
          )}
        </button>

        {/* Notifications Dropdown */}
        {open && (
          <div   ref={dropdownRef} className="absolute right-0 top-12 bg-white text-black rounded-lg shadow-lg w-64 p-3 max-h-64 overflow-y-auto z-50">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-500">No new notifications</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="p-2 border-b last:border-none text-sm">
                  {n.message}
                </div>
              ))
            )}
            <div className="flex justify-between mt-3">
              <button
                onClick={async () => {
                  try {
                    const token = localStorage.getItem("authToken");
                    await axios.delete("/api/notifications/clear", {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    setNotifications([]);
                  } catch (err) {
                    console.error("Error clearing notifications:", err);
                  }
                }}
                className="text-gray-500 text-sm"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Profile Button */}
        <button
          onClick={() => setProfileOpen(true)}
          className="flex items-center gap-2 px-3 py-1 bg-white/20 hover:bg-white/30 transition rounded-full"
        >
          <User size={18} />
          <span className="text-sm">Profile</span>
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1 bg-white/20 hover:bg-white/30 transition rounded-full"
        >
          <LogOut size={18} />
          <span className="text-sm">Logout</span>
        </button>
      </div>

      {/* Profile Modal */}
      {profileOpen && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
    {/* Wrapper that limits overall modal height */}
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-fadeIn overflow-hidden">
      {/* Header */}
      <div className="flex flex-col items-center p-6 border-b bg-gradient-to-r from-[#d1383a] to-[#b72f31] rounded-t-2xl">
        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-3">
          <User size={40} className="text-white" />
        </div>
        <h3 className="text-2xl font-bold text-white">Edit Profile</h3>
        <p className="text-sm text-white/80 mt-1">Manage your account details</p>
      </div>

      {/* Scrollable Middle Section */}
      <div className="p-6 space-y-5 overflow-y-auto flex-1">
        {/* Name */}
        <div>
          <label className="text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg p-3 mt-1 text-black focus:ring-2 focus:ring-[#d1383a] outline-none transition"
          />
        </div>

        {/* Email */}
        <div>
          <label className="text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg p-3 mt-1 text-black focus:ring-2 focus:ring-[#d1383a] outline-none transition"
          />
        </div>

        {/* Company */}
        <div>
          <label className="text-sm font-medium text-gray-700">Company</label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full border rounded-lg p-3 mt-1 text-black focus:ring-2 focus:ring-[#d1383a] outline-none transition"
            placeholder="Your company name"
          />
        </div>

        {/* City */}
        <div>
          <label className="text-sm font-medium text-gray-700">City</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full border rounded-lg p-3 mt-1 text-black focus:ring-2 focus:ring-[#d1383a] outline-none transition"
            placeholder="Enter your city"
          />
        </div>

        {/* GST */}
        <div>
          <label className="text-sm font-medium text-gray-700">GST Number</label>
          <input
            type="text"
            value={gst}
            onChange={(e) => setGst(e.target.value)}
            className="w-full border rounded-lg p-3 mt-1 text-black focus:ring-2 focus:ring-[#d1383a] outline-none transition"
            placeholder="Enter your GST number"
          />
        </div>

        {/* Password */}
        <div>
          <label className="text-sm font-medium text-gray-700">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg p-3 mt-1 pr-12 text-black focus:ring-2 focus:ring-[#d1383a] outline-none transition"
              placeholder="Enter new password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#d1383a] transition"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>
      </div>

      {/* Footer (fixed at bottom of modal) */}
      <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-2xl">
        <button
          onClick={handleSaveProfile}
          className="flex-1 bg-[#d1383a] hover:bg-[#b72f31] text-white py-2.5 rounded-lg font-medium shadow-md transition"
        >
          Save Changes
        </button>
        <button
          onClick={() => setProfileOpen(false)}
          className="flex-1 border border-gray-300 hover:bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium transition"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

    </header>
  );
}

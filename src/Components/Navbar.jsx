import React, { useState, useEffect } from "react";
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
  const navbarBg = "bg-[#d1383a]";
  const brandName = "Manufacturing Tracker";
  const navigate = useNavigate();

  // 🔥 Connect to socket
// 🔥 Connect to socket and listen for updates
useEffect(() => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user?._id) return;

  if (!socket.connected) socket.connect();
  socket.emit("join_customer", user._id);
  console.log(`Joined room: customer_${user._id}`);

  // Quote updates listener
  const quoteListener = ({ quote, change }) => {
    const quoteCustomerId = quote.customerId?._id || quote.customerId;
    if (quoteCustomerId.toString() !== user._id.toString()) return;

    let message;
    if (change?.message) {
      message = `${change.message} (Brand: ${quote.brandName})`;
    } else {
      const statusText = {
        Pending: `Your request for ${quote.brandName} has been submitted.`,
        "Quote Sent": `A new quote for ${quote.brandName} has been sent by the admin.`,
        "Approved Quote": `Your quote for ${quote.brandName} has been approved!`,
        "Payment Requested": `Payment has been requested for ${quote.brandName}.`,
        Paid: `Your payment for ${quote.brandName} has been confirmed.`,
        Rejected: `Your quote for ${quote.brandName} has been rejected.`,
      };
      message =
        statusText[quote.status] ||
        `Quote update for ${quote.brandName}: ${quote.status}`;
    }

    setNotifications((prev) => {
      // ✅ prevent duplicates
      if (prev.some((n) => n.message === message)) return prev;
      return [{ id: Date.now(), message, type: "quote" }, ...prev];
    });
  };

  // Chat messages listener
// Chat messages listener
const messageListener = (msg) => {
  // Skip if it's my own message
  if (msg.sender === "customer") return;

  if (msg.customerId.toString() !== user._id.toString()) return;

  const message = `[${msg.brandName}] New message: ${msg.message}`;
  setNotifications((prev) => {
    if (prev.some((n) => n.message === message)) return prev;
    return [{ id: Date.now(), message, type: "message" }, ...prev];
  });
};


  socket.on("quote_updated", quoteListener);
  socket.on("chat_message", messageListener);

  return () => {
    socket.off("quote_updated", quoteListener);
    socket.off("chat_message", messageListener);
  };
}, []);

// Load from localStorage when component mounts
useEffect(() => {
  const saved = JSON.parse(localStorage.getItem("notifications")) || [];
  setNotifications(saved);
}, []);

// Save to localStorage whenever notifications change
useEffect(() => {
  localStorage.setItem("notifications", JSON.stringify(notifications));
}, [notifications]);


useEffect(() => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user) {
    setName(user.name);
    setEmail(user.email);
  }
}, []);

const handleSaveProfile = async () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));

    const res = await axios.put("/api/users/profile", {
      id: user._id,
      name,
      email,
      password,
    });

    // ✅ Update localStorage
    localStorage.setItem("user", JSON.stringify(res.data));

    setProfileOpen(false);
    alert("Profile updated successfully!");
  } catch (err) {
    console.error(err);
    alert("Error updating profile");
  }
};

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <header
      className={`${navbarBg} text-white h-[60px] flex items-center justify-between px-6 shadow-lg sticky top-0 z-50`}
    >
      {/* Brand / Logo */}
      <span className="text-xl font-bold tracking-wide">{brandName}</span>

      {/* Right Actions */}
      <div className="flex items-center gap-4 relative">
        {/* Notification Bell */}
        <button
          onClick={() => setOpen(!open)}
          className="relative p-2 rounded-full hover:bg-white/20 transition"
        >
          <Bell size={22} />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-xs text-white rounded-full px-1">
              {notifications.length}
            </span>
          )}
        </button>

        {/* Notification dropdown */}
        {open && (
          <div className="absolute right-0 top-12 bg-white text-black rounded-lg shadow-lg w-64 p-3 max-h-64 overflow-y-auto z-50">
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
                onClick={() => setNotifications([])}
                className="text-gray-500 text-sm"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Profile */}
        <button
          onClick={() => setProfileOpen(true)}
          className="flex items-center gap-2 px-3 py-1 bg-white/20 hover:bg-white/30 transition rounded-full"
        >
          <User size={18} />
          <span className="text-sm ">Profile</span>
        </button>

        {/* Logout */}
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
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col items-center p-6 border-b bg-gradient-to-r from-[#d1383a] to-[#b72f31] rounded-t-2xl">
        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-3">
          <User size={40} className="text-white" />
        </div>
        <h3 className="text-2xl font-bold text-white">Edit Profile</h3>
        <p className="text-sm text-white/80 mt-1">
          Manage your account details
        </p>
      </div>

      {/* Form */}
      <div className="p-6 space-y-5">
        {/* Name */}
        <div>
          <label className="text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg p-3 mt-1 text-black focus:ring-2 focus:ring-[#d1383a] outline-none transition"
            placeholder="Your name"
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
            placeholder="Your email"
          />
        </div>

        {/* Password */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            New Password
          </label>
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

      {/* Footer Actions */}
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

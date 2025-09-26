import React, { useState } from "react";
import { Bell, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navbarBg = "bg-[#d1383a]"; // change theme here
  const brandName = "Manufacturing Tracker"; // static brand
const navigate = useNavigate();
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
          <span className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full animate-ping"></span>
        </button>

        {/* Notification dropdown */}
        {open && (
          <div className="absolute right-0 top-12 bg-white text-black rounded-lg shadow-lg w-64 p-3 max-h-64 overflow-y-auto">
            <p className="text-sm text-gray-500">No new notifications</p>
            <div className="flex justify-between mt-3">
              <button className="text-gray-500 text-sm">Clear</button>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all scale-100">
            {/* Header */}
            <div className="flex flex-col items-center p-6 border-b">
              <div className="w-16 h-16 rounded-full bg-[#d1383a]/10 flex items-center justify-center mb-3">
                <User size={32} className="text-[#d1383a]" />
              </div>
              <h3 className="text-xl font-semibold text-[#d1383a]">
                Edit Profile
              </h3>
              <p className="text-sm text-gray-500">
                Update your account details
              </p>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  className="w-full border rounded-lg p-2.5 mt-1 text-black focus:ring-2 focus:ring-[#d1383a] outline-none"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full border rounded-lg p-2.5 mt-1 text-black focus:ring-2 focus:ring-[#d1383a] outline-none"
                  placeholder="Your email"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full border rounded-lg p-2.5 mt-1 pr-10 text-black focus:ring-2 focus:ring-[#d1383a] outline-none"
                    placeholder="New Password"
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

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button className="flex-1 bg-[#d1383a] hover:bg-[#b72f31] text-white py-2 rounded-lg font-medium shadow-md transition">
                  Save Changes
                </button>
                <button
                  onClick={() => setProfileOpen(false)}
                  className="flex-1 border border-gray-300 hover:bg-gray-100 text-gray-700 py-2 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

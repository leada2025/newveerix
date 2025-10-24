import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/Axios";
import { Eye, EyeOff } from "lucide-react";
import veerixLogo from "../assets/veerixlogo.png";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post("/api/users/login", { email, password });

      const { token, user } = res.data;
      const roleName = typeof user.role === "object" ? user.role.name : user.role;

      localStorage.setItem("authToken", token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: roleName,
          permissions: user.permissions || [],
        })
      );

      if (roleName?.toLowerCase() === "customer") {
        navigate("/welcome");
      } else {
        navigate("/admin/dashboard");
      }
    } catch (err) {
      console.error(err);
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-col items-center bg-[#d1383a] text-white py-6 px-4">
          <img src={veerixLogo} alt="Veerix Logo" className="h-14 w-auto mb-2" />
          <h2 className="text-2xl font-bold">Welcome Back</h2>
          <p className="text-sm opacity-80 mt-1">Login to your Veerix account</p>
        </div>

        {/* Form */}
        <div className="p-6 md:p-8">
          {error && (
            <p className="text-red-500 text-center text-sm font-medium mb-4">
              {error}
            </p>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d1383a]"
                placeholder="Enter your email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d1383a]"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 rounded-lg font-semibold bg-[#d1383a] text-white hover:bg-[#b32e2f] transition duration-200"
            >
              Login
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 py-4 text-center text-sm text-gray-600 border-t">
          Don’t have an account?{" "}
          <span
            onClick={() => navigate("/signup")}
            className="text-[#d1383a] font-semibold cursor-pointer hover:underline"
          >
            Sign Up
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

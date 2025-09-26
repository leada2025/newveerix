import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/Axios";
import { Eye, EyeOff } from "lucide-react"; // 👈 add icons
import veerixLogo from "../assets/v_logo.png";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // 👈 toggle state
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const res = await axios.post("/api/users/login", {
      email,
      password,
    });

    const { token, user } = res.data;
    localStorage.setItem("authToken", token);
    localStorage.setItem("user", JSON.stringify(user));

    // ✅ Redirect based on role
    if (user.role === "admin") {
      navigate("/admin"); // admin landing page
    } else {
      navigate("/orders"); // customer landing page
    }
  } catch (err) {
    console.error(err);
    setError("Invalid email or password");
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#f0f9ff]">
      <div className="max-w-md w-full bg-white shadow-md rounded-2xl p-8 space-y-6">
        <div className="flex justify-center">
          <img src={veerixLogo} alt="Veerix Logo" className="h-16" />
        </div>
        <h2 className="text-2xl font-bold text-center text-[#d1383a]">
          Veerix Login
        </h2>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <form className="space-y-4" onSubmit={handleLogin}>
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
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
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
                className="mt-1 w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Login button */}
          <button
            type="submit"
            className="w-full py-2 rounded-md font-semibold bg-[#d1383a] text-white hover:bg-[#b52f30] transition"
          >
            Login
          </button>
        </form>

        {/* Signup link */}
        <p className="text-center text-sm">
          Don’t have an account?{" "}
          <span
            onClick={() => navigate("/")}
            className="text-[#d1383a] cursor-pointer hover:underline"
          >
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

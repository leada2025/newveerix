import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/Axios";
import veerixLogo from "../assets/v_logo.png";

const SignupPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    city: "",
    companyName: "",
    GSTno: "",
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/users/signup", {
        ...form,
        role: "customer",
      });

      const { token, user } = res.data;
      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(user));

      alert("🎉 Signup successful! Please log in to continue.");
      navigate("/login");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#f0f9ff]">
      <div className="max-w-md w-full bg-white shadow-md rounded-2xl p-8 space-y-6">
        <div className="flex justify-center">
          <img src={veerixLogo} alt="Veerix Logo" className="h-16" />
        </div>

        <h2 className="text-2xl font-bold text-center text-[#d1383a]">
          Create Account
        </h2>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <form className="space-y-4" onSubmit={handleSignup}>
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700">City</label>
            <input
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="Enter your city"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Company Name
            </label>
            <input
              type="text"
              name="companyName"
              value={form.companyName}
              onChange={handleChange}
              placeholder="Enter your company name"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {/* GST No */}
          <div>
            <label className="block text-sm font-medium text-gray-700">GST Number</label>
            <input
              type="text"
              name="GSTno"
              value={form.GSTno}
              onChange={handleChange}
              placeholder="Enter GST number"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700 text-sm"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-2 rounded-md font-semibold bg-[#d1383a] text-white hover:bg-[#b52f30] transition"
          >
            Sign Up
          </button>
        </form>

        <p className="text-center text-sm">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-[#d1383a] cursor-pointer hover:underline"
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;

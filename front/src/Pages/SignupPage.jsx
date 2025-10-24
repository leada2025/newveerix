import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/Axios";
import veerixLogo from "../assets/veerixlogo.png";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="w-full max-w-3xl bg-white shadow-2xl rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-col items-center bg-[#d1383a] text-white py-6 px-4">
          <img src={veerixLogo} alt="Veerix Logo" className="h-14 w-auto mb-2" />
          <h2 className="text-2xl font-bold">Create Your Account</h2>
          <p className="text-sm opacity-80 mt-1">
            Sign up to get started with Veerix
          </p>
        </div>

        {/* Form */}
        <div className="p-6 md:p-8">
          {error && (
            <p className="text-red-500 text-center text-sm font-medium mb-4">
              {error}
            </p>
          )}

          <form onSubmit={handleSignup} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Full name"
                  value={form.name}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d1383a]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Email address"
                  value={form.email}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d1383a]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={form.city}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d1383a]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <input
                  type="text"
                  name="companyName"
                  placeholder="Company name"
                  value={form.companyName}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d1383a]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  GST Number
                </label>
                <input
                  type="text"
                  name="GSTno"
                  placeholder="GST number"
                  value={form.GSTno}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d1383a]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d1383a]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-sm text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 mt-4 rounded-lg font-semibold bg-[#d1383a] text-white hover:bg-[#b32e2f] transition duration-200"
            >
              Sign Up
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 py-4 text-center text-sm text-gray-600 border-t">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-[#d1383a] font-semibold cursor-pointer hover:underline"
          >
            Login
          </span>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;

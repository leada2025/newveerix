import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const WelcomePage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // countdown timer
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    // redirect after 3 seconds
    const timer = setTimeout(() => {
      navigate("/dashboard");
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fdf2f2] via-[#f0f9ff] to-[#e0f2fe] px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="backdrop-blur-lg bg-white/70 p-10 rounded-3xl shadow-xl text-center max-w-md w-full border border-white/40"
      >
        {/* Welcome Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-extrabold text-[#d1383a] drop-shadow-sm"
        >
          Welcome, {user?.name}!
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-700 mt-4 text-lg"
        >
          You’re signed in with{" "}
          <span className="font-medium">{user?.email}</span>
        </motion.p>

        {/* Divider */}
        <div className="w-20 h-1 bg-[#d1383a] mx-auto mt-6 rounded-full" />

        {/* Countdown */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-gray-500 text-sm"
        >
          Redirecting to your orders in{" "}
          <span className="font-semibold text-[#d1383a]">{countdown}</span> sec...
        </motion.p>

        {/* CTA Button (still available in case user wants to click early) */}
        <motion.button
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={() => navigate("/dashboard")}
          className="mt-6 px-6 py-3 text-lg font-semibold rounded-xl text-white bg-gradient-to-r from-[#d1383a] to-[#b52f30] shadow-lg hover:shadow-xl hover:scale-105 transition-transform duration-300"
        >
          START
        </motion.button>
      </motion.div>
    </div>
  );
};

export default WelcomePage;

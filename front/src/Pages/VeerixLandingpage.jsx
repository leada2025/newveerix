import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import veerixLogo from "../assets/v_logo.png";
import { Settings } from "lucide-react";

const VeerixOrdersLanding = () => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [shutterIndex, setShutterIndex] = useState(null);

  const workflowCard = {
    title: "Veerix Value Link",
    description: "Manage your brand & orders",
    image: veerixLogo,
    onClick: () => {
      navigate("/signup");
    },
    bg: "bg-white backdrop-blur-md",
    textColor: "text-[#d1383a]",
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCardClick = (onClick) => {
    if (shutterIndex !== null) return;
    setShutterIndex(0);
    setTimeout(() => {
      onClick();
      setShutterIndex(null);
    }, 700);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center text-white overflow-hidden font-sans">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#d1383a] via-[#b12f31] to-[#8a2326] -z-20"></div>

      {/* Settings Dropdown */}
      <div className="absolute top-5 right-5 z-10" ref={dropdownRef}>
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-40 bg-white text-black shadow-lg rounded-md py-2 z-50">
            <button
              onClick={() => {
                setShowDropdown(false);
                navigate("/admin");
              }}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              Admin
            </button>
          </div>
        )}
      </div>

      {/* Hero Section */}
      <section className="relative z-40 text-center py-20 px-6 max-w-3xl">
        <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">We Make Private Label, Made Simple</h1>
        <p className="text-lg md:text-xl drop-shadow">
          Fast. Organized. High-Quality. Veerix Value Link transforms your private label vision into market-ready products — faster, smoother, and more profitably.
        </p>
      </section>

      {/* Why Choose Us */}
      <section className="relative z-10 w-full max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 drop-shadow">Why Choose Veerix Value Link?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-gray-100 text-center">
          {[
            { title: "Speed to Market", desc: "Accelerated timelines without compromising quality." },
            { title: "End-to-End Organization", desc: "From idea to delivery, every step is structured and transparent." },
            { title: "Seamless Communication", desc: "One channel, one team, no confusion." },
            { title: "Multi-Sector Expertise", desc: "Healthcare, Medtech, Pharma, Cosmetics, and Nutraceuticals." },
          ].map((item, i) => (
            <div key={i} className="bg-white/10 p-6 rounded-xl backdrop-blur-md hover:bg-white/20 transition duration-300 shadow-lg">
              <h3 className="font-semibold text-xl mb-2">{item.title}</h3>
              <p className="text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Our Private Label Solutions */}
      <section className="relative z-10 max-w-5xl px-6 py-10">
        <h2 className="text-2xl font-bold text-center mb-8">Our Private Label Solutions</h2>
        <div className="space-y-6 text-white text-lg">
          <p><strong>Healthcare & Medtech –</strong> Custom devices, diagnostics, and patient care products meeting the highest safety standards.</p>
          <p><strong>Pharmaceuticals –</strong> Regulatory-compliant formulations, WHO-GMP manufacturing, and customized packaging.</p>
          <p><strong>Cosmetics & Personal Care –</strong> Beauty and skincare products tailored to your brand’s vision.</p>
          <p><strong>Nutraceuticals –</strong> Science-backed supplements and functional foods that win customer trust.</p>
        </div>
      </section>

      {/* How We Work */}
      <section className="relative z-10 max-w-5xl px-6 py-10">
        <h2 className="text-2xl font-bold text-center mb-8">How We Work</h2>
        <ul className="list-disc list-inside space-y-2 text-white text-lg">
          <li><strong>Concept & Consultation –</strong> Define your goals, budget, and timelines.</li>
          <li><strong>Product Development –</strong> Formulation, prototyping, and compliance checks.</li>
          <li><strong>Branding & Packaging –</strong> Custom design and market-ready presentation.</li>
          <li><strong>Manufacturing & Quality Control –</strong> Delivered to your specifications.</li>
          <li><strong>On-Time Delivery –</strong> Reliable, trackable, and ready for launch.</li>
        </ul>
      </section>

      {/* Call to Action */}
      <section className="relative z-10 text-center py-10">
        <h2 className="text-3xl font-bold mb-4">Your Competitive Edge</h2>
        <p className="max-w-3xl mx-auto mb-6">
          With Veerix Value Link, you’re not just outsourcing production — you’re gaining a partner obsessed with speed, precision, and results.
        </p>
      </section>

      {/* Workflow Selection */}
      <section className="relative z-10 text-center w-full max-w-md py-16">
        <h2 className="text-3xl font-bold mb-10 drop-shadow">Start Your Workflow</h2>
        <div
          onClick={() => handleCardClick(workflowCard.onClick)}
          className={`${workflowCard.bg} ${workflowCard.textColor} border border-white/30 cursor-pointer rounded-xl p-4 flex flex-col items-center justify-center text-center hover:shadow-2xl transform transition-transform hover:scale-105 h-[240px] relative overflow-hidden max-w-xs mx-auto`}
        >
          {shutterIndex === 0 && (
            <>
              <div className="absolute top-0 left-0 w-full h-1/2 bg-black/50 shutter-top origin-bottom"></div>
              <div className="absolute bottom-0 left-0 w-full h-1/2 bg-black/50 shutter-bottom origin-top"></div>
            </>
          )}
          <div className="flex justify-center items-center h-[120px] mb-3 z-10 relative">
            <img src={workflowCard.image} alt={workflowCard.title} className="max-h-[100px] max-w-[150px] object-contain" />
          </div>
          <div className="z-10 relative">
            <h3 className="text-xl font-semibold mb-1">{workflowCard.title}</h3>
            <p className="text-sm">{workflowCard.description}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default VeerixOrdersLanding;

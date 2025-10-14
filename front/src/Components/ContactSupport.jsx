import React, { useState, useEffect } from "react";
import { FaPhoneAlt, FaWhatsapp, FaTimes, FaCommentDots } from "react-icons/fa";
import GlobalChat from "./GlobalChat";
import socket from "../Components/Socket";

const ContactSupport = ({ customerId }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(() => {
    return localStorage.getItem("isPanelOpen") === "true" || false;
  });
  const [showChat, setShowChat] = useState(() => {
    return localStorage.getItem("showChat") === "true" || false;
  });
  const [unreadCount, setUnreadCount] = useState(0);

  const supportNumber = "+911234567890";
  const whatsappLink = `https://wa.me/${supportNumber.replace(/\D/g, "")}`;

  useEffect(() => {
    if (!customerId) return;

    if (socket.connected) {
      socket.emit("join_support_room", { _id: customerId, role: "customer" });
    }

    const handler = (msg) => {
      if (msg.sender === "admin" && msg.target === "customer") {
        setUnreadCount((c) => c + 1);
      }
    };
    socket.on("support_chat", handler);

    return () => socket.off("support_chat", handler);
  }, [customerId]);

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem("isPanelOpen", isPanelOpen);
    localStorage.setItem("showChat", showChat);
  }, [isPanelOpen, showChat]);

  const handleOpenChat = () => {
    setIsPanelOpen(true);
    setShowChat(true); // directly show chat
    setUnreadCount(0);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setShowChat(false);
  };

  return (
    <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 999 }}>
      {/* Floating Button */}
      {!isPanelOpen ? (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
    {/* ✅ Image above button */}
    <img
      src="/images/wearehere.png" // ← your support icon or logo
      alt="Contact Support"
      style={{
        width: "205px",
        height: "105px",
        objectFit: "contain",
  
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
        cursor: "pointer",
      }}
      onClick={() => setIsPanelOpen(true)} // optional click on image too
    />

    {/* Chat button */}
    <button
      onClick={() => setIsPanelOpen(true)}
      style={{
        backgroundColor: "#d1383a",
        border: "none",
        borderRadius: "50%",
        width: "60px",
        height: "60px",
        color: "#fff",
        fontSize: "28px",
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <FaCommentDots />
      {unreadCount > 0 && (
        <span
          style={{
            position: "absolute",
            top: "-5px",
            right: "-5px",
            backgroundColor: "#ff3b30",
            color: "#fff",
            borderRadius: "50%",
            fontSize: "12px",
            padding: "2px 6px",
          }}
        >
          {unreadCount}
        </span>
      )}
    </button>
  </div>
) : (

        // Panel
        <div
          style={{
            width: "350px",
            maxHeight: "500px",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            fontFamily: "Arial, sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              backgroundColor: "#d1383a",
              color: "#fff",
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontWeight: 600,
              fontSize: "16px",
            }}
          >
            Contact Support
            <FaTimes
              style={{ cursor: "pointer" }}
              onClick={handleClosePanel}
            />
          </div>

          {/* Info / Quick Actions */}
          {!showChat && (
            <div
              style={{
                padding: "10px 16px",
                borderBottom: "1px solid #eee",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ fontWeight: 600 }}>Support: {supportNumber}</div>
              <div style={{ display: "flex", gap: "10px" }}>
                <a href={`tel:${supportNumber}`} style={{ color: "#25D366" }}>
                  <FaPhoneAlt size={20} />
                </a>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#25D366" }}
                >
                  <FaWhatsapp size={20} />
                </a>
                <button
                  onClick={handleOpenChat}
                  style={{
                    backgroundColor: "#d1383a",
                    border: "none",
                    borderRadius: "20px",
                    padding: "6px 12px",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Live Chat
                </button>
              </div>
            </div>
          )}

          {/* Chat */}
          {showChat && customerId && (
            <div style={{ flex: 1, overflow: "hidden" }}>
              <GlobalChat customerId={customerId} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContactSupport;

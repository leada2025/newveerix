import React, { useState, useEffect, useRef } from "react";
import { FaPhoneAlt, FaWhatsapp, FaTimes, FaCommentDots } from "react-icons/fa";
import GlobalChat from "./GlobalChat";
import socket from "../Components/Socket";
import axios from "../api/Axios";

const ContactSupport = ({ customerId }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(() => {
    return localStorage.getItem("isPanelOpen") === "true" || false;
  });
  const [showChat, setShowChat] = useState(() => {
    return localStorage.getItem("showChat") === "true" || false;
  });
  const [unreadCount, setUnreadCount] = useState(0);

  const panelRef = useRef(null); // 🔹 Ref for detecting outside clicks
  const supportNumber = "+911234567890";
  const whatsappLink = `https://wa.me/${supportNumber.replace(/\D/g, "")}`;

  // 🔹 Fetch unread count from backend
  const fetchUnread = async () => {
    if (!customerId) return;
    try {
      const res = await axios.get(`/api/globalChat/unread-customer/${customerId}`);
      setUnreadCount(res.data.customerUnread || 0);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  };

  useEffect(() => {
    fetchUnread();
  }, [customerId]);

  // 🔹 Setup socket for real-time messages
  useEffect(() => {
    if (!customerId) return;
    if (!socket.connected) socket.connect();

    socket.emit("join_support_room", { _id: customerId, role: "customer" });

    const handleMessage = (msg) => {
      if (msg.customerId === customerId && msg.sender === "admin") {
        if (!showChat) {
          setUnreadCount((prev) => prev + 1);
        } else {
          fetchUnread();
        }
      }
    };

    socket.on("global_chat_message", handleMessage);
    return () => socket.off("global_chat_message", handleMessage);
  }, [customerId, showChat]);

  // 🔹 Persist state
  useEffect(() => {
    localStorage.setItem("isPanelOpen", isPanelOpen);
    localStorage.setItem("showChat", showChat);
  }, [isPanelOpen, showChat]);

  // 🔹 Outside click handler
  useEffect(() => {
    if (!isPanelOpen) return;

    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsPanelOpen(false);
        setShowChat(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPanelOpen]);

  const handleOpenPanel = () => {
    setIsPanelOpen(true);
    setShowChat(false);
  };

  const handleOpenChat = async () => {
    setShowChat(true);
    try {
      await axios.post(`/api/globalChat/reset-customer-unread/${customerId}`);
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to reset unread count:", err);
    }
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setShowChat(false);
  };

  return (
    <div style={{ position: "fixed", bottom: "20px", left: "20px", zIndex: 999 }}>
      {!isPanelOpen ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <img
            src="/images/wearehere.png"
            alt="Contact Support"
            style={{
              width: "205px",
              height: "105px",
              objectFit: "contain",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
              cursor: "pointer",
            }}
            onClick={handleOpenPanel}
          />
          <button
            onClick={handleOpenPanel}
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
              marginTop: "10px",
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
        <div
          ref={panelRef} // 👈 attached ref for outside click detection
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
            <FaTimes style={{ cursor: "pointer" }} onClick={handleClosePanel} />
          </div>

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

          {showChat && customerId && (
            <div style={{ flex: 1, overflow: "hidden" }}>
              <GlobalChat
                customerId={customerId}
                onMessageReceived={() => setUnreadCount(0)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContactSupport;

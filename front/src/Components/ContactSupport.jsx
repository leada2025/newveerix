import React, { useState, useEffect } from "react";
import { FaPhoneAlt, FaWhatsapp, FaTimes } from "react-icons/fa";
import socket from "../Components/Socket"; // ✅ make sure this path is correct
import SupportChatPopup from "../Components/SupportChatPopup"; // ✅ your support chat popup component
import { joinSupportRoom } from "../Components/Socket";

const ContactSupport = ({ customerId }) => {
  const [open, setOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const supportNumber = "+911234567890"; // Replace with your support number
  const whatsappLink = `https://wa.me/${supportNumber.replace(/\D/g, "")}`;

  useEffect(() => {
    // ✅ Join customer support room when component mounts
    if (customerId) {
      joinSupportRoom({ _id: customerId, role: "customer" });
    }

    // ✅ Listen for new messages from support
    socket.on("support_chat", (msg) => {
      // only increment if the admin sent the message
      if (msg.sender === "admin" && msg.target === "customer") {
        setUnreadCount((count) => count + 1);
      }
    });

    return () => {
      socket.off("support_chat");
    };
  }, [customerId]);

  const handleOpenChat = () => {
    setShowChat(true);
    setUnreadCount(0); // reset count when opening chat
  };

  return (
    <>
      {/* Floating Button */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 999,
        }}
      >
        {!open ? (
          <div className="relative">
            <button
              onClick={() => setOpen(true)}
              style={{
                backgroundColor: "#a31d06ff",
                border: "none",
                borderRadius: "50%",
                width: "60px",
                height: "60px",
                color: "#fff",
                fontSize: "28px",
                cursor: "pointer",
                boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
              }}
            >
              💬
            </button>

            {/* 🔴 Unread badge */}
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-5px",
                  right: "-5px",
                  backgroundColor: "red",
                  color: "white",
                  borderRadius: "50%",
                  fontSize: "12px",
                  padding: "2px 6px",
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>
        ) : (
          <div
            style={{
              background: "#fff",
              borderRadius: "10px",
              padding: "15px",
              width: "220px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                alignSelf: "flex-end",
                cursor: "pointer",
                marginBottom: "10px",
              }}
              onClick={() => setOpen(false)}
            >
              <FaTimes />
            </div>

            <h4 style={{ margin: "5px 0", fontWeight: 600 }}>
              Contact Support
            </h4>
            <p style={{ margin: "5px 0" }}>{supportNumber}</p>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <a href={`tel:${supportNumber}`} style={{ color: "#25D366" }}>
                <FaPhoneAlt size={22} />
              </a>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#25D366" }}
              >
                <FaWhatsapp size={22} />
              </a>
              <button
                onClick={handleOpenChat}
                style={{
                  backgroundColor: "#a31d06ff",
                  border: "none",
                  borderRadius: "20px",
                  padding: "5px 12px",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Live Chat
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🗨️ Chat Popup */}
      {showChat && (
        <SupportChatPopup
          customerId={customerId}
          isAdmin={false}
          onClose={() => setShowChat(false)}
        />
      )}
    </>
  );
};

export default ContactSupport;

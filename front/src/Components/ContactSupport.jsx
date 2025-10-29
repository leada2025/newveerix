import React, { useState, useEffect, useRef } from "react";
import { FaPhoneAlt, FaWhatsapp, FaTimes, FaCommentDots, FaHeadset } from "react-icons/fa";
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
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const panelRef = useRef(null);
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
        if (!showChat || isMinimized) {
          setUnreadCount((prev) => prev + 1);
        } else {
          fetchUnread();
        }
      }
    };

    socket.on("global_chat_message", handleMessage);
    return () => socket.off("global_chat_message", handleMessage);
  }, [customerId, showChat, isMinimized]);

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
        handleClosePanel();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPanelOpen]);

  const handleOpenPanel = () => {
    setIsPanelOpen(true);
    setShowChat(false);
    setIsMinimized(false);
    setIsVisible(true);
  };

  const handleOpenChat = async () => {
    setShowChat(true);
    setIsMinimized(false);
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
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleHide = () => {
    setIsVisible(false);
    setTimeout(() => setIsVisible(true), 30000); // Reappear after 30 seconds
  };

  return (
    <div style={{ 
      position: "fixed", 
      bottom: "20px", 
      left: "20px", 
      zIndex: 999,
      transition: "all 0.3s ease-in-out"
    }}>
      {!isPanelOpen ? (
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center",
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "scale(1)" : "scale(0)",
          transition: "all 0.3s ease-in-out"
        }}>
          <div style={{
            background: "linear-gradient(135deg, #d1383a 0%, #a31d06 100%)",
            borderRadius: "50%",
            padding: "8px",
            marginBottom: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            cursor: "pointer"
          }}>
            <img
              src="/images/wearehere.png"
              alt="Contact Support"
              style={{
                width: "60px",
                height: "60px",
                objectFit: "contain",
                filter: "brightness(0) invert(1)",
                cursor: "pointer",
              }}
              onClick={handleOpenPanel}
            />
          </div>
          <button
            onClick={handleOpenPanel}
            style={{
              background: "linear-gradient(135deg, #d1383a 0%, #a31d06 100%)",
              border: "none",
              borderRadius: "50%",
              width: "60px",
              height: "60px",
              color: "#fff",
              fontSize: "24px",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease-in-out",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "scale(1.1)";
              e.target.style.boxShadow = "0 6px 16px rgba(0,0,0,0.4)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
              e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
            }}
          >
            <FaCommentDots />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-5px",
                  right: "-5px",
                  background: "linear-gradient(135deg, #ff3b30 0%, #ff1a1a 100%)",
                  color: "#fff",
                  borderRadius: "50%",
                  fontSize: "12px",
                  padding: "2px 6px",
                  minWidth: "20px",
                  height: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  animation: unreadCount > 0 ? "pulse 2s infinite" : "none"
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={handleHide}
            style={{
              marginTop: "8px",
              background: "transparent",
              border: "none",
              color: "#666",
              fontSize: "12px",
              cursor: "pointer",
              opacity: 0.7,
              transition: "opacity 0.2s"
            }}
            onMouseEnter={(e) => e.target.style.opacity = "1"}
            onMouseLeave={(e) => e.target.style.opacity = "0.7"}
          >
            Hide
          </button>
        </div>
      ) : (
        <div
          ref={panelRef}
          style={{
            width: isMinimized ? "300px" : "380px",
            height: isMinimized ? "60px" : "500px",
            background: "#fff",
            borderRadius: "16px",
            boxShadow: "0 12px 32px rgba(0,0,0,0.3)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
            transition: "all 0.3s ease-in-out",
            border: "1px solid #e1e5e9"
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #d1383a 0%, #a31d06 100%)",
              color: "#fff",
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontWeight: 600,
              fontSize: "16px",
              cursor: "move"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <FaHeadset />
              <span>Customer Support</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={handleMinimize}
                style={{
                  background: "none",
                  border: "none",
                  color: "#fff",
                  fontSize: "14px",
                  cursor: "pointer",
                  opacity: 0.8,
                  transition: "opacity 0.2s"
                }}
                onMouseEnter={(e) => e.target.style.opacity = "1"}
                onMouseLeave={(e) => e.target.style.opacity = "0.8"}
              >
                {isMinimized ? "🗖" : "🗕"}
              </button>
              <FaTimes 
                style={{ 
                  cursor: "pointer",
                  opacity: 0.8,
                  transition: "opacity 0.2s"
                }} 
                onClick={handleClosePanel}
                onMouseEnter={(e) => e.target.style.opacity = "1"}
                onMouseLeave={(e) => e.target.style.opacity = "0.8"}
              />
            </div>
          </div>

          {!isMinimized && (
            <>
              {!showChat && (
                <div
                  style={{
                    padding: "24px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                    background: "#f8f9fa"
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div style={{ 
                      fontSize: "15px", 
                      color: "#2d3748", 
                      marginBottom: "8px",
                      fontWeight: 500
                    }}>
                      How can we help you today?
                    </div>
                    <div style={{ 
                      fontSize: "13px", 
                      color: "#718096",
                      lineHeight: "1.4"
                    }}>
                      Our support team is here to assist you
                    </div>
                  </div>

                  <div style={{
                    background: "#fff",
                    borderRadius: "12px",
                    padding: "16px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                  }}>
                    <div style={{ 
                      fontWeight: 600, 
                      color: "#2d3748",
                      marginBottom: "12px",
                      fontSize: "14px"
                    }}>
                      Contact Options
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {/* Phone Option */}
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px",
                        background: "#f7fafc",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#edf2f7";
                        e.currentTarget.style.borderColor = "#cbd5e0";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#f7fafc";
                        e.currentTarget.style.borderColor = "#e2e8f0";
                      }}>
                        <div style={{
                          width: "32px",
                          height: "32px",
                          background: "linear-gradient(135deg, #48bb78 0%, #38a169 100%)",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: "14px"
                        }}>
                          <FaPhoneAlt />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "13px", color: "#718096" }}>
                            Call us at
                          </div>
                          <div style={{ fontSize: "14px", fontWeight: 600, color: "#2d3748" }}>
                            {supportNumber}
                          </div>
                        </div>
                        <a 
                          href={`tel:${supportNumber}`}
                          style={{
                            background: "linear-gradient(135deg, #48bb78 0%, #38a169 100%)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            padding: "8px 12px",
                            fontSize: "12px",
                            fontWeight: 500,
                            cursor: "pointer",
                            textDecoration: "none",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = "translateY(-1px)";
                            e.target.style.boxShadow = "0 4px 8px rgba(72, 187, 120, 0.3)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = "translateY(0)";
                            e.target.style.boxShadow = "none";
                          }}
                        >
                          Call Now
                        </a>
                      </div>

                      {/* WhatsApp Option */}
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px",
                        background: "#f7fafc",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#edf2f7";
                        e.currentTarget.style.borderColor = "#cbd5e0";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#f7fafc";
                        e.currentTarget.style.borderColor = "#e2e8f0";
                      }}>
                        <div style={{
                          width: "32px",
                          height: "32px",
                          background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: "16px"
                        }}>
                          <FaWhatsapp />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "13px", color: "#718096" }}>
                            Message us on
                          </div>
                          <div style={{ fontSize: "14px", fontWeight: 600, color: "#2d3748" }}>
                            WhatsApp
                          </div>
                        </div>
                        <a 
                          href={whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            padding: "8px 12px",
                            fontSize: "12px",
                            fontWeight: 500,
                            cursor: "pointer",
                            textDecoration: "none",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = "translateY(-1px)";
                            e.target.style.boxShadow = "0 4px 8px rgba(37, 211, 102, 0.3)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = "translateY(0)";
                            e.target.style.boxShadow = "none";
                          }}
                        >
                          Open WhatsApp
                        </a>
                      </div>

                      {/* Live Chat Option */}
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px",
                        background: "#f7fafc",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#edf2f7";
                        e.currentTarget.style.borderColor = "#cbd5e0";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#f7fafc";
                        e.currentTarget.style.borderColor = "#e2e8f0";
                      }}>
                        <div style={{
                          width: "32px",
                          height: "32px",
                          background: "linear-gradient(135deg, #d1383a 0%, #a31d06 100%)",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: "14px"
                        }}>
                          <FaCommentDots />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "13px", color: "#718096" }}>
                            Instant support
                          </div>
                          <div style={{ fontSize: "14px", fontWeight: 600, color: "#2d3748" }}>
                            Live Chat
                          </div>
                        </div>
                        <button
                          onClick={handleOpenChat}
                          style={{
                            background: "linear-gradient(135deg, #d1383a 0%, #a31d06 100%)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            padding: "8px 16px",
                            fontSize: "12px",
                            fontWeight: 500,
                            cursor: "pointer",
                            transition: "all 0.2s",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = "translateY(-1px)";
                            e.target.style.boxShadow = "0 4px 8px rgba(209, 56, 58, 0.3)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = "translateY(0)";
                            e.target.style.boxShadow = "none";
                          }}
                        >
                          Start Chat
                          {unreadCount > 0 && (
                            <span style={{
                              background: "#fff",
                              color: "#d1383a",
                              borderRadius: "50%",
                              fontSize: "10px",
                              fontWeight: "bold",
                              minWidth: "16px",
                              height: "16px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}>
                              {unreadCount}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    fontSize: "11px",
                    color: "#a0aec0",
                    textAlign: "center",
                    lineHeight: "1.4"
                  }}>
                    Typically replies within a few minutes
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
            </>
          )}

          {isMinimized && (
            <div
              style={{
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#f8f9fa",
                cursor: "pointer"
              }}
              onClick={handleMinimize}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "8px",
                  height: "8px",
                  background: unreadCount > 0 ? "#48bb78" : "#a0aec0",
                  borderRadius: "50%"
                }} />
                <span style={{ fontSize: "14px", fontWeight: 500, color: "#2d3748" }}>
                  Support Chat {unreadCount > 0 && `(${unreadCount})`}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#718096" }}>
                Click to expand
              </div>
            </div>
          )}
        </div>
      )}

      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
        `}
      </style>
    </div>
  );
};

export default ContactSupport;
import React, { useState, useEffect, useRef } from "react";
import { FaPaperPlane, FaUser, FaHeadset } from "react-icons/fa";
import socket from "../Components/Socket";
import axios from "../api/Axios";

export default function GlobalChat({ customerId, onMessageReceived }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch message history
  useEffect(() => {
    if (!customerId) return;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(`/api/globalChat/${customerId}`);
        setMessages(res.data);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };
    fetchMessages();

    if (!socket.connected) socket.connect();
    socket.emit("join_global", customerId);

const handleMessage = (msg) => {
  // Ignore echo of your own messages
  if (msg.sender === "customer") return;

  if (msg.customerId === customerId) {
    setMessages((prev) => {
      const alreadyExists = prev.some(
        (m) =>
          m.message === msg.message &&
          m.time === msg.time &&
          m.sender === msg.sender
      );
      if (alreadyExists) return prev;
      return [...prev, msg];
    });
    if (onMessageReceived) onMessageReceived(msg);
  }
};



    const handleTyping = (data) => {
      if (data.customerId === customerId && data.role === "admin") {
        setIsTyping(data.typing);
      }
    };

    socket.on("global_chat_message", handleMessage);
    socket.on("typing_indicator", handleTyping);

    return () => {
      socket.off("global_chat_message", handleMessage);
      socket.off("typing_indicator", handleTyping);
    };
  }, [customerId, onMessageReceived]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async () => {
  if (!input.trim()) return;

  const msg = {
    customerId,
    message: input,
    sender: "customer",
    time: new Date().toISOString(),
  };

  console.log("SENDING MESSAGE:", msg);

  try {
    // Optimistically update UI
    setMessages((prev) => [...prev, msg]);
    setInput("");

    // ✅ Emit message once
    socket.emit("global_customer_message", msg);

    // Emit typing stopped
    socket.emit("typing", { customerId, role: "customer", typing: false });
  } catch (err) {
    console.error("Error sending message:", err);

    // Optional rollback if needed
    setMessages((prev) =>
      prev.filter((m) => m.time !== msg.time || m.message !== msg.message)
    );
  }
};

  const handleInputChange = (e) => {
    setInput(e.target.value);
    socket.emit("typing", { 
      customerId, 
      role: "customer", 
      typing: e.target.value.length > 0 
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timeString) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid #e2e8f0",
        background: "#f8f9fa"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            background: "linear-gradient(135deg, #d1383a 0%, #a31d06 100%)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: "16px"
          }}>
            <FaHeadset />
          </div>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "#2d3748" }}>
              Support Team
            </div>
            <div style={{ fontSize: "12px", color: "#48bb78", display: "flex", alignItems: "center", gap: "4px" }}>
              <div style={{ width: "6px", height: "6px", background: "#48bb78", borderRadius: "50%" }} />
              Online now
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div style={{ 
        flex: 1, 
        overflowY: "auto", 
        padding: "20px",
        background: "linear-gradient(135deg, #f8f9fa 0%, #edf2f7 100%)"
      }}>
        {messages.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            color: "#718096", 
            marginTop: "40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px"
          }}>
            <div style={{
              width: "60px",
              height: "60px",
              background: "linear-gradient(135deg, #d1383a 0%, #a31d06 100%)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "20px"
            }}>
              <FaHeadset />
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>
                Welcome to Support!
              </div>
              <div style={{ fontSize: "14px" }}>
                Start a conversation and we'll help you right away.
              </div>
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                marginBottom: "16px",
                justifyContent: m.sender === "customer" ? "flex-end" : "flex-start",
                animation: "fadeIn 0.3s ease-in-out"
              }}
            >
              <div style={{
                display: "flex",
                flexDirection: "column",
                maxWidth: "70%",
                gap: "4px"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "4px",
                  justifyContent: m.sender === "customer" ? "flex-end" : "flex-start"
                }}>
                  <div style={{
                    width: "24px",
                    height: "24px",
                    background: m.sender === "customer" 
                      ? "linear-gradient(135deg, #d1383a 0%, #a31d06 100%)" 
                      : "linear-gradient(135deg, #4a5568 0%, #2d3748 100%)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "10px"
                  }}>
                    {m.sender === "customer" ? <FaUser /> : <FaHeadset />}
                  </div>
                  <span style={{ 
                    fontSize: "12px", 
                    color: "#718096",
                    fontWeight: 500
                  }}>
                    {m.sender === "customer" ? "You" : "Support Agent"}
                  </span>
                </div>
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "18px",
                    wordWrap: "break-word",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    background: m.sender === "customer"
                      ? "linear-gradient(135deg, #d1383a 0%, #a31d06 100%)"
                      : "#ffffff",
                    color: m.sender === "customer" ? "#ffffff" : "#2d3748",
                    border: m.sender === "customer" ? "none" : "1px solid #e2e8f0"
                  }}
                >
                  <div style={{ lineHeight: "1.4", fontSize: "14px" }}>{m.message}</div>
                </div>
                <div style={{ 
                  fontSize: "11px", 
                  color: "#a0aec0",
                  textAlign: m.sender === "customer" ? "right" : "left",
                  padding: "0 4px"
                }}>
                  {formatTime(m.time)}
                </div>
              </div>
            </div>
          ))
        )}
        
        {isTyping && (
          <div style={{
            display: "flex",
            marginBottom: "16px",
            justifyContent: "flex-start",
            alignItems: "center",
            gap: "8px"
          }}>
            <div style={{
              width: "24px",
              height: "24px",
              background: "linear-gradient(135deg, #4a5568 0%, #2d3748 100%)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "10px"
            }}>
              <FaHeadset />
            </div>
            <div style={{
              padding: "12px 16px",
              background: "#ffffff",
              borderRadius: "18px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
              <div style={{ display: "flex", gap: "4px" }}>
                <div style={{
                  width: "6px",
                  height: "6px",
                  background: "#a0aec0",
                  borderRadius: "50%",
                  animation: "typing 1.4s infinite ease-in-out"
                }} />
                <div style={{
                  width: "6px",
                  height: "6px",
                  background: "#a0aec0",
                  borderRadius: "50%",
                  animation: "typing 1.4s infinite ease-in-out 0.2s"
                }} />
                <div style={{
                  width: "6px",
                  height: "6px",
                  background: "#a0aec0",
                  borderRadius: "50%",
                  animation: "typing 1.4s infinite ease-in-out 0.4s"
                }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ 
        padding: "16px 20px", 
        borderTop: "1px solid #e2e8f0",
        background: "#ffffff"
      }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <textarea
              style={{
                width: "100%",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "12px 16px",
                fontSize: "14px",
                resize: "none",
                outline: "none",
                transition: "all 0.2s",
                background: "#f7fafc",
                minHeight: "44px",
                maxHeight: "120px"
              }}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
            />
          </div>
          <button
            style={{
              background: input.trim() 
                ? "linear-gradient(135deg, #d1383a 0%, #a31d06 100%)" 
                : "#cbd5e0",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              padding: "12px 16px",
              cursor: input.trim() ? "pointer" : "not-allowed",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "44px",
              minHeight: "44px"
            }}
            onClick={sendMessage}
            disabled={!input.trim()}
            onMouseEnter={(e) => {
              if (input.trim()) {
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = "0 4px 12px rgba(209, 56, 58, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "none";
            }}
          >
            <FaPaperPlane />
          </button>
        </div>
        <div style={{ 
          fontSize: "11px", 
          color: "#a0aec0", 
          textAlign: "center", 
          marginTop: "8px" 
        }}>
          Press Enter to send • Shift+Enter for new line
        </div>
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes typing {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-4px); }
          }
        `}
      </style>
    </div>
  );
}
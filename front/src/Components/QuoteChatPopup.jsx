import React, { useState, useEffect, useRef } from "react";
import socket from "./Socket";
import axios from "../api/Axios";
import { X } from "lucide-react";

export default function QuoteChatPopup({ quoteId, customerId, onClose, isAdmin }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [position, setPosition] = useState({ x: window.innerWidth - 340, y: window.innerHeight - 420 }); // starting bottom-right
  const [dragging, setDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });
  const popupRef = useRef(null);
  const messagesEndRef = useRef(null);
  const handlerRef = useRef(null);

  // 🔹 Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔹 Fetch previous chat history
  useEffect(() => {
    if (!quoteId) return;
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`/api/messages/${quoteId}`);
        const sorted = res.data.sort((a, b) => new Date(a.time) - new Date(b.time));
        setMessages(sorted);
      } catch (err) {
        console.error("❌ Failed to fetch messages:", err);
      }
    };
    fetchMessages();
  }, [quoteId]);

  // 🔹 Setup socket connection & listeners
  useEffect(() => {
    if (!socket.connected) socket.connect();

    if (isAdmin) socket.emit("join_admin");
    else socket.emit("join_customer", customerId);

    // Remove any old listeners
    if (handlerRef.current) {
      socket.off("chat_message", handlerRef.current);
      handlerRef.current = null;
    }

    handlerRef.current = (msg) => {
      const { quoteId: qId, message, sender, time, target, customerName, customerId: msgCustomerId } = msg;
      if (qId !== quoteId) return;
      if (isAdmin && target !== "admin") return;
      if (!isAdmin && target !== "customer") return;
      if (!isAdmin && msgCustomerId !== customerId) return;

      setMessages((prev) => {
        const exists = prev.some(
          (m) =>
            m.message === message &&
            m.sender === sender &&
            new Date(m.time).getTime() === new Date(time).getTime()
        );
        if (exists) return prev;
        return [...prev, { message, sender, time, customerName }];
      });
    };

    socket.on("chat_message", handlerRef.current);

    return () => {
      if (handlerRef.current) {
        socket.off("chat_message", handlerRef.current);
        handlerRef.current = null;
      }
    };
  }, [quoteId, customerId, isAdmin]);

  // 🔹 Send message
  const sendMessage = () => {
    if (!input.trim()) return;

    socket.emit(isAdmin ? "admin_message" : "customer_message", {
      quoteId,
      customerId,
      message: input.trim(),
    });

    setInput("");
  };

  // 🔹 Drag logic
  const handleMouseDown = (e) => {
    setDragging(true);
    const rect = popupRef.current.getBoundingClientRect();
    offset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    const newX = Math.min(window.innerWidth - 300, Math.max(0, e.clientX - offset.current.x));
    const newY = Math.min(window.innerHeight - 100, Math.max(0, e.clientY - offset.current.y));
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => setDragging(false);

  // Touch events (for mobile)
  const handleTouchStart = (e) => {
    setDragging(true);
    const rect = popupRef.current.getBoundingClientRect();
    offset.current = {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top,
    };
  };

  const handleTouchMove = (e) => {
    if (!dragging) return;
    const newX = Math.min(window.innerWidth - 300, Math.max(0, e.touches[0].clientX - offset.current.x));
    const newY = Math.min(window.innerHeight - 100, Math.max(0, e.touches[0].clientY - offset.current.y));
    setPosition({ x: newX, y: newY });
  };

  const handleTouchEnd = () => setDragging(false);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  });

  // 🔹 Render message bubble
  const renderMessage = (m, idx) => {
    const isMine = isAdmin ? m.sender === "admin" : m.sender === "customer";
    const senderLabel = isMine ? "You" : isAdmin ? m.customerName || "Customer" : "Admin";

    return (
      <div key={idx} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
        <div
          className={`p-2 rounded-lg max-w-[70%] text-sm ${
            isMine ? "bg-emerald-600 text-white" : "bg-white text-gray-800 border"
          }`}
        >
          <div className="font-semibold text-xs mb-1">{senderLabel}</div>
          {m.message}
          <div className="text-xs text-gray-400 mt-1 text-right">
            {new Date(m.time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={popupRef}
      className="fixed w-80 bg-white rounded-xl shadow-lg flex flex-col overflow-hidden z-[9999] border border-gray-300 cursor-grab active:cursor-grabbing"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        transition: dragging ? "none" : "transform 0.1s ease-out",
      }}
    >
      {/* Header (draggable zone) */}
      <div
        className="bg-emerald-600 text-white p-3 flex justify-between items-center select-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <span className="font-semibold">Chats</span>
        <button onClick={onClose}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-3 overflow-y-auto max-h-64 space-y-2 bg-gray-50">
        {messages.map(renderMessage)}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex p-2 border-t border-gray-200 gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-600"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="px-3 py-2 bg-emerald-600 text-white rounded-full"
        >
          Send
        </button>
      </div>
    </div>
  );
}
